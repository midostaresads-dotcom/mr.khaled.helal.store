import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, MessageCircle, LayoutDashboard, User, Settings, Menu, X, Phone, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import HomePage from './pages/HomePage';
import StorePage from './pages/StorePage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    fetch('/api/track-visit', { method: 'POST' });
    
    // Apply saved theme color
    const savedColor = localStorage.getItem('theme_color');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
  }, []);

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المذكرات', path: '/store', icon: ShoppingBag },
    { name: 'الدعم الفني', path: '/chat', icon: MessageCircle },
  ];

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background text-white flex">
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 md:pb-0">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
              KH
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">خالد هلال ستور</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary",
                  location.pathname === item.path ? "text-primary font-bold" : "text-gray-400"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
              <LayoutDashboard size={20} />
            </Link>
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background pt-20 md:hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 text-2xl p-4 rounded-2xl bg-white/5",
                    location.pathname === item.path ? "border-r-4 border-primary text-primary" : "text-gray-300"
                  )}
                >
                  <item.icon size={28} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </main>

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-white/10 h-16 px-6 flex items-center justify-around z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1",
              location.pathname === item.path ? "text-primary" : "text-gray-500"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
      {/* Footer Stats Footer */}
      <footer className="container mx-auto px-4 h-16 flex items-center justify-between text-[11px] text-white/30 border-t border-white/5 mt-12 bg-background">
        <div className="flex gap-6">
          <span>الزوار اليوم: 1,240</span>
          <span>الطلبات الناجحة: 482</span>
          <span>دعم متواصل: 24/7</span>
        </div>
        <div className="hidden sm:block">© 2026 Khaled Helal Store.</div>
      </footer>
    </div>
  );
}
