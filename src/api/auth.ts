import { apiRequest, type ApiEnvelope } from "./client";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../features/auth/types";

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<ApiEnvelope<AuthResponse>>("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuth: true,
      suppressUnauthorized: true,
    });
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("email", credentials.email);
    formData.append("password", credentials.password);
    formData.append("password_confirmation", credentials.passwordConfirmation);
    if (credentials.avatar) formData.append("avatar", credentials.avatar);

    const response = await apiRequest<ApiEnvelope<AuthResponse>>("/register", {
      method: "POST",
      body: formData,
      skipAuth: true,
      suppressUnauthorized: true,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiRequest<ApiEnvelope<User>>("/me", {
      suppressUnauthorized: true,
    });
    return response.data;
  },

  logout(): Promise<void> {
    return apiRequest<void>("/logout", {
      method: "POST",
      suppressUnauthorized: true,
    });
  },
};
