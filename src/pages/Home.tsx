import React, { useEffect, useState } from 'react';
import { getPopularMovies, getTrendingMovies, Movie as TMDBMovie } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { Play, Info, TrendingUp, Star, Flame, Zap, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [featured, setFeatured] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, favorites, toggleFavorite } = useAuth();

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const pop = await getPopularMovies();
        const trend = await getTrendingMovies();
        setPopular(pop?.results?.slice(0, 12) || []);
        setTrending(trend?.results?.slice(0, 12) || []);
        setFeatured(pop?.results?.[0] || null);
      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

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
    <div className="space-y-16">
      {/* Hero Section */}
      {featured && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-[80vh] rounded-[40px] overflow-hidden group"
        >
          <img 
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`} 
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-[#0a0502]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0502] via-transparent to-transparent" />
          
          <div className="absolute bottom-12 left-8 md:left-16 max-w-2xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <span className="bg-[#ff4e00] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                <Flame size={12} fill="white" /> Featured
              </span>
              <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-white/10">
                <Star size={12} className="text-[#ff4e00]" fill="#ff4e00" /> {featured.vote_average.toFixed(1)}
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]"
            >
              {featured.title}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-lg line-clamp-3 font-medium leading-relaxed"
            >
              {featured.overview}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link 
                to={`/movie/${featured.id}`}
                className="bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-[#ff4e00]/20"
              >
                <Play fill="white" size={20} /> СМОТРЕТЬ СЕЙЧАС
              </Link>
              <Link 
                to={`/movie/${featured.id}`}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all border border-white/10"
              >
                <Info size={20} /> ПОДРОБНЕЕ
              </Link>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Stats Bar (Gamification) */}
      {profile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-md"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={12} className="text-[#ff4e00]" /> Уровень
            </span>
            <span className="text-3xl font-bold tracking-tighter uppercase">{profile.level}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <Trophy size={12} className="text-[#ff4e00]" /> Очки
            </span>
            <span className="text-3xl font-bold tracking-tighter uppercase">{profile.points}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <Star size={12} className="text-[#ff4e00]" /> Жетоны
            </span>
            <span className="text-3xl font-bold tracking-tighter uppercase">{profile.tokens}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={12} className="text-[#ff4e00]" /> Прогресс
            </span>
            <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(profile.points % 100)}%` }}
                className="h-full bg-[#ff4e00]"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Popular Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={14} /> Тренды
            </span>
            <h2 className="text-4xl font-bold tracking-tighter uppercase">Популярное сейчас</h2>
          </div>
          <button className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Смотреть все <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {popular.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              isFavorite={favorites.includes(movie.id.toString())}
              onToggleFavorite={(id) => toggleFavorite(id.toString())}
            />
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={14} /> Новинки
            </span>
            <h2 className="text-4xl font-bold tracking-tighter uppercase">На этой неделе</h2>
          </div>
          <button className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Смотреть все <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {trending.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              isFavorite={favorites.includes(movie.id.toString())}
              onToggleFavorite={(id) => toggleFavorite(id.toString())}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
