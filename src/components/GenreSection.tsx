import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getGenres, getMoviesByGenre } from '../lib/tmdb';

interface GenreCardProps {
  id: number;
  title: string;
  posters: string[];
}

const GenreCard = ({ id, title, posters }: GenreCardProps) => {
  return (
    <Link to={`/genre/${id}`} className="block shrink-0">
      <motion.div 
        whileHover="hover"
        initial="initial"
        className="relative w-[320px] md:w-[450px] aspect-[16/12] bg-[#050505] rounded-[48px] border border-white/5 overflow-hidden group cursor-pointer flex flex-col items-center justify-end pb-12"
      >
        {/* Background Decorative Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff4e00]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Title - Positioned at the top with high visibility */}
        <div className="absolute top-10 left-0 right-0 z-40 px-6 text-center">
          <motion.h3 
            variants={{
              initial: { y: 0, opacity: 0.8 },
              hover: { y: -5, opacity: 1, scale: 1.1 }
            }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,0,0,1)] leading-none"
          >
            {title}
          </motion.h3>
          <motion.div 
            variants={{
              initial: { scaleX: 0 },
              hover: { scaleX: 1 }
            }}
            className="h-1 w-16 bg-[#ff4e00] mx-auto mt-4 rounded-full shadow-[0_0_10px_rgba(255,78,0,0.5)]" 
          />
        </div>
        
        {/* Fan Animation (Веер) - Pivoting from the bottom */}
        <div className="relative w-full h-40 md:h-56 flex items-center justify-center">
          {posters.map((url, i) => (
            <motion.div
              key={i}
              variants={{
                initial: { 
                  rotate: i === 0 ? -10 : i === 1 ? 0 : 10, 
                  x: i === 0 ? -40 : i === 1 ? 0 : 40,
                  y: 20,
                  zIndex: i === 1 ? 20 : 10
                },
                hover: { 
                  rotate: i === 0 ? -30 : i === 1 ? 0 : 30,
                  x: i === 0 ? -130 : i === 1 ? 0 : 130,
                  y: i === 1 ? -50 : -10,
                  scale: i === 1 ? 1.2 : 1.1,
                  zIndex: i === 1 ? 30 : 20
                }
              }}
              transition={{ type: "spring", stiffness: 90, damping: 12 }}
              className="absolute w-24 md:w-36 aspect-[2/3] rounded-[20px] overflow-hidden border-2 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9)] origin-bottom transition-shadow duration-500"
            >
              <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </motion.div>
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="absolute bottom-6 left-0 right-0 z-40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <span className="text-[10px] font-black tracking-[0.5em] text-[#ff4e00] uppercase ml-[0.5em]">Открыть</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] shadow-[0_0_10px_rgba(255,78,0,0.8)] animate-pulse" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function GenreSection() {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const allGenres = await getGenres();
        
        // Pick specific popular genres for a better curated experience
        const popularGenreIds = [28, 12, 16, 35, 80, 18, 10751, 14, 27, 10749, 878, 53];
        const selectedGenres = allGenres
          .filter((g: any) => popularGenreIds.includes(g.id))
          .sort((a: any, b: any) => popularGenreIds.indexOf(a.id) - popularGenreIds.indexOf(b.id));
        
        const genresWithPosters = await Promise.all(
          selectedGenres.map(async (genre: any) => {
            const movies = await getMoviesByGenre(genre.id);
            const posters = (movies?.results || [])
              .slice(0, 3)
              .map((m: any) => `https://image.tmdb.org/t/p/w500${m.poster_path}`);
            return {
              id: genre.id,
              title: genre.name,
              posters
            };
          })
        );
        
        setGenres(genresWithPosters.filter(g => g.posters.length === 3));
      } catch (error) {
        console.error('Error loading genres:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, []);

  if (loading) return null;

  return (
    <section className="space-y-8 py-12">
      <div className="flex items-center gap-4">
        <Layers size={32} className="text-[#ff4e00]" />
        <h2 className="text-4xl font-black tracking-tighter uppercase">ЖАНРЫ</h2>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-12 no-scrollbar -mx-4 px-4 md:-mx-8 md:px-8">
        {genres.map((genre, idx) => (
          <GenreCard key={idx} id={genre.id} title={genre.title} posters={genre.posters} />
        ))}
      </div>
    </section>
  );
}
