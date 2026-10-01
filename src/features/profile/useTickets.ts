import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ticketsApi,
  type TicketFilter,
  type TicketOrder,
} from "../../api/tickets";

export function useTickets(filter: TicketFilter, enabled = true) {
  return useQuery({
    queryKey: ["tickets", filter],
    queryFn: () => ticketsApi.getTickets(filter),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ticketsApi.refundOrder,
    onSuccess: (updatedOrder: TicketOrder) => {
      queryClient.setQueryData<TicketOrder[]>(
        ["tickets", "upcoming"],
        (orders) => orders?.filter((order) => order.id !== updatedOrder.id),
      );
      queryClient.setQueryData<TicketOrder[]>(["tickets", "past"], (orders) =>
        orders
          ? [
              updatedOrder,
              ...orders.filter((order) => order.id !== updatedOrder.id),
            ]
          : [updatedOrder],
      );
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
