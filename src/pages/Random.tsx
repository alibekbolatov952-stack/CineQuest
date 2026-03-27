import React, { useState, useEffect } from 'react';
import { getPopularMovies, Movie } from '../lib/tmdb';
import { Shuffle, Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Random() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandom = async () => {
    setLoading(true);
    const data = await getPopularMovies();
    const movies = data.results || [];
    if (movies.length > 0) {
      const random = movies[Math.floor(Math.random() * movies.length)];
      setMovie(random);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRandom();
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase">Случайный выбор</h1>
        <p className="text-white/40 font-medium uppercase tracking-widest">Не знаешь что посмотреть? Мы поможем!</p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-80 aspect-[2/3] bg-white/5 rounded-[40px] animate-pulse border border-white/10"
          />
        ) : movie && (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="relative group"
          >
            <div className="w-80 aspect-[2/3] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative">
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 space-y-4 text-center">
                <h2 className="text-xl font-bold uppercase tracking-tight">{movie.title}</h2>
                <div className="flex gap-2">
                  <Link 
                    to={`/watch/movie/${movie.id}`}
                    className="flex-1 bg-[#ff4e00] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Play size={14} fill="white" /> Смотреть
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={fetchRandom}
        disabled={loading}
        className="bg-white text-black px-12 py-6 rounded-[32px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-[#ff4e00] hover:text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <Shuffle size={24} /> Перемешать
      </button>
    </div>
  );
}
