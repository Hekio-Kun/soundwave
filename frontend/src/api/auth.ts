import type { CurrentUser } from "../types";
import { API_BASE_URL, clearAccessToken, setAccessToken, silentRefresh } from "./client";

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
  login: async (email: string, password: string, rememberMe: boolean) => {
    const session = await request<AuthSession>("/auth/login", { email, password, rememberMe });
    setAccessToken(session.accessToken);
    return session;
  },
  forgotPassword: (email: string) =>
    request<MessageResponse>("/auth/forgot-password", { email }),
  resetPassword: (email: string, otp: string, newPassword: string, confirmPassword: string) =>
    request<MessageResponse>("/auth/reset-password", { email, otp, newPassword, confirmPassword }),
  refresh: async () => {
    const session = await silentRefresh<AuthSession>();
    if (!session) {
      throw new AuthApiError({
        code: "INVALID_REFRESH_TOKEN",
        message: "Your session has expired. Please log in again.",
      }, 401);
    }
    return session;
  },
  logout: async () => {
    try {
      await request<void>("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AuthApiError) return error.message;
  if (error instanceof TypeError) return "Unable to connect to SoundWave. Please try again.";
  return fallback;
}
