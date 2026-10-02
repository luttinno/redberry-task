import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "../../api/booking";
import type { CreateOrderInput, HoldSelection } from "./types";

export const bookingQueryKeys = {
  session: (sessionId: number) => ["booking", "session", sessionId] as const,
  seats: (sessionId: number) => ["booking", "seats", sessionId] as const,
};

export function useBookingSession(sessionId: number, enabled = true) {
  return useQuery({
    queryKey: bookingQueryKeys.session(sessionId),
    queryFn: () => bookingApi.getSession(sessionId),
    enabled: enabled && Number.isInteger(sessionId) && sessionId > 0,
    staleTime: 60 * 1000,
  });
}

export function useBookingSeats(sessionId: number, enabled = true) {
  return useQuery({
    queryKey: bookingQueryKeys.seats(sessionId),
    queryFn: () => bookingApi.getSeatMap(sessionId),
    enabled: enabled && Number.isInteger(sessionId) && sessionId > 0,
    staleTime: 0,
  });
}

export function useCreateSeatHold(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seats: HoldSelection[]) =>
      bookingApi.createHold(sessionId, seats),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.seats(sessionId),
      }),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => bookingApi.createOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}
