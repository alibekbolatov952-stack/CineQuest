import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Heart, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date: string;
    overview?: string;
  };
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  variant?: 'grid' | 'list';
}

export default function MovieCard({ movie, isFavorite, onToggleFavorite, variant = 'grid' }: MovieCardProps) {
  if (variant === 'list') {
    return (
      <motion.div 
        whileHover={{ x: 10 }}
        className="group relative bg-white/5 rounded-3xl overflow-hidden border border-white/5 hover:border-[#ff4e00]/50 transition-all duration-500 flex gap-6 p-4"
      >
        <Link to={`/movie/${movie.id}`} className="shrink-0 w-32 aspect-[2/3] relative rounded-2xl overflow-hidden">
          <img 
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} 
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play fill="white" size={24} />
          </div>
        </Link>
        
        <div className="flex-1 flex flex-col justify-center space-y-3">
          <div className="flex items-start justify-between gap-4">
            <Link to={`/movie/${movie.id}`} className="space-y-1">
              <h3 className="font-bold text-xl group-hover:text-[#ff4e00] transition-colors uppercase tracking-tight leading-none">{movie.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{movie.release_date?.split('-')[0] || 'N/A'}</span>
                <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                  <Star size={10} className="text-[#ff4e00]" fill="#ff4e00" />
                  <span className="text-[10px] font-bold tracking-widest">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </Link>
            <button 
              onClick={() => onToggleFavorite?.(movie.id)}
              className={cn(
                "p-3 rounded-2xl border border-white/5 transition-all duration-300 transform hover:scale-110 active:scale-95",
                isFavorite ? "bg-[#ff4e00] text-white border-[#ff4e00]" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              <Heart size={20} fill={isFavorite ? "white" : "none"} />
            </button>
          </div>
          <p className="text-white/40 text-sm line-clamp-2 font-medium leading-relaxed max-w-2xl">
            {movie.overview}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-[#ff4e00]/50 transition-all duration-500 shadow-2xl shadow-black/40"
    >
      <Link to={`/movie/${movie.id}`}>
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#ff4e00] flex items-center justify-center shadow-xl shadow-[#ff4e00]/40 transform scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
              <Play fill="white" size={32} className="ml-1" />
            </div>
          </div>
          
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
            <Star size={14} className="text-[#ff4e00]" fill="#ff4e00" />
            <span className="text-xs font-bold tracking-widest">{movie.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/movie/${movie.id}`} className="flex-1">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-[#ff4e00] transition-colors uppercase tracking-tight">{movie.title}</h3>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{movie.release_date?.split('-')[0] || 'N/A'}</p>
          </Link>
          <button 
            onClick={() => onToggleFavorite?.(movie.id)}
            className={cn(
              "p-2 rounded-xl border border-white/5 transition-all duration-300 transform hover:scale-110 active:scale-95",
              isFavorite ? "bg-[#ff4e00] text-white border-[#ff4e00]" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Heart size={16} fill={isFavorite ? "white" : "none"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
