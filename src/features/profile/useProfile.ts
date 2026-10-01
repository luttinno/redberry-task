import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filterOptionsApi } from "../../api/filterOptions";
import { profileApi, type UpdateProfileInput } from "../../api/profile";
import type { User } from "../auth/types";

export function useVenues() {
  return useQuery({
    queryKey: ["filter-options", "venues"],
    queryFn: filterOptionsApi.getVenues,
    staleTime: 30 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.update(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData(["current-user"], user);
    },
  });
}
