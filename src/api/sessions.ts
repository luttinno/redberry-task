import { apiRequest } from "./client";
import type { Movie, MovieSession } from "../features/movies/types";

export interface SessionListFilters {
  venue: string[];
  date: string;
  format: string[];
  language: string[];
  time: string[];
  sort: string;
  page: number;
}

export interface SessionsMovieGroup {
  movie: Movie;
  sessions: MovieSession[];
}

export interface SessionsResponse {
  data: SessionsMovieGroup[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    totalSessions: number;
    totalMovies: number;
    date: string;
  };
}

export const sessionsApi = {
  async getSessions(filters: SessionListFilters): Promise<SessionsResponse> {
    const params = new URLSearchParams({ date: filters.date });
    filters.venue.forEach((value) => params.append("venues[]", value));
    filters.format.forEach((value) => params.append("formats[]", value));
    filters.language.forEach((value) => params.append("languages[]", value));
    params.set("sort", filters.sort);
    params.set("page", String(filters.page));

    return apiRequest<SessionsResponse>(`/sessions?${params.toString()}`);
  },
};
