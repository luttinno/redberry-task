import { apiRequest, type ApiEnvelope } from "./client";
import type {
  MovieAgeRating,
  MovieFormat,
  MovieLanguage,
  Venue,
} from "../features/movies/types";

export interface FilterOptions {
  venues: Venue[];
  formats: MovieFormat[];
  languages: MovieLanguage[];
  timeBands: Array<{ id: string; label: string }>;
  sorts: Array<{ id: string; label: string }>;
  ticketTypes: Array<{
    id: number;
    slug: string;
    name: string;
    priceRatio: number;
    note: string | null;
    blockedFromRatingAge: number | null;
  }>;
  ageRatings: MovieAgeRating[];
  maxSeatsPerOrder: number;
  holdMinutes: number;
}

export const filterOptionsApi = {
  async getOptions(): Promise<FilterOptions> {
    const response =
      await apiRequest<ApiEnvelope<FilterOptions>>("/filter-options");
    return response.data;
  },
};
