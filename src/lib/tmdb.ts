const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || 'b8bfe45f5fecf06062319ab474a1b155';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY is not set. Please add it to your environment variables.');
    return null;
  }
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'ru-RU',
    ...params,
  });
  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch from TMDB');
  return response.json();
}

export async function getPopularMovies() {
  const movies = await fetchFromTMDB('/movie/popular');
  const tv = await fetchFromTMDB('/tv/popular');
  return {
    results: [
      ...(movies?.results || []).map((m: any) => ({ ...m, media_type: 'movie', title: m.title || m.name })),
      ...(tv?.results || []).map((t: any) => ({ ...t, media_type: 'tv', title: t.title || t.name }))
    ].sort((a, b) => b.popularity - a.popularity)
  };
}

export async function getTrendingMovies() {
  const data = await fetchFromTMDB('/trending/all/week');
  return {
    results: (data?.results || []).map((m: any) => ({ 
      ...m, 
      title: m.title || m.name,
      media_type: m.media_type || (m.title ? 'movie' : 'tv')
    }))
  };
}

export async function searchMovies(query: string) {
  const movies = await fetchFromTMDB('/search/movie', { query });
  const tv = await fetchFromTMDB('/search/tv', { query });
  return {
    results: [
      ...(movies?.results || []).map((m: any) => ({ ...m, media_type: 'movie', title: m.title || m.name })),
      ...(tv?.results || []).map((t: any) => ({ ...t, media_type: 'tv', title: t.title || t.name }))
    ]
  };
}

export async function getMovieDetails(id: string, type: 'movie' | 'tv' = 'movie') {
  return fetchFromTMDB(`/${type}/${id}`, { append_to_response: 'external_ids' });
}

export async function getMovieVideos(id: string, type: 'movie' | 'tv' = 'movie') {
  return fetchFromTMDB(`/${type}/${id}/videos`);
}

export async function getMovieRecommendations(id: string, type: 'movie' | 'tv' = 'movie') {
  return fetchFromTMDB(`/${type}/${id}/recommendations`);
}
