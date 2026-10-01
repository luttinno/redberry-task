export interface MovieAgeRating {
  code: string;
  minAge: number;
  description: string;
}

export interface MovieGenre {
  id: number;
  slug: string;
  name: string;
}

export interface MovieFormat {
  id: number;
  slug: string;
  name: string;
  priceUplift: number;
}

export interface Venue {
  id: number;
  slug: string;
  name: string;
  city: string;
  formats: MovieFormat[];
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  kind: string;
  runtimeMinutes: number;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  isComingSoon: boolean;
  isNotified: boolean;
  isFeatured: boolean;
  fromPrice: number;
  ageRating: MovieAgeRating;
  genres: MovieGenre[];
  formats: MovieFormat[];
}
