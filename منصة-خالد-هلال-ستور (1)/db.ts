import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'store.db');

const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    imageUrl TEXT,
    grade TEXT,
    subject TEXT,
    isFeatured INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    studentName TEXT NOT NULL,
    whatsappNumber TEXT NOT NULL,
    bookId TEXT,
    bookTitle TEXT,
    status TEXT DEFAULT 'pending',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT,
    text TEXT,
    imageUrl TEXT,
    audioUrl TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isAdmin INTEGER DEFAULT 0,
    type TEXT DEFAULT 'text'
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    studentName TEXT,
    lastMessage TEXT,
    lastTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    unreadCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    displayName TEXT,
    photoUrl TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dailyStats (
    date TEXT PRIMARY KEY,
    visits INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    messages INTEGER DEFAULT 0
  );
`);

export default db;
