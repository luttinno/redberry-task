import { apiRequest, type ApiEnvelope } from "./client";
import type {
  Movie,
  MovieDetail,
  MovieSession,
} from "../features/movies/types";

export const movieApi = {
  async getFeatured(): Promise<Movie[]> {
    const response = await apiRequest<ApiEnvelope<Movie[]>>("/movies/featured");
    return response.data;
  },

  async getNowPlaying(): Promise<Movie[]> {
    const response = await apiRequest<ApiEnvelope<Movie[]>>(
      "/movies/now-playing",
    );
    return response.data;
  },

  async getComingSoon(): Promise<Movie[]> {
    const response = await apiRequest<ApiEnvelope<Movie[]>>(
      "/movies/coming-soon",
    );
    return response.data;
  },

  async getDetail(movieSlug: string): Promise<MovieDetail> {
    const response = await apiRequest<ApiEnvelope<MovieDetail>>(
      `/movies/${encodeURIComponent(movieSlug)}`,
    );
    return response.data;
  },

  async getSessions(movieSlug: string, date: string): Promise<MovieSession[]> {
    const params = new URLSearchParams({ date });
    const response = await apiRequest<ApiEnvelope<MovieSession[]>>(
      `/movies/${encodeURIComponent(movieSlug)}/sessions?${params}`,
    );
    return response.data;
  },

  notify(movieId: number): Promise<void> {
    return apiRequest<void>(`/movies/${movieId}/notify`, { method: "POST" });
  },
};
