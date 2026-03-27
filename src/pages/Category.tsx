import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPopularMovies, getTrendingMovies, Movie as TMDBMovie, getGenres } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { motion } from 'motion/react';
import { ChevronLeft, TrendingUp, Zap, Trophy, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CategoryPage() {
  const { type } = useParams<{ type: string }>();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [title, setTitle] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [genreList, moviesData] = await Promise.all([
          getGenres(),
          type === 'popular' ? getPopularMovies() : getTrendingMovies()
        ]);
        
        setGenres(genreList);
        setTitle(type === 'popular' ? 'Популярное сейчас' : 'Новинки недели');
        setMovies(moviesData?.results || []);
      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [type]);

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

  const Icon = type === 'popular' ? TrendingUp : Zap;

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-4">
        <Link to="/" className="text-white/40 hover:text-[#ff4e00] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4">
          <ChevronLeft size={16} /> На главную
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4e00]/10 flex items-center justify-center border border-[#ff4e00]/20">
            <Icon size={24} className="text-[#ff4e00]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            genres={genres}
            isFavorite={movie.id ? favorites.includes(movie.id.toString()) : false}
            onToggleFavorite={(id) => id && toggleFavorite(id.toString())}
          />
        ))}
      </div>
    </div>
  );
}
