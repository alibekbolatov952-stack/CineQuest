import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieDetails, getMovieVideos, getMovieRecommendations, Movie as TMDBMovie } from '../lib/tmdb';
import { getMovieSummary } from '../lib/gemini';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { Play, Heart, Share2, Star, Clock, Calendar, MessageSquare, Send, Zap, Info, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import MovieCard from '../components/MovieCard';
import { Comment } from '../types';
import { cn } from '../lib/utils';

export default function Movie() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeServer, setActiveServer] = useState<'server1' | 'server2' | 'server3' | 'server4' | 'server5'>('server1');
  const { user, profile, updatePoints, favorites, toggleFavorite } = useAuth();
  const isFavorite = id ? favorites.includes(id) : false;

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const details = await getMovieDetails(id);
        setMovie(details);
        
        const recs = await getMovieRecommendations(id);
        setRecommendations(recs?.results?.slice(0, 6) || []);

        // AI Summary
        const summary = await getMovieSummary(details.title, details.overview);
        setAiSummary(summary || '');

        // Check if favorite
        if (user) {
          // Add to history
          const historyRef = doc(db, 'history', `${user.uid}_${id}`);
          await setDoc(historyRef, {
            userId: user.uid,
            movieId: id,
            watchedAt: serverTimestamp(),
            progress: 0
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error loading movie data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for comments
    const commentsQuery = query(collection(db, 'comments'), where('movieId', '==', id));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(comms.sort((a, b) => {
        const timeA = a.createdAt?.seconds || Date.now() / 1000;
        const timeB = b.createdAt?.seconds || Date.now() / 1000;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `comments/${id}`);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!id) return;
    await toggleFavorite(id);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    try {
      await addDoc(collection(db, 'comments'), {
        userId: user.uid,
        movieId: id,
        text: newComment,
        createdAt: serverTimestamp(),
        likes: 0,
        userDisplayName: profile?.displayName || 'User',
        userPhotoURL: profile?.photoURL || ''
      });
      setNewComment('');
      updatePoints(5); // Points for commenting
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'comments');
    }
  };

  const startWatching = () => {
    setShowPlayer(true);
    updatePoints(10); // Points for watching
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#ff4e00] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Backdrop & Info */}
      <section className="relative min-h-[70vh] rounded-[40px] overflow-hidden group">
        <img 
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-[#0a0502]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0502] via-transparent to-transparent" />
        
        <div className="absolute bottom-12 left-8 md:left-16 max-w-4xl space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-[#ff4e00] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
              <Zap size={12} fill="white" /> HD Quality
            </span>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Star size={14} className="text-[#ff4e00]" fill="#ff4e00" />
              <span className="text-xs font-bold tracking-widest">{movie.vote_average.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Clock size={14} className="text-white/60" />
              <span className="text-xs font-bold tracking-widest text-white/60">{movie.runtime} МИН</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Calendar size={14} className="text-white/60" />
              <span className="text-xs font-bold tracking-widest text-white/60">{movie.release_date?.split('-')[0]}</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            {movie.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {movie.genres?.map((genre: any) => (
              <span key={genre.id} className="text-[10px] font-bold text-white/40 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">
                {genre.name}
              </span>
            ))}
          </div>

          <p className="text-white/60 text-lg line-clamp-4 font-medium leading-relaxed max-w-2xl">
            {movie.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button 
              onClick={startWatching}
              className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-[#ff4e00]/20"
            >
              <Play fill="white" size={20} /> СМОТРЕТЬ
            </button>
            <button 
              onClick={handleToggleFavorite}
              className={cn(
                "bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all border border-white/10",
                isFavorite && "text-[#ff4e00] border-[#ff4e00]/50"
              )}
            >
              <Heart size={20} fill={isFavorite ? "#ff4e00" : "none"} /> {isFavorite ? 'В ИЗБРАННОМ' : 'В ИЗБРАННОЕ'}
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-2xl transition-all border border-white/10">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Player Modal */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setShowPlayer(false)}
              className="absolute top-8 right-8 z-[110] p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <Zap size={24} className="rotate-45" />
            </button>
            <div className="w-full h-full max-w-6xl flex flex-col gap-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveServer('server1')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeServer === 'server1' ? "bg-[#ff4e00] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    Сервер 1
                  </button>
                  <button 
                    onClick={() => setActiveServer('server2')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeServer === 'server2' ? "bg-[#ff4e00] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    Сервер 2
                  </button>
                  <button 
                    onClick={() => setActiveServer('server3')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeServer === 'server3' ? "bg-[#ff4e00] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    Сервер 3 (RU)
                  </button>
                  <button 
                    onClick={() => setActiveServer('server4')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeServer === 'server4' ? "bg-[#ff4e00] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    Сервер 4
                  </button>
                  <button 
                    onClick={() => setActiveServer('server5')}
                    className={cn(
                      "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeServer === 'server5' ? "bg-[#ff4e00] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    Сервер 5 (CDN)
                  </button>
                </div>
                <div className="flex items-center gap-2 text-white/20">
                  <Info size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Если не работает, смените сервер</span>
                </div>
              </div>
              <div className="flex-1 bg-white/5 rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl shadow-black">
                <iframe 
                  src={
                    activeServer === 'server1' 
                      ? `https://v2.vidsrc.me/embed/${movie.id}` 
                      : activeServer === 'server2'
                      ? `https://vidsrc.to/embed/movie/${movie.id}`
                      : activeServer === 'server3'
                      ? `https://kinobox.tv/embed/tmdb/${movie.id}`
                      : activeServer === 'server4'
                      ? `https://player.embed-api.stream/?id=${movie.id}`
                      : `https://videocdn.tv/embed/movie/${movie.id}?api_token=cdn1_ZH67NHKOFUJ7AMXS6Q6FGMEUMB0VB2`
                  } 
                  className="w-full h-full"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* AI Summary */}
          {aiSummary && (
            <section className="bg-white/5 rounded-[32px] p-8 border border-white/5 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} className="text-[#ff4e00]" />
              </div>
              <div className="relative space-y-4">
                <span className="text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap size={14} fill="#ff4e00" /> AI ОБЗОР
                </span>
                <div className="text-xl font-medium leading-relaxed text-white/80 italic">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              </div>
            </section>
          )}

          {/* Comments Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tighter uppercase flex items-center gap-3">
                <MessageSquare size={24} className="text-[#ff4e00]" /> Комментарии
              </h2>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{comments.length} ОТЗЫВОВ</span>
            </div>

            {user ? (
              <form onSubmit={handleAddComment} className="relative">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Поделитесь своим мнением..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 pr-16 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all resize-none h-32 font-medium"
                />
                <button 
                  type="submit"
                  className="absolute bottom-6 right-6 p-4 bg-[#ff4e00] hover:bg-[#ff6a26] rounded-2xl transition-all transform hover:scale-110 active:scale-95 shadow-xl shadow-[#ff4e00]/20"
                >
                  <Send size={20} />
                </button>
              </form>
            ) : (
              <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center space-y-4">
                <p className="text-white/40 font-medium">Войдите, чтобы оставить комментарий</p>
                <button className="text-[#ff4e00] font-bold uppercase tracking-widest text-xs hover:underline">Авторизация</button>
              </div>
            )}

            <div className="space-y-6">
              {comments.map((comment) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={comment.id} 
                  className="p-6 bg-white/5 rounded-3xl border border-white/5 flex gap-4"
                >
                  <img 
                    src={comment.userPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-2xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm uppercase tracking-tight">{comment.userDisplayName}</span>
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        {comment.createdAt ? comment.createdAt.toDate().toLocaleDateString() : 'Только что'}
                      </span>
                    </div>
                    <p className="text-white/60 leading-relaxed font-medium">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          {/* Movie Stats */}
          <section className="bg-white/5 rounded-[32px] p-8 border border-white/5 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Детали фильма</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Статус</span>
                <span className="text-xs font-bold uppercase tracking-widest">{movie.status}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Бюджет</span>
                <span className="text-xs font-bold uppercase tracking-widest">${(movie.budget / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Сборы</span>
                <span className="text-xs font-bold uppercase tracking-widest">${(movie.revenue / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Язык</span>
                <span className="text-xs font-bold uppercase tracking-widest">{movie.original_language}</span>
              </div>
            </div>
          </section>

          {/* Recommendations */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Похожее</h3>
              <ChevronRight size={16} className="text-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <Link key={rec.id} to={`/movie/${rec.id}`} className="group space-y-2">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 group-hover:border-[#ff4e00]/50 transition-all">
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${rec.poster_path}`} 
                      alt={rec.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-tight line-clamp-1 group-hover:text-[#ff4e00] transition-colors">{rec.title}</h4>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
