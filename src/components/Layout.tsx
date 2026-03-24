import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Heart, User, LogOut, Menu, X, Film, Tv, TrendingUp, Star, Settings, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, login, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Главная', path: '/' },
    { icon: Search, label: 'Поиск', path: '/search' },
    { icon: TrendingUp, label: 'Популярное', path: '/popular' },
    { icon: Star, label: 'Новинки', path: '/new' },
    { icon: Heart, label: 'Избранное', path: '/favorites' },
    { icon: User, label: 'Профиль', path: '/profile' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ icon: ShieldAlert, label: 'Админ', path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-[#ff4e00] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0502]/80 backdrop-blur-md border-b border-white/10 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" className="text-2xl font-bold tracking-tighter text-[#ff4e00] flex items-center gap-2">
            <Film size={28} />
            <span className="hidden sm:inline">CINEQUEST</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.slice(0, 4).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#ff4e00]",
                location.pathname === item.path ? "text-[#ff4e00]" : "text-white/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-[#ff4e00] uppercase tracking-widest">LVL {profile?.level}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">{profile?.points} PTS</span>
              </div>
              <Link to="/profile">
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-[#ff4e00] p-0.5"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
          ) : (
            <button 
              onClick={login}
              className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-6 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              ВОЙТИ
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0a0502] border-r border-white/10 p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <Link to="/" className="text-2xl font-bold tracking-tighter text-[#ff4e00] flex items-center gap-2">
                  <Film size={28} />
                  <span>CINEQUEST</span>
                </Link>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      location.pathname === item.path 
                        ? "bg-[#ff4e00] text-white shadow-lg shadow-[#ff4e00]/20" 
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-bold uppercase tracking-widest text-xs">{item.label}</span>
                  </Link>
                ))}
              </div>

              {user && (
                <div className="absolute bottom-8 left-6 right-6">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 text-white/60 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold uppercase tracking-widest text-xs border border-white/5"
                  >
                    <LogOut size={20} />
                    Выйти
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-28 md:pt-36 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-top border-white/10 py-12 px-4 md:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-[#ff4e00] flex items-center gap-2">
              <Film size={28} />
              <span>CINEQUEST</span>
            </Link>
            <p className="text-white/40 text-sm text-center md:text-left max-w-xs">
              Ваш персональный кино-квест. Смотрите, оценивайте, соревнуйтесь и получайте награды.
            </p>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Навигация</span>
              <Link to="/" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Главная</Link>
              <Link to="/search" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Поиск</Link>
              <Link to="/popular" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Популярное</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Аккаунт</span>
              <Link to="/profile" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Профиль</Link>
              <Link to="/favorites" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Избранное</Link>
              <Link to="/settings" className="text-sm text-white/60 hover:text-[#ff4e00] transition-colors">Настройки</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 CINEQUEST. Все права защищены.</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-white/20 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Политика конфиденциальности</span>
            <span className="text-[10px] text-white/20 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Условия использования</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
