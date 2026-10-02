import type { CurrentUser } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type AuthSession = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: CurrentUser;
};

type MessageResponse = { message: string };
type ApiError = { code?: string; message?: string; fieldErrors?: Record<string, string> };

export class AuthApiError extends Error {
  code?: string;
  fieldErrors: Record<string, string>;

  constructor(payload: ApiError, status: number) {
    super(payload.message || `Authentication request failed (${status}).`);
    this.name = "AuthApiError";
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors ?? {};
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiError;
    throw new AuthApiError(payload, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  register: (body: { displayName: string; email: string; password: string; confirmPassword: string }) =>
    request<MessageResponse>("/auth/register", body),
  verifyEmail: (email: string, otp: string) =>
    request<MessageResponse>("/auth/verify-email", { email, otp }),
  resendVerificationOtp: (email: string) =>
    request<MessageResponse>("/auth/verification-otp", { email }),
  login: (email: string, password: string, rememberMe: boolean) =>
    request<AuthSession>("/auth/login", { email, password, rememberMe }),
  forgotPassword: (email: string) =>
    request<MessageResponse>("/auth/forgot-password", { email }),
  resetPassword: (email: string, otp: string, newPassword: string, confirmPassword: string) =>
    request<MessageResponse>("/auth/reset-password", { email, otp, newPassword, confirmPassword }),
  refresh: () => request<AuthSession>("/auth/refresh"),
  logout: () => request<void>("/auth/logout"),
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AuthApiError) return error.message;
  if (error instanceof TypeError) return "Unable to connect to SoundWave. Please try again.";
  return fallback;
}
