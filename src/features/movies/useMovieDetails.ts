import { useQuery } from "@tanstack/react-query";
import { movieApi } from "../../api/movies";

export const movieDetailQueryKeys = {
  detail: (slug: string) => ["movies", "detail", slug] as const,
  sessions: (slug: string, date: string) =>
    ["movies", slug, "sessions", date] as const,
};

export function useMovieDetail(movieSlug: string) {
  return useQuery({
    queryKey: movieDetailQueryKeys.detail(movieSlug),
    queryFn: () => movieApi.getDetail(movieSlug),
    enabled: Boolean(movieSlug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMovieSessions(movieSlug: string, date: string) {
  return useQuery({
    queryKey: movieDetailQueryKeys.sessions(movieSlug, date),
    queryFn: () => movieApi.getSessions(movieSlug, date),
    enabled: Boolean(movieSlug && date),
    staleTime: 60 * 1000,
  });
}
