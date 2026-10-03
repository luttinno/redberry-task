import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { movieApi } from "../../api/movies";

export const movieQueryKeys = {
  featured: ["movies", "featured"] as const,
  nowPlaying: ["movies", "now-playing"] as const,
  comingSoon: ["movies", "coming-soon"] as const,
};

export function useHomeMovies() {
  const featured = useQuery({
    queryKey: movieQueryKeys.featured,
    queryFn: movieApi.getFeatured,
    staleTime: 5 * 60 * 1000,
  });
  const nowPlaying = useQuery({
    queryKey: movieQueryKeys.nowPlaying,
    queryFn: movieApi.getNowPlaying,
    staleTime: 5 * 60 * 1000,
  });
  const comingSoon = useQuery({
    queryKey: movieQueryKeys.comingSoon,
    queryFn: movieApi.getComingSoon,
    staleTime: 5 * 60 * 1000,
  });

  return { featured, nowPlaying, comingSoon };
}

export function useSearchMovies(enabled: boolean) {
  const nowPlaying = useQuery({
    queryKey: movieQueryKeys.nowPlaying,
    queryFn: movieApi.getNowPlaying,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const comingSoon = useQuery({
    queryKey: movieQueryKeys.comingSoon,
    queryFn: movieApi.getComingSoon,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return { nowPlaying, comingSoon };
}

export function useNotifyMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: movieApi.notify,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: movieQueryKeys.comingSoon }),
  });
}
