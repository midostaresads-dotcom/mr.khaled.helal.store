import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import db from "./db.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Custom static middleware for uploads with explicit MIME types
  app.use("/uploads", express.static(uploadDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".ogg")) {
        res.setHeader("Content-Type", "audio/ogg");
      }
      // Enable range requests for seeking
      res.setHeader("Accept-Ranges", "bytes");
    }
  }));

  // --- API Routes ---

  // Admin and Stats
  app.post("/api/admin/profile", upload.single("photo"), (req, res) => {
    const { displayName } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const id = 'admin-main'; // Static ID for the main admin

    db.prepare(`
      INSERT INTO admins (id, displayName, photoUrl, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        displayName = COALESCE(?, displayName),
        photoUrl = COALESCE(?, photoUrl),
        updatedAt = CURRENT_TIMESTAMP
    `).run(id, displayName, photoUrl, displayName, photoUrl);

    res.json({ success: true, photoUrl });
  });

  app.get("/api/admin/profile", (req, res) => {
    const admin = db.prepare("SELECT * FROM admins WHERE id = 'admin-main'").get();
    res.json(admin || { displayName: "مستر خالد هلال", photoUrl: null });
  });

  app.get("/api/stats", (req, res) => {
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
    const totalBooks = db.prepare("SELECT COUNT(*) as count FROM books").get() as any;
    const totalMessages = db.prepare("SELECT COUNT(*) as count FROM messages").get() as any;
    const recentOrders = db.prepare("SELECT * FROM orders ORDER BY timestamp DESC LIMIT 5").all();
    const dailyStats = db.prepare("SELECT * FROM dailyStats ORDER BY date DESC LIMIT 7").all();

    res.json({
      overview: {
        orders: totalOrders.count,
        books: totalBooks.count,
        messages: totalMessages.count,
      },
      recentOrders,
      dailyStats
    });
  });

  // Track visits (simple)
  app.post("/api/track-visit", (req, res) => {
    const date = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO dailyStats (date, visits) VALUES (?, 1)
      ON CONFLICT(date) DO UPDATE SET visits = visits + 1
    `).run(date);
    res.json({ success: true });
  });

  // Books / Store
  app.get("/api/books", (req, res) => {
    const books = db.prepare("SELECT * FROM books ORDER BY createdAt DESC").all();
    res.json(books);
  });

  app.post("/api/books", upload.single("image"), (req, res) => {
    const { title, price, description, grade, subject, isFeatured } = req.body;
    const id = uuidv4();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.prepare(`
      INSERT INTO books (id, title, price, description, imageUrl, grade, subject, isFeatured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, parseFloat(price), description, imageUrl, grade, subject, isFeatured === 'true' ? 1 : 0);
    
    res.json({ success: true, id });
  });

  app.delete("/api/books/:id", (req, res) => {
    db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.post("/api/orders", (req, res) => {
    const { studentName, whatsappNumber, bookId, bookTitle } = req.body;
    const id = uuidv4();
    const date = new Date().toISOString().split('T')[0];
    
    db.prepare(`
      INSERT INTO orders (id, studentName, whatsappNumber, bookId, bookTitle)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, studentName, whatsappNumber, bookId, bookTitle);

    db.prepare(`
      INSERT INTO dailyStats (date, orders) VALUES (?, 1)
      ON CONFLICT(date) DO UPDATE SET orders = orders + 1
    `).run(date);

    res.json({ success: true, id });
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY timestamp DESC").all();
    res.json(orders);
  });

  // Chat
  app.get("/api/conversations", (req, res) => {
    const convs = db.prepare("SELECT * FROM conversations ORDER BY lastTimestamp DESC").all();
    res.json(convs);
  });

  app.get("/api/messages/:convId", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC").all(req.params.convId);
    res.json(messages);
  });

  app.post("/api/messages", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), (req, res) => {
    const { conversationId, studentName, text, isAdmin, type } = req.body;
    const id = uuidv4();
    const files = (req.files as any) || {};
    const imageUrl = files['image'] ? `/uploads/${files['image'][0].filename}` : null;
    const audioUrl = files['audio'] ? `/uploads/${files['audio'][0].filename}` : null;
    const isAd = isAdmin === 'true' || isAdmin === true || isAdmin === 1 ? 1 : 0;
    const date = new Date().toISOString().split('T')[0];

    // Update or create conversation using named parameters for safety
    const convStmt = db.prepare(`
      INSERT INTO conversations (id, studentName, lastMessage, lastTimestamp, unreadCount)
      VALUES (:id, :studentName, :lastMsg, CURRENT_TIMESTAMP, :initialUnread)
      ON CONFLICT(id) DO UPDATE SET 
        lastMessage = :lastMsg, 
        lastTimestamp = CURRENT_TIMESTAMP,
        unreadCount = CASE WHEN :isUserMessage = 1 THEN unreadCount + 1 ELSE unreadCount END
    `);
    
    const lastMsgContent = text || (imageUrl ? 'صورة 📷' : (audioUrl ? 'رسالة صوتية 🎤' : 'رسالة جديدة'));
    
    convStmt.run({
      id: conversationId,
      studentName: studentName || 'طالب',
      lastMsg: lastMsgContent,
      initialUnread: isAd === 0 ? 1 : 0,
      isUserMessage: isAd === 0 ? 1 : 0
    });

    // Save message
    db.prepare(`
      INSERT INTO messages (id, conversationId, text, imageUrl, audioUrl, isAdmin, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, conversationId, text, imageUrl, audioUrl, isAd, type || 'text');

    // Track statistics
    db.prepare(`
      INSERT INTO dailyStats (date, messages) VALUES (?, 1)
      ON CONFLICT(date) DO UPDATE SET messages = messages + 1
    `).run(date);

    res.json({ success: true, id });
  });

  // --- Vite & Production Setup ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
