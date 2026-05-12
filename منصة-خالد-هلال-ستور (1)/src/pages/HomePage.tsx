import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowLeft, Phone, BadgeCheck, Clock, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => setFeaturedBooks(data.filter((b: Book) => b.isFeatured === 1).slice(0, 3)));
  }, []);

  const stats = [
    { label: 'سهولة الطلب', icon: ShoppingBag, color: 'text-primary' },
    { label: 'دعم ع مدار الساعة', icon: Clock, color: 'text-green-500' },
    { label: 'دفع آمن وفوري', icon: ShieldCheck, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section - Bento Style */}
      <section className="grid grid-cols-12 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-8 bg-gradient-to-br from-[#18181b] to-[#27272a] rounded-[2.5rem] p-10 relative overflow-hidden border border-white/5 min-h-[450px] flex flex-col justify-center"
        >
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-widest">
              جديد 2026
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight">
              احترف الكيمياء مع<br />
              <span className="text-primary italic">مستر خالد هلال</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              كل ما تحتاجه من مذكرات، ملخصات، وتجارب علمية في مكان واحد. تعلم بذكاء مع أحدث الوسائل التقنية.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/store"
                className="px-8 py-4 bg-primary rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2"
              >
                تصفح المذكرات
                <ShoppingBag size={20} />
              </Link>
              <Link 
                to="/chat"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg transition-all flex items-center gap-2"
              >
                تواصل معنا
                <Phone size={20} />
              </Link>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute top-10 left-10 text-[140px] font-black text-white/5 pointer-events-none select-none">CHEM</div>
        </motion.div>

        {/* Small Bento - Payment */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="col-span-12 lg:col-span-4 flex flex-col gap-4"
        >
          <div className="flex-grow bg-card rounded-[2.5rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center gap-4 group">
            <div className="w-20 h-20 bg-primary/20 text-primary rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold">دفع آمن وفوري</h3>
              <p className="text-gray-400 text-sm mt-2">عبر فودافون كاش - 24 ساعة</p>
            </div>
            <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 font-mono text-xl font-bold text-primary tracking-wider">
              01030475662
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2rem] bg-card border border-white/10 flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-all group"
          >
            <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
              <stat.icon size={32} />
            </div>
            <h3 className="text-xl font-bold">{stat.label}</h3>
          </motion.div>
        ))}
      </section>

      {/* Featured Books Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-3xl font-bold tracking-tight">المذكرات المميزة</h2>
          <Link to="/store" className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all">
            عرض الكل
            <ArrowLeft size={20} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredBooks.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all flex flex-col"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-black/40">
                <img 
                  src={book.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop'} 
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 px-2 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded uppercase tracking-tighter">
                  الأكثر طلباً
                </div>
              </div>
              <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-white/50 mb-1">{book.grade}</p>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{book.title}</h3>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-2xl font-black text-primary">{formatCurrency(book.price)}</span>
                  <Link 
                    to={`/store?book=${book.id}`}
                    className="p-3 bg-white text-black rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg"
                  >
                    <ShoppingBag size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="rounded-[3rem] bg-gradient-to-br from-primary to-primary/80 p-12 text-center space-y-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black">هل لديك أي استفسار؟</h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            نحن هنا لمساعدتك في أي وقت. تواصل معنا مباشرة عبر الواتساب أو الدعم الفني للمنصة.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="https://wa.me/201026553713"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-white text-primary rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <Phone fill="currentColor" size={20} />
              واتساب مستر خالد هلال
            </a>
            <div className="px-8 py-4 bg-black/20 text-white rounded-2xl font-bold flex items-center gap-3">
              رقم فودافون كاش: 01030475662
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
