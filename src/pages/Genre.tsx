import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMoviesByGenre, getGenres, Movie as TMDBMovie } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { motion } from 'motion/react';
import { ChevronLeft, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GenrePage() {
  const { id } = useParams<{ id: string }>();
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [genreName, setGenreName] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [genreList, moviesData] = await Promise.all([
          getGenres(),
          getMoviesByGenre(Number(id))
        ]);
        
        setGenres(genreList);
        const currentGenre = genreList.find(g => g.id === Number(id));
        setGenreName(currentGenre?.name || 'Жанр');
        setMovies(moviesData?.results || []);
      } catch (error) {
        console.error('Error loading genre data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

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
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link to="/" className="text-white/40 hover:text-[#ff4e00] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> На главную
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff4e00]/10 flex items-center justify-center border border-[#ff4e00]/20">
              <Filter size={24} className="text-[#ff4e00]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{genreName}</h1>
          </div>
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

      {movies.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <p className="text-white/40 text-lg uppercase tracking-widest font-bold">Фильмы не найдены</p>
          <Link to="/" className="inline-block bg-[#ff4e00] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#ff6a26] transition-colors">
            Вернуться на главную
          </Link>
        </div>
      )}
    </div>
  );
}
