import { useQuery } from "@tanstack/react-query";
import { sessionsApi, type SessionListFilters } from "../../api/sessions";

export function useSessions(filters: SessionListFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: () => sessionsApi.getSessions(filters),
    enabled,
    staleTime: 60 * 1000,
  });
}
