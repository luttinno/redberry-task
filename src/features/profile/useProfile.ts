import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, type UpdateProfileInput } from "../../api/profile";
import type { User } from "../auth/types";
import { useFilterOptions } from "../sessions/useFilterOptions";

export function useVenues() {
  const options = useFilterOptions();
  return { ...options, data: options.data?.venues };
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
