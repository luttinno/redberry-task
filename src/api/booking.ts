import type { TicketOrder } from "./tickets";
import { apiRequest, type ApiEnvelope } from "./client";
import type {
  BookingSession,
  CreateOrderInput,
  HoldSelection,
  SeatHold,
  SeatHoldLookup,
  SeatMap,
} from "../features/booking/types";

export const bookingApi = {
  async getSession(sessionId: number): Promise<BookingSession> {
    const response = await apiRequest<ApiEnvelope<BookingSession>>(
      `/sessions/${sessionId}`,
    );
    return response.data;
  },

  async getSeatMap(sessionId: number): Promise<SeatMap> {
    const response = await apiRequest<ApiEnvelope<SeatMap>>(
      `/sessions/${sessionId}/seats`,
    );
    return response.data;
  },

  async createHold(
    sessionId: number,
    seats: HoldSelection[],
  ): Promise<SeatHold> {
    const response = await apiRequest<ApiEnvelope<SeatHold>>(
      `/sessions/${sessionId}/holds`,
      { method: "POST", body: JSON.stringify({ seats }) },
    );
    return response.data;
  },

  async releaseHold(holdId: string): Promise<void> {
    return apiRequest<void>(`/holds/${encodeURIComponent(holdId)}`, {
      method: "DELETE",
      suppressUnauthorized: true,
    });
  },

  async getHold(holdId: string): Promise<SeatHoldLookup> {
    const response = await apiRequest<ApiEnvelope<SeatHoldLookup>>(
      `/holds/${encodeURIComponent(holdId)}`,
    );
    return response.data;
  },

  async createOrder(input: CreateOrderInput): Promise<TicketOrder> {
    const response = await apiRequest<ApiEnvelope<TicketOrder>>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.data;
  },
};
