import { useQuery } from "@tanstack/react-query";
import { filterOptionsApi } from "../../api/filterOptions";

export const filterOptionsQueryKey = ["filter-options"] as const;

export function useFilterOptions() {
  return useQuery({
    queryKey: filterOptionsQueryKey,
    queryFn: filterOptionsApi.getOptions,
    staleTime: 30 * 60 * 1000,
  });
}
