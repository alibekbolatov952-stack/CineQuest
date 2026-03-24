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
  return fetchFromTMDB('/movie/popular');
}

export async function getTrendingMovies() {
  return fetchFromTMDB('/trending/movie/week');
}

export async function searchMovies(query: string) {
  return fetchFromTMDB('/search/movie', { query });
}

export async function getMovieDetails(id: string) {
  return fetchFromTMDB(`/movie/${id}`);
}

export async function getMovieVideos(id: string) {
  return fetchFromTMDB(`/movie/${id}/videos`);
}

export async function getMovieRecommendations(id: string) {
  return fetchFromTMDB(`/movie/${id}/recommendations`);
}
