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
import { AnimePlayer } from '../components/AnimePlayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Comment } from '../types';
import { cn } from '../lib/utils';

export default function Movie() {
  const { id, type: urlType } = useParams<{ id: string; type?: string }>();
  const [movie, setMovie] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const { user, profile, updatePoints, favorites, toggleFavorite, setIsAuthModalOpen } = useAuth();
  const isFavorite = id ? favorites.includes(id) : false;

  const director = movie?.credits?.crew?.find((person: any) => person.job === 'Director')?.name || 
                   movie?.created_by?.[0]?.name;
  const cast = movie?.credits?.cast?.slice(0, 10) || [];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from our player
      const data = event.data;
      if (!data || !data.key) return;

      switch (data.key) {
        case 'kodik_player_time_update':
          const time = data.value;
          setPlayerProgress(time);
          // Update progress in Firestore every 10 seconds or so to avoid too many writes
          if (user && id && time % 10 === 0) {
            const historyRef = doc(db, 'history', `${user.uid}_${id}`);
            setDoc(historyRef, { progress: time, watchedAt: serverTimestamp() }, { merge: true })
              .catch(err => handleFirestoreError(err, OperationType.WRITE, 'history'));
          }
          break;
        case 'kodik_player_play':
          console.log('Player started');
          break;
        case 'kodik_player_pause':
          console.log('Player paused');
          break;
        case 'kodik_player_video_ended':
          console.log('Video ended');
          if (user) updatePoints(20); // Bonus points for finishing a movie
          break;
        case 'tunime_error':
          console.error('Player error:', data.value);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, user, updatePoints]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        let details;
        let type: 'movie' | 'tv' = (urlType as 'movie' | 'tv') || 'movie';
        
        if (urlType) {
          details = await getMovieDetails(id, type);
        } else {
          // Fallback logic for old routes
          try {
            details = await getMovieDetails(id, 'movie');
            type = 'movie';
          } catch (e) {
            details = await getMovieDetails(id, 'tv');
            type = 'tv';
          }
        }
        
        setMovie(details);
        
        const recs = await getMovieRecommendations(id, type);
        setRecommendations(recs?.results?.slice(0, 6) || []);

        // AI Summary
        const summary = await getMovieSummary(details.title || details.name, details.overview);
        setAiSummary(summary || '');

        // Add to history if user is logged in
        if (user) {
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
  }, [id]); // Only re-run when movie ID changes

  useEffect(() => {
    if (!id) return;

    // Listen for comments
    const commentsQuery = query(collection(db, 'comments'), where('movieId', '==', id));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(comms.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || Date.now();
        const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || Date.now();
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `comments/${id}`);
    });

    return () => unsubscribe();
  }, [id]); // Only re-run when movie ID changes

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

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Info size={64} className="text-white/20" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold uppercase tracking-tighter">Фильм не найден</h2>
          <p className="text-white/40 font-medium">Возможно, произошла ошибка при загрузке данных из TMDB.</p>
        </div>
        <Link to="/" className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-8 py-3 rounded-2xl font-bold transition-all">
          НА ГЛАВНУЮ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section with Poster & Info */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] rounded-[32px] md:rounded-[40px] overflow-hidden group">
        {/* Background Backdrop (Atmospheric) */}
        <div className="absolute inset-0">
          <img 
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
            alt=""
            className="w-full h-full object-cover scale-105 blur-sm opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-[#0a0502]/80 to-transparent" />
          <div className="absolute inset-0 bg-[#0a0502]/40" />
        </div>
        
        <div className="relative h-full flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 p-6 md:p-16">
          {/* Main Poster (The "1" poster requested) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="shrink-0 w-48 md:w-80 aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
          >
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              alt={movie.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="flex-1 space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <span className="bg-[#ff4e00] text-white text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                  <Zap size={12} fill="white" /> HD Quality
                </span>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 rounded-full border border-white/10">
                  <Star size={14} className="text-[#ff4e00]" fill="#ff4e00" />
                  <span className="text-[10px] md:text-xs font-bold tracking-widest">{(movie.vote_average || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 rounded-full border border-white/10">
                  <Calendar size={14} className="text-white/60" />
                  <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/60">{movie.release_date?.split('-')[0]} ГОД</span>
                </div>
                {director && (
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 rounded-full border border-white/10">
                    <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest">РЕЖИССЕР:</span>
                    <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/80">{director}</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase leading-[0.9] break-words">
                {movie.title}
              </h1>

              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {movie.genres?.map((genre: any) => (
                  <span key={genre.id} className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em] bg-white/10 border border-white/10 px-3 md:px-4 py-1.5 rounded-full">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Сюжет</h3>
              <p className="text-white/60 text-xs md:text-lg line-clamp-4 md:line-clamp-none font-medium leading-relaxed max-w-3xl">
                {movie.overview}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2 md:pt-4">
              <button 
                onClick={startWatching}
                className="flex-1 sm:flex-none bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 md:gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-[#ff4e00]/20 text-xs md:text-base min-w-[140px]"
              >
                <Play fill="white" size={18} /> СМОТРЕТЬ
              </button>
              <button 
                onClick={handleToggleFavorite}
                className={cn(
                  "flex-1 sm:flex-none bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 md:gap-3 transition-all border border-white/10 text-xs md:text-base min-w-[140px]",
                  isFavorite && "text-[#ff4e00] border-[#ff4e00]/50"
                )}
              >
                <Heart size={18} fill={isFavorite ? "#ff4e00" : "none"} /> {isFavorite ? 'В ИЗБРАННОМ' : 'В ИЗБРАННОЕ'}
              </button>
            </div>
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
              <ErrorBoundary>
                <AnimePlayer 
                  tmdbId={movie.id.toString()} 
                  shikimoriId={movie.external_ids?.shikimori_id}
                  imdbId={movie.external_ids?.imdb_id}
                  title={movie.title || movie.name}
                />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Cast */}
          {cast.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tighter uppercase flex items-center gap-3">
                  <Star size={24} className="text-[#ff4e00]" /> Актерский состав
                </h2>
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{cast.length} ЧЕЛОВЕК</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {cast.map((person: any) => (
                  <div key={person.id} className="group space-y-3">
                    <div className="aspect-square rounded-2xl overflow-hidden border border-white/5 group-hover:border-[#ff4e00]/50 transition-all">
                      <img 
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} 
                        alt={person.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-tight truncate">{person.name}</p>
                      <p className="text-[8px] text-white/40 font-medium truncate">{person.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[#ff4e00] font-bold uppercase tracking-widest text-xs hover:underline"
                >
                  Авторизация
                </button>
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
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Детали</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Статус</span>
                <span className="text-xs font-bold uppercase tracking-widest">{movie.status}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Бюджет</span>
                <span className="text-xs font-bold uppercase tracking-widest">${((movie.budget || 0) / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Сборы</span>
                <span className="text-xs font-bold uppercase tracking-widest">${((movie.revenue || 0) / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Язык</span>
                <span className="text-xs font-bold uppercase tracking-widest">{movie.original_language?.toUpperCase()}</span>
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
              {recommendations.map((rec) => {
                const recUrl = rec.media_type ? `/watch/${rec.media_type}/${rec.id}` : `/movie/${rec.id}`;
                return (
                  <Link key={rec.id} to={recUrl} className="group space-y-2">
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
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
