import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, MessageSquare, Settings, LogOut, Plus, Trash2, 
  Search, ExternalLink, Calendar, Users, DollarSign, Package, CheckCircle, 
  Trash, Edit3, Image as ImageIcon, Camera, User as UserIcon, Phone, Play, Pause, Menu, X as CloseIcon,
  Mic, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Book, Order, Conversation, DailyStat } from '../types';
import { formatCurrency, cn } from '../lib/utils';

type View = 'overview' | 'orders' | 'store' | 'chats' | 'settings';

const AudioMessage = React.memo(({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audioRef.current) (a as HTMLAudioElement).pause();
      });
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err?.message || "Unknown error");
        setIsPlaying(false);
      });
    }
  };

  if (!url) return null;

  return (
    <div className={`flex items-center gap-3 bg-black/20 p-3 rounded-2xl min-w-[200px] ${error ? 'opacity-50' : ''}`}>
      <button 
        onClick={togglePlay}
        disabled={error}
        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all text-white"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1.5 bg-white/10 w-full rounded-full relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${error ? 'bg-red-500' : 'bg-white/40'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <span className="text-[10px] opacity-70">
          {error ? 'خطأ في التشغيل' : 'رسالة صوتية'}
        </span>
      </div>
      <audio 
        key={url}
        ref={audioRef}
        src={url} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onError={() => {
          console.error("Audio load error for URL:", url);
          setError(true);
        }}
        onTimeUpdate={() => {
          if (audioRef.current && audioRef.current.duration) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(isNaN(p) ? 0 : p);
          }
        }}
        preload="auto"
      />
    </div>
  );
}, (prev, next) => prev.url === next.url);

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<View>('overview');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState({ displayName: 'مستر خالد هلال', photoUrl: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Security
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_authorized') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthorized) {
      fetchStats();
      fetchOrders();
      fetchBooks();
      fetchConversations();
      fetch('/api/admin/profile').then(res => res.json()).then(setAdminProfile);
    }
  }, [activeView, isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '01017648780') {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_authorized', 'true');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 w-full max-w-md space-y-6 sm:space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={32} className="rotate-180 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">دخول الإدارة</h2>
            <p className="text-sm sm:text-base text-gray-400">يرجى إدخال كلمة المرور للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <input 
              type="password"
              placeholder="كلمة المرور..."
              className="w-full bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl text-center text-lg sm:text-xl focus:outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-primary text-center font-bold text-sm sm:text-base">{error}</p>}
            <button className="w-full py-4 sm:py-5 bg-primary rounded-2xl font-bold text-lg sm:text-xl shadow-xl shadow-primary/30 active:scale-95 transition-all">
              دخول
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const fetchStats = () => fetch('/api/stats').then(res => res.json()).then(setStats);
  const fetchOrders = () => fetch('/api/orders').then(res => res.json()).then(setOrders);
  const fetchBooks = () => fetch('/api/books').then(res => res.json()).then(setBooks);
  const fetchConversations = () => fetch('/api/conversations').then(res => res.json()).then(setConversations);

  const sidebarItems = [
    { id: 'overview', name: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'orders', name: 'الطلبات', icon: ShoppingBag },
    { id: 'store', name: 'إدارة المتجر', icon: Package },
    { id: 'chats', name: 'المحادثات', icon: MessageSquare },
    { id: 'settings', name: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="flex w-full min-h-screen bg-background relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-white/10 flex items-center justify-between px-6 z-40">
        <h1 className="font-bold text-lg">لوحة الإدارة</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 rounded-xl">
          {isSidebarOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 right-0 h-full w-72 bg-card border-l border-white/10 p-6 space-y-8 z-50 transition-transform duration-300 transform lg:translate-x-0 overflow-y-auto",
        isSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between lg:justify-start gap-3 px-2">
          <div className="flex items-center gap-3">
            {adminProfile.photoUrl ? (
              <img src={adminProfile.photoUrl} className="w-10 h-10 rounded-xl object-cover" alt="Admin" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold">KH</div>
            )}
            <h1 className="font-bold text-xl">لوحة الإدارة</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
            <CloseIcon size={20} />
          </button>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as View);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                activeView === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              <span className="font-bold">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="pt-12">
          <button 
            onClick={() => {
              sessionStorage.removeItem('admin_authorized');
              window.location.href = '/';
            }} 
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-bold">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto mt-16 lg:mt-0">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && <OverviewView key="overview" stats={stats} />}
          {activeView === 'orders' && <OrdersView key="orders" orders={orders} />}
          {activeView === 'store' && <StoreView key="store" books={books} refresh={fetchBooks} deleteId={deleteId} setDeleteId={setDeleteId} />}
          {activeView === 'chats' && <ChatsView key="chats" conversations={conversations} selectedConv={selectedConv} setSelectedConv={setSelectedConv} />}
          {activeView === 'settings' && <SettingsView key="settings" admin={adminProfile} refreshAdmin={() => fetch('/api/admin/profile').then(res => res.json()).then(setAdminProfile)} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function OverviewView({ stats }: { stats: any }) {
  if (!stats) return null;

  const data = stats.dailyStats.map((s: DailyStat) => ({
    name: new Date(s.date).toLocaleDateString('ar-EG', { weekday: 'short' }),
    orders: s.orders,
    visits: s.visits
  })).reverse();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'إجمالي الطلبات', value: stats.overview.orders, icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'عدد المذكرات', value: stats.overview.books, icon: Package, color: 'text-primary' },
          { label: 'الرسائل الواردة', value: stats.overview.messages, icon: MessageSquare, color: 'text-green-500' },
        ].map((item, i) => (
          <div key={i} className="bg-card p-8 rounded-3xl border border-white/10 space-y-4">
            <div className={cn("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center", item.color)}>
              <item.icon />
            </div>
            <div>
              <p className="text-gray-400 font-bold">{item.label}</p>
              <h3 className="text-4xl font-black">{item.value}+</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card p-8 rounded-[2.5rem] border border-white/10">
        <h3 className="text-xl font-bold mb-8">نشاط الأسبوع</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" vertical={false} />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="orders" stroke="#dc2626" fillOpacity={1} fill="url(#colorOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function OrdersView({ orders }: { orders: Order[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">إدارة الطلبات</h2>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[600px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-gray-400">
              <th className="p-6">الطالب</th>
              <th className="p-6">المذكرة</th>
              <th className="p-6">التاريخ</th>
              <th className="p-6">الحالة</th>
              <th className="p-6">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-6">
                  <div className="font-bold">{order.studentName}</div>
                  <div className="text-xs text-gray-500">{order.whatsappNumber}</div>
                </td>
                <td className="p-6">{order.bookTitle}</td>
                <td className="p-6 text-gray-400">{new Date(order.timestamp).toLocaleDateString('ar-EG')}</td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold font-sans">معلق</span>
                </td>
                <td className="p-6">
                  <a 
                    href={`https://wa.me/20${order.whatsappNumber.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-green-500 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Phone size={18} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </motion.div>
  );
}

function StoreView({ books, refresh, deleteId, setDeleteId }: { books: Book[], refresh: () => void, deleteId: string | null, setDeleteId: (id: string | null) => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', price: '', description: '', grade: 'الأول الثانوي', subject: 'كيمياء', isFeatured: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v.toString()));
    if (imageFile) data.append('image', imageFile);

    await fetch('/api/books', { method: 'POST', body: data });
    refresh();
    setShowAddForm(false);
    setFormData({ title: '', price: '', description: '', grade: 'الأول الثانوي', subject: 'كيمياء', isFeatured: false });
    setImageFile(null);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await fetch(`/api/books/${deleteId}`, { method: 'DELETE' });
      refresh();
      setDeleteId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">المتجر والمذكرات</h2>
        <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-primary rounded-xl font-bold flex items-center gap-2">
          <Plus size={20} />
          إضافة مذكرة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-card p-6 rounded-3xl border border-white/10 flex gap-6 hover:border-primary/50 transition-all group">
            <div className="w-32 h-44 bg-white/5 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
              <img src={book.imageUrl || ''} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold">{book.title}</h4>
                  <p className="text-xs text-primary font-bold">{book.grade}</p>
                </div>
                <button onClick={() => setDeleteId(book.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{book.description}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-black">{formatCurrency(book.price)}</span>
                {book.isFeatured === 1 && (
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] rounded-lg font-bold">مميز</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-sm bg-card border border-white/10 p-8 rounded-[2rem] text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold">تأكيد الحذف</h3>
                <p className="text-gray-400 mt-2">هل أنت متأكد من حذف هذه المذكرة؟ لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 rounded-xl font-bold active:scale-95 transition-all">حذف</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-white/10 rounded-xl font-bold active:scale-95 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-2xl bg-card border border-white/10 rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">إضافة مذكرة جديدة</h3>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="عنوان المذكرة" className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm sm:text-base" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  <input required type="number" placeholder="السعر" className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm sm:text-base" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm sm:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                    <option>الأول الثانوي</option>
                    <option>الثاني الثانوي</option>
                    <option>الثالث الثانوي</option>
                  </select>
                  <input placeholder="المادة" className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm sm:text-base" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <textarea placeholder="الوصف" rows={4} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 resize-none text-sm sm:text-base" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">صورة الغلاف</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all">
                      <ImageIcon className="text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-400 text-center">{imageFile ? imageFile.name : 'اختر ملف الصورة'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isFeatured" className="w-4 h-4" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} />
                  <label htmlFor="isFeatured" className="font-bold text-sm sm:text-base">عرض في المميز</label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-primary rounded-xl font-bold text-sm sm:text-base active:scale-95 transition-transform">تأكيد الإضافة</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-4 bg-white/5 rounded-xl font-bold text-sm sm:text-base active:scale-95 transition-transform">إلغاء</button>
                </div>
              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChatsView({ conversations, selectedConv, setSelectedConv }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    if (selectedConv) {
      fetch(`/api/messages/${selectedConv}`).then(res => res.json()).then(setMessages);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      mediaRecorder.current = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : {});
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = async () => {
        const mimeType = mediaRecorder.current?.mimeType || selectedMime || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('ogg') ? 'ogg' : (mimeType.includes('aac') ? 'aac' : 'webm'));
        
        if (audioChunks.current.length === 0) return;
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        if (audioBlob.size < 100) return;

        const formData = new FormData();
        formData.append('conversationId', selectedConv);
        formData.append('studentName', 'الأدمن');
        formData.append('audio', audioBlob, `voice.${extension}`);
        formData.append('isAdmin', 'true');
        formData.append('type', 'audio');

        try {
          const res = await fetch('/api/messages', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) fetchMessages();
        } catch (err) {
          console.error(err);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(200);
      setIsRecording(true);
      setRecordTime(0);
      timerInterval.current = setInterval(() => setRecordTime(p => p + 1), 1000);
    } catch (err) {
      alert('يجب السماح بالوصول للميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.requestData();
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerInterval.current);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
      <div className={cn(
        "w-full lg:w-80 bg-card rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[300px] lg:h-full",
        selectedConv && "hidden lg:flex"
      )}>
        <div className="p-6 border-b border-white/10 font-bold">المحادثات</div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv: any) => (
            <button 
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={cn(
                "w-full p-6 text-right border-b border-white/5 hover:bg-white/5 transition-colors",
                selectedConv === conv.id ? "bg-primary/10 border-l-4 border-primary" : ""
              )}
            >
              <div className="font-bold">{conv.studentName}</div>
              <div className="text-xs text-gray-500 line-clamp-1">{conv.lastMessage || 'بدأ المحادثة...'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={cn(
        "flex-1 bg-card rounded-3xl border border-white/10 overflow-hidden flex flex-col relative min-h-[400px]",
        !selectedConv && "hidden lg:flex"
      )}>
        {!selectedConv ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500 gap-4">
            <MessageSquare size={64} opacity={0.2} />
            <p>اختر محادثة للبدء في الرد</p>
          </div>
        ) : (
          <>
             <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="font-bold text-lg">
                  {conversations.find((c: any) => c.id === selectedConv)?.studentName}
                </div>
                <button onClick={() => setSelectedConv(null)} className="lg:hidden p-2 bg-white/5 rounded-xl">
                  إغلاق
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
                {messages.map((m) => {
                  const isMsgAdmin = Number(m.isAdmin) === 1;
                  return (
                    <div key={m.id} className={cn("flex flex-col max-w-[85%]", isMsgAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm border",
                        isMsgAdmin ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-zinc-800 text-white border-white/5 rounded-tl-none"
                      )}>
                        {m.text && <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{m.text}</p>}
                      {m.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => window.open(m.imageUrl, '_blank')}>
                          <img src={m.imageUrl} className="max-w-full max-h-[300px] object-contain group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                      {m.audioUrl && (
                        <AudioMessage url={m.audioUrl} />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{new Date(m.timestamp).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
             </div>
            <div className="p-4 border-t border-white/10 flex gap-4">
              <input 
                placeholder="اكتب ردك هنا..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none"
                onKeyPress={async (e) => {
                  if (e.key === 'Enter') {
                    const text = (e.target as HTMLInputElement).value;
                    if (!text.trim()) return;
                    (e.target as HTMLInputElement).value = '';
                    const formData = new FormData();
                    formData.append('conversationId', selectedConv);
                    formData.append('studentName', 'الأدمن');
                    formData.append('text', text);
                    formData.append('isAdmin', 'true');
                    formData.append('type', 'text');

                    await fetch('/api/messages', {
                      method: 'POST',
                      body: formData
                    });
                    fetchMessages();
                  }
                }}
              />
              <button
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {isRecording ? <div className="flex items-center gap-2"><Square size={20} /> <span className="text-xs">{formatTime(recordTime)}</span></div> : <Mic size={20} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsView({ admin, refreshAdmin }: { admin: any, refreshAdmin: () => void }) {
  const [name, setName] = useState(admin.displayName);
  const [uploading, setUploading] = useState(false);

  const colors = [
    { name: 'أحمر أساسي', code: '#dc2626' },
    { name: 'أزرق ملكي', code: '#2563eb' },
    { name: 'أخضر غني', code: '#16a34a' },
    { name: 'بنفسجي داكن', code: '#7c3aed' },
    { name: 'برتقالي مشرق', code: '#ea580c' },
  ];

  const updateColor = (code: string) => {
    document.documentElement.style.setProperty('--primary-color', code);
    localStorage.setItem('theme_color', code);
  };

  const handleProfileUpdate = async (file?: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('displayName', name);
    if (file) formData.append('photo', file);

    try {
      await fetch('/api/admin/profile', { method: 'POST', body: formData });
      refreshAdmin();
      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Settings />
          إعدادات المنصة
        </h3>
        
        <div className="bg-card p-10 rounded-3xl border border-white/10 space-y-8">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-400">تخصيص اللون الأساسي</h4>
            <div className="flex flex-wrap gap-4">
              {colors.map(c => (
                <button 
                  key={c.code}
                  onClick={() => updateColor(c.code)}
                  className="group flex flex-col items-center gap-2"
                >
                  <div style={{ backgroundColor: c.code }} className="w-16 h-16 rounded-2xl shadow-xl transition-transform group-hover:scale-110" />
                  <span className="text-xs font-bold">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6">
             <h4 className="font-bold text-gray-400">الملف الشخصي للأدمن</h4>
             <div className="flex items-center gap-8">
               <label className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border-4 border-primary/20 relative group overflow-hidden cursor-pointer">
                 {admin.photoUrl ? (
                   <img src={admin.photoUrl} className="w-full h-full object-cover" />
                 ) : (
                    <UserIcon size={48} className="text-gray-600" />
                 )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={24} />
                 </div>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) handleProfileUpdate(file);
                 }} />
               </label>
               <div className="space-y-4 flex-1">
                 <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم الأدمن"
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl" 
                />
                 <button 
                  onClick={() => handleProfileUpdate()}
                  disabled={uploading}
                  className="px-8 py-3 bg-primary rounded-xl font-bold disabled:opacity-50"
                 >
                   {uploading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

