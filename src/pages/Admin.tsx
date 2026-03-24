import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, Users, Film, TrendingUp, Plus, Edit3, Trash2, Search, Check, X, Zap, BarChart3, Database, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { searchMovies, getMovieDetails } from '../lib/tmdb';
import { toast } from 'sonner';

export default function Admin() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'movies' | 'stats' | 'comments'>('stats');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [movieFilter, setMovieFilter] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);

  const handleTmdbSearch = async () => {
    if (!tmdbSearch.trim()) return;
    setIsSearching(true);
    try {
      const data = await searchMovies(tmdbSearch);
      setTmdbResults(data?.results || []);
    } catch (error) {
      console.error('TMDB search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addMovieToDb = async (tmdbMovie: any) => {
    if (isAdding) return;
    setIsAdding(tmdbMovie.id);
    try {
      // Check if movie already exists
      const existing = movies.find(m => m.tmdbId === tmdbMovie.id);
      if (existing) {
        toast.error('Этот фильм уже есть в базе!');
        return;
      }

      const movieData = {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview || '',
        posterPath: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
        backdropPath: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : '',
        releaseDate: tmdbMovie.release_date || '',
        rating: tmdbMovie.vote_average || 0,
        addedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'movies'), movieData);
      
      // Refresh movies list
      const moviesSnap = await getDocs(collection(db, 'movies'));
      setMovies(moviesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      toast.success(`Фильм "${tmdbMovie.title}" добавлен!`);
      // Optional: don't close modal to allow adding more
      // setIsAddModalOpen(false);
    } catch (error) {
      console.error('Add movie error:', error);
      toast.error('Ошибка при добавлении фильма');
      handleFirestoreError(error, OperationType.WRITE, 'movies');
    } finally {
      setIsAdding(null);
    }
  };

  const deleteMovie = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот фильм?')) return;
    try {
      await deleteDoc(doc(db, 'movies', id));
      setMovies(prev => prev.filter(m => m.id !== id));
      toast.success('Фильм удален');
    } catch (error) {
      toast.error('Ошибка при удалении');
      handleFirestoreError(error, OperationType.DELETE, 'movies');
    }
  };

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const loadData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const moviesSnap = await getDocs(collection(db, 'movies'));
        setMovies(moviesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const commentsSnap = await getDocs(collection(db, 'comments'));
        setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Admin load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <ShieldAlert size={48} className="text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Доступ ограничен</h2>
          <p className="text-white/40 font-medium">У вас нет прав администратора для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Admin Header */}
      <section className="relative p-6 md:p-12 bg-[#ff4e00]/10 rounded-[32px] md:rounded-[40px] border border-[#ff4e00]/20 overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 md:p-12 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldAlert size={120} className="text-[#ff4e00] md:w-[240px] md:h-[240px]" />
        </div>
        
        <div className="relative space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] md:text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={12} fill="#ff4e00" /> Панель управления
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none">Админ-центр</h1>
            <p className="text-white/40 text-xs md:text-base font-medium">Управление пользователями, контентом и статистикой платформы</p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { label: 'Пользователи', value: users.length, icon: Users, color: 'text-blue-400' },
          { label: 'Фильмы', value: movies.length, icon: Film, color: 'text-[#ff4e00]' },
          { label: 'Комментарии', value: comments.length, icon: MessageSquare, color: 'text-green-400' },
          { label: 'Просмотры', value: '1.2K', icon: TrendingUp, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 md:p-8 bg-white/5 rounded-[20px] md:rounded-[32px] border border-white/5 space-y-1 md:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[7px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest truncate mr-1">{stat.label}</span>
              <stat.icon size={14} className={stat.color} />
            </div>
            <span className="text-xl md:text-4xl font-bold tracking-tighter uppercase">{stat.value}</span>
          </div>
        ))}
      </section>

      {/* Admin Tabs */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 md:gap-8 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: 'Статистика', icon: BarChart3 },
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'movies', label: 'Фильмы', icon: Film },
            { id: 'comments', label: 'Модерация', icon: MessageSquare },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 md:gap-3 pb-4 -mb-4 transition-all relative group whitespace-nowrap",
                activeTab === tab.id ? "text-[#ff4e00]" : "text-white/40 hover:text-white"
              )}
            >
              <tab.icon size={16} />
              <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeAdminTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff4e00] rounded-full"
                />
              )}
            </button>
          ))}
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
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {activeTab === 'users' && (
                <div className="bg-white/5 rounded-[24px] md:rounded-[32px] border border-white/5 overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="p-4 md:p-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Пользователь</th>
                        <th className="p-4 md:p-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Email</th>
                        <th className="p-4 md:p-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Роль</th>
                        <th className="p-4 md:p-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Очки</th>
                        <th className="p-4 md:p-6 text-[10px] font-bold text-white/20 uppercase tracking-widest text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 md:p-6 flex items-center gap-4">
                            <img src={u.photoURL} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-xl border border-white/10" />
                            <span className="font-bold text-xs md:text-sm uppercase tracking-tight">{u.displayName}</span>
                          </td>
                          <td className="p-4 md:p-6 text-xs md:text-sm text-white/40 font-medium">{u.email}</td>
                          <td className="p-4 md:p-6">
                            <span className={cn(
                              "text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-widest border",
                              u.role === 'admin' ? "bg-[#ff4e00]/10 text-[#ff4e00] border-[#ff4e00]/20" : "bg-white/5 text-white/40 border-white/10"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 md:p-6 font-bold text-xs md:text-sm">{u.points}</td>
                          <td className="p-4 md:p-6 text-right space-x-1 md:space-x-2">
                            <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white">
                              <Edit3 size={16} />
                            </button>
                            <button className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-white/40 hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'movies' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                      <input 
                        type="text" 
                        value={movieFilter}
                        onChange={(e) => setMovieFilter(e.target.value)}
                        placeholder="Поиск по базе фильмов..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff4e00] transition-colors" size={18} />
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
                    >
                      <Plus size={18} /> Добавить фильм
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {movies
                      .filter(m => m.title.toLowerCase().includes(movieFilter.toLowerCase()))
                      .map((m) => (
                        <div key={m.id} className="p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 flex gap-4 group">
                        <img src={m.posterPath} alt="" className="w-16 h-24 md:w-20 md:h-28 rounded-xl object-cover border border-white/10" />
                        <div className="flex-1 space-y-2">
                          <h3 className="font-bold text-xs md:text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#ff4e00] transition-colors">{m.title}</h3>
                          <p className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">{m.tmdbId}</p>
                          <div className="flex gap-2 pt-2">
                            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white border border-white/5">
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => deleteMovie(m.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all text-white/40 hover:text-red-500 border border-white/5"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div className="p-8 md:p-12 bg-white/5 rounded-[32px] md:rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center">
                    <BarChart3 size={48} className="text-[#ff4e00] md:w-16 md:h-16" />
                    <div className="space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold tracking-tighter uppercase">Аналитика активности</h3>
                      <p className="text-white/40 text-xs md:text-base font-medium max-w-xs mx-auto">Здесь будет отображаться график просмотров и регистраций за последние 30 дней</p>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 bg-white/5 rounded-[32px] md:rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center">
                    <Database size={48} className="text-[#ff4e00] md:w-16 md:h-16" />
                    <div className="space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold tracking-tighter uppercase">Состояние базы</h3>
                      <p className="text-white/40 text-xs md:text-base font-medium max-w-xs mx-auto">Все системы работают в штатном режиме. База данных синхронизирована с TMDb.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <img src={c.userPhotoURL} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-xl border border-white/10" />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs md:text-sm uppercase tracking-tight">{c.userDisplayName}</span>
                            <span className="text-[8px] md:text-[10px] text-white/20 font-bold uppercase tracking-widest">ID: {c.movieId}</span>
                          </div>
                          <p className="text-xs md:text-sm text-white/60 font-medium line-clamp-2 sm:line-clamp-1">{c.text}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none p-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-2xl transition-all border border-green-500/10 flex items-center justify-center">
                          <Check size={18} />
                        </button>
                        <button className="flex-1 sm:flex-none p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/10 flex items-center justify-center">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Add Movie Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tighter uppercase">Добавить фильм</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Поиск в базе TMDb</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex gap-4">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      value={tmdbSearch}
                      onChange={(e) => setTmdbSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
                      placeholder="Введите название фильма..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff4e00] transition-colors" size={18} />
                  </div>
                  <button 
                    onClick={handleTmdbSearch}
                    disabled={isSearching}
                    className="bg-[#ff4e00] hover:bg-[#ff6a26] disabled:opacity-50 text-white px-8 rounded-2xl font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    Найти
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {tmdbResults.length > 0 ? (
                    tmdbResults.map((movie) => (
                      <div key={movie.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-6 group hover:border-white/20 transition-all">
                        <img 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'} 
                          alt="" 
                          className="w-20 h-28 rounded-xl object-cover border border-white/10"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-[#ff4e00] transition-colors">{movie.title}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{movie.release_date?.split('-')[0]}</p>
                            </div>
                            <button 
                              onClick={() => addMovieToDb(movie)}
                              disabled={isAdding === movie.id || movies.some(m => m.tmdbId === movie.id)}
                              className={cn(
                                "p-3 rounded-xl transition-all border disabled:opacity-50",
                                movies.some(m => m.tmdbId === movie.id)
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : "bg-white/5 hover:bg-[#ff4e00] text-white/40 hover:text-white border-white/5 hover:border-[#ff4e00]/50"
                              )}
                            >
                              {isAdding === movie.id ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : movies.some(m => m.tmdbId === movie.id) ? (
                                <Check size={20} />
                              ) : (
                                <Plus size={20} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{movie.overview}</p>
                        </div>
                      </div>
                    ))
                  ) : tmdbSearch && !isSearching ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <Search size={32} className="text-white/20" />
                      </div>
                      <p className="text-white/40 font-medium">Ничего не найдено</p>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-[#ff4e00]/10 rounded-full flex items-center justify-center mx-auto">
                        <Film size={32} className="text-[#ff4e00]" />
                      </div>
                      <p className="text-white/40 font-medium">Введите название для поиска в TMDb</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
