import { apiRequest, type ApiEnvelope } from "./client";
import type { Movie } from "../features/movies/types";

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

  notify(movieId: number): Promise<void> {
    return apiRequest<void>(`/movies/${movieId}/notify`, { method: "POST" });
  },
};
