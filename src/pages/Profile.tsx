import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getMovieDetails } from '../lib/tmdb';
import { User, Settings, Heart, Clock, Trophy, Zap, Star, ShieldAlert, LogOut, Edit3, ChevronRight, LayoutGrid, List, X, Check, Loader2, Camera, Bell, Globe, Lock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MovieCard from '../components/MovieCard';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, logout, updatePoints, favorites: favIds, toggleFavorite } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'achievements'>('favorites');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    publicProfile: true,
    language: 'ru' as 'ru' | 'en'
  });

  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName);
      setEditPhoto(profile.photoURL);
      if (profile.settings) {
        setSettings(profile.settings);
      }
    }
  }, [profile]);

  const handleSaveSettings = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        settings: settings
      });
      toast.success('Настройки сохранены!');
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Update settings error:', error);
      toast.error('Ошибка при сохранении настроек');
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      const histQuery = query(collection(db, 'history'), where('userId', '==', user.uid));
      const histSnap = await getDocs(histQuery);
      
      const batch = writeBatch(db);
      histSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      
      await batch.commit();
      setHistory([]);
      toast.success('История очищена!');
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Clear history error:', error);
      toast.error('Ошибка при очистке истории');
      handleFirestoreError(error, OperationType.DELETE, 'history');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    if (!editName.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: editName,
        photoURL: editPhoto
      });
      toast.success('Профиль обновлен!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Ошибка при обновлении профиля');
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      setLoading(true);
      try {
        // Load Favorites
        const favMovies = await Promise.all(
          favIds.map(async (id) => {
            const details = await getMovieDetails(id);
            return details;
          })
        );
        setFavorites(favMovies);

        // Load History
        const histQuery = query(collection(db, 'history'), where('userId', '==', user.uid));
        const histSnap = await getDocs(histQuery);
        const histMovies = await Promise.all(
          histSnap.docs.map(async (d) => {
            const data = d.data();
            const details = await getMovieDetails(data.movieId);
            return { ...details, watchedAt: data.watchedAt };
          })
        );
        setHistory(histMovies.sort((a, b) => b.watchedAt?.seconds - a.watchedAt?.seconds));

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, favIds]);

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <User size={48} className="text-white/20" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Войдите в аккаунт</h2>
          <p className="text-white/40 font-medium">Чтобы увидеть свой профиль и статистику</p>
        </div>
        <button className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95">
          АВТОРИЗАЦИЯ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <section className="relative p-12 bg-white/5 rounded-[40px] border border-white/5 overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <User size={240} className="text-[#ff4e00]" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-12">
          <div className="relative">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt="Avatar" 
              className="w-40 h-40 rounded-[40px] border-4 border-[#ff4e00] p-1 shadow-2xl shadow-[#ff4e00]/20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 -right-4 bg-[#ff4e00] text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border-4 border-[#0a0502] shadow-xl">
              {profile.level}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-2">
                <ShieldAlert size={14} /> {profile.role === 'admin' ? 'Администратор' : 'Киноман'}
              </span>
              <h1 className="text-5xl font-bold tracking-tighter uppercase leading-none">{profile.displayName}</h1>
              <p className="text-white/40 font-medium text-sm">{profile.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-white/10 text-xs uppercase tracking-widest"
              >
                <Edit3 size={16} /> Редактировать
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-white/10 text-xs uppercase tracking-widest"
              >
                <Settings size={16} /> Настройки
              </button>
              <button 
                onClick={logout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-red-500/10 text-xs uppercase tracking-widest"
              >
                <LogOut size={16} /> Выйти
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1 min-w-[140px]">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Очки</span>
              <span className="text-3xl font-bold tracking-tighter block">{profile.points}</span>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-1 min-w-[140px]">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Жетоны</span>
              <span className="text-3xl font-bold tracking-tighter block">{profile.tokens}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex gap-8">
            {[
              { id: 'favorites', label: 'Избранное', icon: Heart, count: favorites.length },
              { id: 'history', label: 'История', icon: Clock, count: history.length },
              { id: 'achievements', label: 'Достижения', icon: Trophy, count: profile.achievements.length },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 pb-4 -mb-4 transition-all relative group",
                  activeTab === tab.id ? "text-[#ff4e00]" : "text-white/40 hover:text-white"
                )}
              >
                <tab.icon size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">{tab.label}</span>
                <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{tab.count}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff4e00] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl border transition-all",
                viewMode === 'grid' ? "bg-[#ff4e00] text-white border-[#ff4e00]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl border transition-all",
                viewMode === 'list' ? "bg-[#ff4e00] text-white border-[#ff4e00]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-[#ff4e00] border-t-transparent rounded-full"
              />
            </motion.div>
          ) : (
            <motion.div 
              key={`${activeTab}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "grid gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" 
                  : "grid-cols-1"
              )}
            >
              {activeTab === 'favorites' && favorites.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  isFavorite={true} 
                  onToggleFavorite={(id) => toggleFavorite(id.toString())}
                  variant={viewMode}
                />
              ))}
              {activeTab === 'history' && history.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  isFavorite={favIds.includes(movie.id.toString())}
                  onToggleFavorite={(id) => toggleFavorite(id.toString())}
                  variant={viewMode}
                />
              ))}
              {activeTab === 'achievements' && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4 opacity-40">
                  <Trophy size={64} />
                  <p className="font-bold uppercase tracking-widest text-sm">Достижения скоро появятся</p>
                </div>
              )}
              {activeTab === 'favorites' && favorites.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4 opacity-40">
                  <Heart size={64} />
                  <p className="font-bold uppercase tracking-widest text-sm">Список избранного пуст</p>
                </div>
              )}
              {activeTab === 'history' && history.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4 opacity-40">
                  <Clock size={64} />
                  <p className="font-bold uppercase tracking-widest text-sm">История просмотров пуста</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tighter uppercase">Редактировать профиль</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Персонализация аккаунта</p>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <img 
                      src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      alt="Avatar Preview" 
                      className="w-32 h-32 rounded-[32px] border-4 border-[#ff4e00] p-1 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Предпросмотр аватара</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Имя пользователя</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ваше имя..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#ff4e00]/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">URL аватара</label>
                    <input 
                      type="text" 
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#ff4e00]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest border border-white/10"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 bg-[#ff4e00] hover:bg-[#ff6a26] text-white py-4 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Сохранить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tighter uppercase">Настройки</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Конфигурация аккаунта</p>
                </div>
                <button 
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setShowClearConfirm(false);
                  }}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-[#ff4e00]" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold uppercase tracking-tight">Уведомления</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Email рассылки</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, emailNotifications: !s.emailNotifications }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings.emailNotifications ? "bg-[#ff4e00]" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.emailNotifications ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-[#ff4e00]" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold uppercase tracking-tight">Приватность</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Публичный профиль</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, publicProfile: !s.publicProfile }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings.publicProfile ? "bg-[#ff4e00]" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.publicProfile ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-[#ff4e00]" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold uppercase tracking-tight">Язык</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Интерфейс</p>
                      </div>
                    </div>
                    <select 
                      value={settings.language}
                      onChange={(e) => setSettings(s => ({ ...s, language: e.target.value as any }))}
                      className="bg-transparent text-sm font-bold uppercase tracking-tight focus:outline-none"
                    >
                      <option value="ru" className="bg-[#0a0a0a]">RU</option>
                      <option value="en" className="bg-[#0a0a0a]">EN</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  {!showClearConfirm ? (
                    <button 
                      onClick={() => setShowClearConfirm(true)}
                      disabled={isClearing || history.length === 0}
                      className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold transition-all border border-red-500/10 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {history.length === 0 ? 'История пуста' : 'Очистить историю'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-center font-bold text-red-500 uppercase tracking-widest">Вы уверены? Это действие необратимо.</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest border border-white/10"
                        >
                          Отмена
                        </button>
                        <button 
                          onClick={handleClearHistory}
                          disabled={isClearing}
                          className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Да, очистить
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest border border-white/10"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex-1 bg-[#ff4e00] hover:bg-[#ff6a26] text-white py-4 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Сохранить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
