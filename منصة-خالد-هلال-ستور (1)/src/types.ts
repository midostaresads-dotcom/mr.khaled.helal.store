export interface Book {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string | null;
  grade: string;
  subject: string;
  isFeatured: number;
  createdAt: string;
}

export interface Order {
  id: string;
  studentName: string;
  whatsappNumber: string;
  bookId: string;
  bookTitle: string;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string;
  isAdmin: number;
  type: 'text' | 'image' | 'audio';
}

export interface Conversation {
  id: string;
  studentName: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

export interface DailyStat {
  date: string;
  visits: number;
  orders: number;
  messages: number;
}
