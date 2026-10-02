import type {
  Movie,
  MovieFormat,
  MovieLanguage,
  MovieSession,
  Venue,
} from "../movies/types";

export interface BookingSession extends Omit<
  MovieSession,
  "hall" | "venue" | "format" | "language" | "movie"
> {
  hall: { id: number; name: string; venue: Venue };
  venue: Venue;
  format: MovieFormat;
  language: MovieLanguage;
  movie: Movie;
}

export type SeatState = "available" | "sold" | "held" | "unavailable";

export interface BookingSeat {
  id: number;
  code: string;
  label: string;
  state: SeatState;
  aisleAfter: boolean;
  isMine: boolean;
}

export interface SeatMap {
  sessionId: number;
  hall: {
    id: number;
    name: string;
    venue: Venue;
  };
  sections: Array<{
    name: string;
    rows: Array<{
      label: string;
      seats: BookingSeat[];
    }>;
  }>;
}

export interface HoldSelection {
  seatId: number;
  ticketType: string;
}

export interface SeatHold {
  holdId: string;
  sessionId: number;
  expiresAt: string;
  secondsRemaining: number;
  isLive: boolean;
  subtotal: number;
  seats: Array<{
    seatId: number;
    code: string;
    ticketType: { slug: string; name: string };
    price: number;
  }>;
}

export interface ExpiredSeatHold {
  isLive: false;
  secondsRemaining: number;
}

export type SeatHoldLookup = SeatHold | ExpiredSeatHold;

export interface CreateOrderInput {
  holdId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}
