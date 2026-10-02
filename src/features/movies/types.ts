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

export interface MovieLanguage {
  id: number;
  slug: string;
  name: string;
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

export interface MovieDetail extends Omit<Movie, "posterUrl" | "backdropUrl"> {
  posterUrl: string | null;
  backdropUrl: string | null;
  synopsis: string;
  director: string | null;
  cast: string | null;
  availableDates: unknown;
}

export interface MovieSession {
  id: number;
  startsAt: string;
  date: string;
  time: string;
  timeBand: string;
  price: number;
  seatsLeft: number;
  isSoldOut: boolean;
  hall?: {
    id?: number;
    name?: string;
    venue?: Venue;
  };
  venue?: Venue;
  format?: MovieFormat;
  language?: {
    id: number;
    slug: string;
    name: string;
  };
  movie?: Movie;
}

export interface MovieSessionVenueGroup {
  venue: Venue;
  sessions: MovieSession[];
}
