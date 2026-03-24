import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

interface AnimePlayerProps {
  shikimoriId?: string;
  tmdbId?: string;
  imdbId?: string;
  kodikId?: string;
  title?: string;
}

export const AnimePlayer: React.FC<AnimePlayerProps> = ({ shikimoriId, tmdbId, imdbId, kodikId, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct the Kodik URL
  // Priority: Kodik ID > Shikimori ID > IMDB ID > TMDB ID
  let playerUrl = null;
  if (kodikId) {
    playerUrl = `https://kodik.info/video/${kodikId}`;
  } else if (shikimoriId) {
    playerUrl = `https://kodik.info/find-player?shikimori_id=${shikimoriId}`;
  } else if (imdbId) {
    playerUrl = `https://kodik.info/find-player?imdb_id=${imdbId}`;
  } else if (tmdbId) {
    playerUrl = `https://kodik.info/find-player?tmdb_id=${tmdbId}`;
  }

  useEffect(() => {
    if (!playerUrl) {
      setError('No video source provided');
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setError(null);
    }
  }, [playerUrl]);

  // Listen for messages from the Kodik iframe and forward them to the parent window
  // This allows the Movie.tsx component to track progress and events
  useEffect(() => {
    const handleKodikMessage = (event: MessageEvent) => {
      // Kodik sends messages with a specific structure
      // We forward them to our own app's message handler
      if (event.data && event.data.key && event.data.key.startsWith('kodik_player_')) {
        window.postMessage(event.data, '*');
      }
    };

    window.addEventListener('message', handleKodikMessage);
    return () => window.removeEventListener('message', handleKodikMessage);
  }, []);

  if (error) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-[40px] flex items-center justify-center text-zinc-500 border border-zinc-800">
        <div className="text-center">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl group border border-white/10">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0502] z-10">
          <div className="w-12 h-12 border-4 border-white/5 border-t-[#ff4e00] rounded-full animate-spin"></div>
        </div>
      )}
      
      {playerUrl && (
        <iframe
          ref={iframeRef}
          src={playerUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* Title Overlay */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <h3 className="text-white font-bold text-xl uppercase tracking-tighter drop-shadow-2xl">
          {title || 'Playing Now'}
        </h3>
      </div>
    </div>
  );
};
