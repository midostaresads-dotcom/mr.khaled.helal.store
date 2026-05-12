import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, Mic, X, User, Phone, MoreVertical, Paperclip, CheckCheck, Play, Pause, Square } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Conversation } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

const UserCircle2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20a6 6 0 0 0-12 0" />
    <circle cx="12" cy="10" r="4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

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
        console.error("Audio playback failed:", err?.message || "Unknown error");
        setIsPlaying(false);
      });
    }
  };

  if (!url) return null;

  return (
    <div className={`flex items-center gap-3 bg-black/20 p-3 rounded-2xl min-w-[220px] ${error ? 'opacity-50' : ''}`}>
      <button 
        onClick={togglePlay}
        disabled={error}
        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all text-white shadow-inner"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1.5 bg-white/10 w-full rounded-full relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${error ? 'bg-red-500' : 'bg-white/50'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[10px] font-bold opacity-70">
            {error ? 'خطأ في التشغيل' : 'رسالة صوتية'}
          </span>
        </div>
      </div>
      <audio 
        key={url}
        ref={audioRef}
        src={url} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onError={() => {
          console.error("Audio Load Error for URL:", url);
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('chat_name') || '');
  const [isTyping, setIsTyping] = useState(false);
  const [showLogin, setShowLogin] = useState(!localStorage.getItem('chat_name'));
  const [convId, setConvId] = useState(localStorage.getItem('chat_conv_id') || uuidv4());
  
  // File states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userName) {
      localStorage.setItem('chat_name', userName);
      localStorage.setItem('chat_conv_id', convId);
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [userName, convId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append('conversationId', convId);
    formData.append('studentName', userName);
    formData.append('text', inputText);
    formData.append('isAdmin', 'false');
    formData.append('type', selectedImage ? 'image' : 'text');
    if (selectedImage) formData.append('image', selectedImage);

    setInputText('');
    setSelectedImage(null);
    setImgPreview(null);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImgPreview(URL.createObjectURL(file));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Prioritize formats by browser support
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus'
      ];
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
        if (e.data && e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      mediaRecorder.current.onstop = async () => {
        const mimeType = mediaRecorder.current?.mimeType || selectedMime || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('ogg') ? 'ogg' : (mimeType.includes('aac') ? 'aac' : 'webm'));
        
        if (audioChunks.current.length === 0) {
          console.warn('No audio data collected');
          return;
        }

        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        
        if (audioBlob.size < 100) {
          console.warn('Audio blob too small, likely empty');
          return;
        }

        const formData = new FormData();
        formData.append('conversationId', convId);
        formData.append('studentName', userName);
        formData.append('audio', audioBlob, `voice.${extension}`);
        formData.append('isAdmin', 'false');
        formData.append('type', 'audio');

        try {
          const res = await fetch('/api/messages', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) fetchMessages();
        } catch (err) {
          console.error('Failed to send audio:', err);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(200); // Collect data every 200ms
      setIsRecording(true);
      setRecordTime(0);
      timerInterval.current = setInterval(() => {
        setRecordTime(p => p + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied or recording error:', err);
      alert('يجب السماح بالوصول للميكروفون للتسجيل');
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

  if (showLogin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card p-8 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-white/10 w-full max-w-md space-y-6 sm:space-y-8 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <UserCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">أهلاً بك في الدعم</h2>
            <p className="text-sm sm:text-base text-gray-400">من فضلك أدخل اسمك لبدء المحادثة</p>
          </div>
          <input 
            type="text" 
            placeholder="اسمك بالكامل..."
            className="w-full bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl text-center text-lg sm:text-xl focus:outline-none focus:border-primary transition-all"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && userName && setShowLogin(false)}
          />
          <button 
            disabled={!userName}
            onClick={() => setShowLogin(false)}
            className="w-full py-4 sm:py-5 bg-primary rounded-2xl font-bold text-lg sm:text-xl shadow-xl shadow-primary/30 disabled:opacity-50 active:scale-95 transition-all"
          >
            بدء الدردشة
          </button>
        </motion.div>

      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-card border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[80vh] shadow-3xl">
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg">
            {userName[0]}
          </div>
          <div>
            <h3 className="font-bold">{userName}</h3>
            <div className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              متصل الآن
            </div>
          </div>
        </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-full text-gray-400">
              <Phone size={20} />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-full text-gray-400">
              <MoreVertical size={20} />
            </button>
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[url('https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-background-dark-mode-color-whatsapp-background-dark-whatsapp-theme-dark-whatsapp.jpg')] bg-fixed bg-center">
          {messages.map((msg, i) => {
            const isMsgAdmin = Number(msg.isAdmin) === 1;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[75%]",
                  isMsgAdmin ? "mr-auto items-start" : "ml-auto items-end"
                )}
              >
                <div className={cn(
                  "p-3 sm:p-4 rounded-2xl shadow-lg relative border",
                  isMsgAdmin ? "bg-zinc-800 text-white border-white/5 rounded-tr-none" : "bg-primary text-white border-primary/20 rounded-tl-none"
                )}>
                  {msg.type === 'text' && (
                    <div className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base markdown-body">
                      <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                    </div>
                  )}
                  {msg.type === 'image' && msg.imageUrl && (
                    <div className="space-y-2">
                      <img src={msg.imageUrl} alt="Uploaded" className="rounded-xl w-full max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                      {msg.text && <p className="text-sm mt-2">{msg.text}</p>}
                    </div>
                  )}
                  {msg.type === 'audio' && msg.audioUrl && (
                    <AudioMessage url={msg.audioUrl} />
                  )}
                  
                  <div className="flex items-center gap-1 mt-1 justify-end opacity-50 text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {!isMsgAdmin && <CheckCheck size={12} />}
                  </div>
                </div>
                {i === messages.length - 1 && isTyping && (
                  <div className="flex gap-1 p-2 mt-1">
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10 space-y-4">
        <AnimatePresence>
          {imgPreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 relative"
            >
              <div className="relative inline-block">
                <img src={imgPreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary" />
                <button 
                  onClick={() => { setSelectedImage(null); setImgPreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg"
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input 
            type="file" 
            id="image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageChange}
          />
          <label htmlFor="image-upload" className="p-3 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer text-gray-400 transition-colors">
            <ImageIcon size={22} />
          </label>
          <button type="button" className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400">
            <Paperclip size={22} />
          </button>

          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="اكتب رسالتك..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-12 focus:outline-none focus:border-primary/50"
            />
          </div>

          {inputText.trim() || selectedImage ? (
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              type="submit"
              className="p-4 bg-primary text-white rounded-full shadow-lg shadow-primary/20"
            >
              <Send size={22} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              className={cn(
                "p-4 rounded-full transition-all",
                isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {isRecording ? <Square size={22} /> : <Mic size={22} />}
            </motion.button>
          )}
        </form>
        {isRecording && (
          <div className="text-center font-bold text-red-500 text-sm animate-pulse">
            جاري التسجيل... {formatTime(recordTime)}
          </div>
        )}
      </div>
    </div>
  );
}
