import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, Gamepad2, Chrome, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { getPopularMovies } from '../lib/tmdb';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posters, setPosters] = useState<string[]>([]);
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen) {
      getPopularMovies().then(data => {
        const urls = data.results
          .filter((m: any) => m.poster_path)
          .map((m: any) => `https://image.tmdb.org/t/p/w300${m.poster_path}`)
          .slice(0, 12);
        setPosters(urls);
      });
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    await login();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[480px] bg-[#0a0502]/80 backdrop-blur-3xl rounded-[48px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
          >
            {/* Background Posters */}
            <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ 
                  y: [0, -400, 0],
                }}
                transition={{ 
                  duration: 60, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="grid grid-cols-4 gap-2 p-2"
              >
                {[...posters, ...posters, ...posters].map((url, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000">
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0502] via-transparent to-[#0a0502]" />
            </div>

            <div className="relative p-10 md:p-14 space-y-10">
              {/* Header */}
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                >
                  <X size={20} className="text-white/40" />
                </button>
                
                <div className="flex flex-col items-center gap-4 text-white">
                  <div className="w-16 h-16 bg-[#ff4e00] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,78,0,0.4)] transform -rotate-6">
                    <LogIn size={32} fill="white" className="text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-4xl font-black uppercase tracking-[-0.05em] italic">CINEQUEST</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Вход в киновселенную</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/5">
                <button 
                  onClick={() => setMode('login')}
                  className={cn(
                    "flex-1 py-4 rounded-[18px] font-black text-[11px] uppercase tracking-[0.2em] transition-all",
                    mode === 'login' ? "bg-white text-black shadow-2xl" : "text-white/20 hover:text-white/40"
                  )}
                >
                  Войти
                </button>
                <button 
                  onClick={() => setMode('register')}
                  className={cn(
                    "flex-1 py-4 rounded-[18px] font-black text-[11px] uppercase tracking-[0.2em] transition-all",
                    mode === 'register' ? "bg-white text-black shadow-2xl" : "text-white/20 hover:text-white/40"
                  )}
                >
                  Регистрация
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#ff4e00] transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-MAIL"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-16 pr-8 text-white placeholder:text-white/10 focus:outline-none focus:border-[#ff4e00]/50 transition-all font-black text-xs tracking-widest"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#ff4e00] transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ПАРОЛЬ"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-16 pr-8 text-white placeholder:text-white/10 focus:outline-none focus:border-[#ff4e00]/50 transition-all font-black text-xs tracking-widest"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="text-[10px] font-black text-white/10 hover:text-[#ff4e00] uppercase tracking-widest transition-colors">Забыли пароль?</button>
                </div>
              </div>

              {/* Action Button */}
              <button 
                className="w-full bg-[#ff4e00] hover:bg-[#ff6a26] text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] text-xs transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(255,78,0,0.3)]"
              >
                {mode === 'login' ? 'АВТОРИЗАЦИЯ' : 'РЕГИСТРАЦИЯ'}
              </button>

              {/* Social Login */}
              <div className="space-y-6">
                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">БЫСТРЫЙ ВХОД</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-16 h-16 bg-white/[0.03] hover:bg-white/[0.08] rounded-[24px] flex items-center justify-center transition-all border border-white/5 hover:border-[#ff4e00]/50 group"
                  >
                    <Chrome size={24} className="text-white/20 group-hover:text-[#ff4e00] transition-colors" />
                  </button>
                  <button className="w-16 h-16 bg-white/[0.03] hover:bg-white/[0.08] rounded-[24px] flex items-center justify-center transition-all border border-white/5 hover:border-[#ff4e00]/50 group">
                    <MessageCircle size={24} className="text-white/20 group-hover:text-[#ff4e00] transition-colors" />
                  </button>
                  <button className="w-16 h-16 bg-white/[0.03] hover:bg-white/[0.08] rounded-[24px] flex items-center justify-center transition-all border border-white/5 hover:border-[#ff4e00]/50 group">
                    <Send size={24} className="text-white/20 group-hover:text-[#ff4e00] transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
