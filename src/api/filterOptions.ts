import { apiRequest, type ApiEnvelope } from "./client";
import type { Venue } from "../features/movies/types";

export const filterOptionsApi = {
  async getVenues(): Promise<Venue[]> {
    const response =
      await apiRequest<ApiEnvelope<{ venues: Venue[] }>>("/filter-options");
    return response.data.venues;
  },
};
