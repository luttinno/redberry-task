export interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.errors = payload.errors;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  suppressUnauthorized?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, suppressUnauthorized, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");

  const isFormData = requestOptions.body instanceof FormData;
  if (requestOptions.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = skipAuth ? null : localStorage.getItem("kino-xii-token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // Keep the HTTP status when the server doesn't return JSON.
    }

    const error = new ApiError(response.status, payload);
    if (response.status === 401 && !suppressUnauthorized) {
      unauthorizedHandler?.();
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface ApiEnvelope<T> {
  data: T;
}
