export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  points: number;
  tokens: number;
  level: number;
  status?: 'vip' | 'regular';
  achievements: string[];
  createdAt: any;
  settings?: {
    emailNotifications: boolean;
    publicProfile: boolean;
    language: 'ru' | 'en';
  };
}

export interface Movie {
  tmdbId: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number;
  genres: string[];
  kodikId?: string;
  trailerUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  movieId: string;
  text: string;
  createdAt: any;
  likes: number;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'watch' | 'comment' | 'favorite' | 'points';
    value: number;
  };
}
