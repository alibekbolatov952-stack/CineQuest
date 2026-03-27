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
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithEmail, registerWithEmail } = useAuth();

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
    setIsLoading(true);
    try {
      await login();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
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
            className="relative w-full max-w-[440px] bg-[#0a0502] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl"
          >
            {/* Background Posters */}
            <div className="absolute inset-0 opacity-70 pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ 
                  y: [0, -200, 0],
                }}
                transition={{ 
                  duration: 40, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="grid grid-cols-4 gap-1 p-1"
              >
                {[...posters, ...posters].map((url, i) => (
                  <div key={i} className="aspect-[2/3] rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0502]/30 via-[#0a0502]/50 to-[#0a0502]/80" />
            </div>

            <div className="relative p-8 md:p-10 space-y-8">
              {/* Header */}
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={20} className="text-white/40" />
                </button>
                
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-[#ff4e00] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,78,0,0.5)]">
                    <LogIn size={20} fill="white" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">ВХОД</h2>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setMode('login')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                    mode === 'login' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Войти
                </button>
                <button 
                  onClick={() => setMode('register')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                    mode === 'register' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Регистрация
                </button>
              </div>

              {/* Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="space-y-4"
              >
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff4e00] transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите E-mail"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all font-medium"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff4e00] transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all font-medium"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="text-white/40 hover:text-white text-xs font-bold transition-colors">Забыл пароль</button>
                </div>

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full bg-[#ff4e00] hover:bg-[#ff6a26] text-white py-5 rounded-[24px] font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(255,78,0,0.3)] flex items-center justify-center gap-3",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  {mode === 'login' ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">ДРУГИЕ СПОСОБЫ</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social Login */}
              <div className="flex justify-center gap-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 hover:border-white/20 group"
                >
                  <Chrome size={24} className="text-white/40 group-hover:text-white transition-colors" />
                </button>
                <button className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 hover:border-white/20 group">
                  <MessageCircle size={24} className="text-white/40 group-hover:text-white transition-colors" />
                </button>
                <button className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 hover:border-white/20 group">
                  <Send size={24} className="text-white/40 group-hover:text-white transition-colors" />
                </button>
                <button className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 hover:border-white/20 group">
                  <Gamepad2 size={24} className="text-white/40 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
