import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingBag, X, Phone, User, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Book } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function StorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [activeGrade, setActiveGrade] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [orderModal, setOrderModal] = useState(false);
  const [searchParams] = useSearchParams();

  // Order Form State
  const [studentName, setStudentName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const grades = ['الكل', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];

  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setFilteredBooks(data);
        const bookId = searchParams.get('book');
        if (bookId) {
          const book = data.find((b: Book) => b.id === bookId);
          if (book) {
            setSelectedBook(book);
            setOrderModal(true);
          }
        }
      });
  }, [searchParams]);

  useEffect(() => {
    let result = books;
    if (activeGrade !== 'الكل') {
      result = result.filter(b => b.grade === activeGrade);
    }
    if (searchQuery) {
      result = result.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredBooks(result);
  }, [activeGrade, searchQuery, books]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          whatsappNumber,
          bookId: selectedBook.id,
          bookTitle: selectedBook.title,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          // WhatsApp Redirect logic
          const message = `طلب مذكرة: ${selectedBook.title}\nالاسم: ${studentName}\nرقم الواتساب: ${whatsappNumber}`;
          window.open(`https://wa.me/201026553713?text=${encodeURIComponent(message)}`, '_blank');
          setOrderModal(false);
          setIsSuccess(false);
          setSelectedBook(null);
          setStudentName('');
          setWhatsappNumber('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="text-center py-8">
        <h1 className="text-4xl font-black tracking-tight">جميع المذكرات والملخصات</h1>
        <p className="text-gray-400 mt-2">اختر صفك الدراسي وابدأ رحلة التفوق</p>
      </section>

      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Sidebar Filter */}
        <aside className="col-span-12 lg:col-span-3 bg-card rounded-3xl p-6 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-primary" />
            <h3 className="font-bold">تصفية النتائج</h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-bold mr-2">الصف الدراسي</p>
            {grades.map(grade => (
              <button
                key={grade}
                onClick={() => setActiveGrade(grade)}
                className={cn(
                  "w-full text-right px-4 py-3 rounded-xl font-bold transition-all text-sm",
                  activeGrade === grade ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {grade}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-bold mr-2">بحث سريع</p>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="اسم المذكرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </aside>

        {/* Books Grid */}
        <main className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book) => (
                <motion.div
                  layout
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-3xl overflow-hidden border border-white/5 flex flex-col group hover:border-primary/50 transition-all duration-300"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-black/40">
                    <img 
                      src={book.imageUrl || 'https://via.placeholder.com/300x400/18181b/ffffff?text=Book+Cover'} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded border border-white/10">
                      {book.grade}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug">{book.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{book.subject}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-2xl font-black text-primary">{formatCurrency(book.price)}</span>
                      <button 
                        onClick={() => {
                          setSelectedBook(book);
                          setOrderModal(true);
                        }}
                        className="bg-white text-black px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
                      >
                        اطلب الآن
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {orderModal && selectedBook && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-white/10 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-3xl overflow-y-auto max-h-[90vh]"
            >
              <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold">طلب المذكرة</h2>
                    <p className="text-gray-400 text-sm sm:text-base">سوف يتم التواصل معك عبر الواتساب</p>
                  </div>
                  <button onClick={() => setOrderModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 items-center">
                  <img src={selectedBook.imageUrl || ''} alt="" className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-lg" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-base sm:text-xl">{selectedBook.title}</h4>
                    <p className="text-primary font-black text-lg sm:text-2xl">{formatCurrency(selectedBook.price)}</p>
                  </div>
                </div>

                {isSuccess ? (
                  <div className="text-center py-8 sm:py-12 space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">تم إرسال طلبك بنجاح!</h3>
                    <p className="text-sm sm:text-base text-gray-400">جاري توجيهك للواتساب للتواصل...</p>
                  </div>
                ) : (
                  <form onSubmit={handleOrder} className="space-y-5 sm:space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 pr-2">اسم الطالب (ثلاثي)</label>
                      <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          required
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="أدخل اسمك هنا..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 sm:py-4 focus:outline-none focus:border-primary transition-colors text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 pr-2">رقم الواتساب</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          required
                          type="tel"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 sm:py-4 focus:outline-none focus:border-primary transition-colors text-left text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-4 sm:py-5 bg-primary rounded-2xl font-bold text-lg sm:text-xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الطلب...' : (
                      <>
                        تأكيد الطلب 
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] sm:text-xs text-gray-500">من خلال الطلب، أنت توافق على شروط الخدمة لمتجر خالد هلال</p>
                </form>
                )}
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
