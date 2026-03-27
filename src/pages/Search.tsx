import React, { useState, useEffect } from 'react';
import { searchMovies, fetchFromTMDB, Movie as TMDBMovie } from '../lib/tmdb';
import { getMoodRecommendations } from '../lib/gemini';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, Filter, X, Zap, Sparkles, Smile, Frown, Ghost, Flame, Music, Heart, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const moods = [
  { id: 'happy', label: 'Веселое', icon: Smile, color: 'text-yellow-400' },
  { id: 'sad', label: 'Грустное', icon: Frown, color: 'text-blue-400' },
  { id: 'scary', label: 'Страшное', icon: Ghost, color: 'text-purple-400' },
  { id: 'action', label: 'Бодрое', icon: Flame, color: 'text-red-400' },
  { id: 'romantic', label: 'Романтичное', icon: Heart, color: 'text-pink-400' },
  { id: 'chill', label: 'Расслабленное', icon: Coffee, color: 'text-green-400' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMoodSearch, setIsMoodSearch] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const { favorites, toggleFavorite } = useAuth();

  useEffect(() => {
    const loadGenres = async () => {
      const data = await fetchFromTMDB('/genre/movie/list');
      setGenres(data?.genres || []);
    };
    loadGenres();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setIsMoodSearch(false);
    setSelectedMood(null);
    try {
      const data = await searchMovies(query);
      setResults(data?.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSearch = async (mood: string) => {
    setLoading(true);
    setIsMoodSearch(true);
    setSelectedMood(mood);
    setQuery('');
    try {
      const titles = await getMoodRecommendations(mood);
      const movieResults = await Promise.all(
        titles.map(async (title: string) => {
          const data = await searchMovies(title);
          return data?.results?.[0];
        })
      );
      setResults(movieResults.filter(Boolean));
    } catch (error) {
      console.error('Mood search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Header */}
      <section className="relative p-6 md:p-12 bg-white/5 rounded-[32px] md:rounded-[40px] border border-white/5 overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <SearchIcon size={120} className="text-[#ff4e00] md:w-[240px] md:h-[240px]" />
        </div>
        
        <div className="relative space-y-6 md:space-y-8 max-w-3xl mx-auto text-center">
          <div className="space-y-2">
            <span className="text-[8px] md:text-[10px] font-bold text-[#ff4e00] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Sparkles size={12} /> Умный поиск
            </span>
            <h1 className="text-2xl md:text-5xl font-bold tracking-tighter uppercase leading-none">Найдите свой квест</h1>
            <p className="text-white/40 text-[10px] md:text-base font-medium">Ищите по названию или выберите настроение для ИИ-рекомендаций</p>
          </div>

          <form onSubmit={handleSearch} className="relative group/input flex flex-col sm:block gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введите название фильма..."
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-3xl p-3.5 md:p-6 pl-10 md:pl-16 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff4e00]/50 transition-all font-medium text-xs md:text-lg"
              />
              <SearchIcon className="absolute left-3.5 md:left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#ff4e00] transition-colors" size={18} />
            </div>
            <button 
              type="submit"
              className="sm:absolute sm:right-3 sm:top-1/2 sm:-translate-y-1/2 bg-[#ff4e00] hover:bg-[#ff6a26] text-white px-5 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-[#ff4e00]/20 text-[10px] md:text-sm uppercase tracking-widest"
            >
              ПОИСК
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            {moods.map((mood) => (
              <button 
                key={mood.id}
                onClick={() => handleMoodSearch(mood.label)}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border transition-all transform hover:scale-105 active:scale-95",
                  selectedMood === mood.label 
                    ? "bg-[#ff4e00] border-[#ff4e00] text-white" 
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                )}
              >
                <mood.icon size={14} className={selectedMood === mood.label ? "text-white" : mood.color} />
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase">
              {isMoodSearch ? `Рекомендации для настроения: ${selectedMood}` : query ? `Результаты поиска: ${query}` : 'Популярные жанры'}
            </h2>
            <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">Найдено {results.length} фильмов</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 5).map((genre) => (
              <button 
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={cn(
                  "px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                  selectedGenre === genre.id 
                    ? "bg-white text-black border-white" 
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 space-y-6"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-[#ff4e00] border-t-transparent rounded-full"
              />
              <p className="text-[#ff4e00] font-bold uppercase tracking-[0.3em] animate-pulse">ИИ подбирает фильмы...</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
            >
              {results.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  genres={genres}
                  isFavorite={movie.id ? favorites.includes(movie.id.toString()) : false}
                  onToggleFavorite={(id) => id && toggleFavorite(id.toString())}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-4 opacity-40"
            >
              <SearchIcon size={64} />
              <p className="font-bold uppercase tracking-widest text-sm">Ничего не найдено</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
