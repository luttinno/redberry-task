import { apiRequest, type ApiEnvelope } from "./client";
import type { User } from "../features/auth/types";

export interface UpdateProfileInput {
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  preferredVenueId: string;
}

export const profileApi = {
  async update(input: UpdateProfileInput): Promise<User> {
    const body = new FormData();
    body.append("fullName", input.fullName);
    body.append("mobileNumber", input.mobileNumber);
    body.append("dateOfBirth", input.dateOfBirth);
    body.append("preferredVenueId", input.preferredVenueId);

    const response = await apiRequest<ApiEnvelope<User>>("/profile", {
      method: "PUT",
      body,
    });
    return response.data;
  },
};
