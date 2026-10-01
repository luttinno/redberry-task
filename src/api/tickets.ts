import { apiRequest, type ApiEnvelope } from "./client";

export type TicketFilter = "upcoming" | "past";

export interface TicketOrder {
  id: number;
  reference: string;
  status: "paid" | "refunded";
  totalPrice: number;
  paidAt: string;
  refundedAt: string | null;
  isUpcoming: boolean;
  isRefundable: boolean;
  cardLastFour: string;
  contact: {
    fullName: string;
    email: string;
    mobileNumber: string;
  };
  session: {
    id: number;
    startsAt: string;
    date: string;
    time: string;
    hall: { id: number; name: string };
    venue: { id: number; name: string; city: string };
    format: { id: number; name: string };
    language: { id: number; name: string };
    movie: {
      id: number;
      slug: string;
      title: string;
      runtimeMinutes: number;
      posterUrl: string | null;
      ageRating: { code: string; minAge: number; description: string };
    };
  };
  tickets: Array<{
    id: number;
    seatCode: string;
    ticketType: { slug: string; name: string };
    price: number;
  }>;
}

export const ticketsApi = {
  async getTickets(filter: TicketFilter): Promise<TicketOrder[]> {
    const query = new URLSearchParams({ filter });
    const response = await apiRequest<ApiEnvelope<TicketOrder[]>>(
      `/tickets?${query.toString()}`,
    );
    return response.data;
  },

  async refundOrder(orderId: number): Promise<TicketOrder> {
    const response = await apiRequest<ApiEnvelope<TicketOrder>>(
      `/orders/${orderId}/refund`,
      { method: "POST" },
    );
    return response.data;
  },
};
