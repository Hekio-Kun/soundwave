import { AuthApiError } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type ProfileDetails = {
  userId: number;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  countryCode: string | null;
  role: "LISTENER" | "STAFF" | "ADMIN";
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = {
  username: string;
  displayName: string;
  bio: string | null;
  dateOfBirth: string | null;
  countryCode: string | null;
};

type ApiError = {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function getAccessToken() {
  return localStorage.getItem("soundwave_access_token")
    ?? sessionStorage.getItem("soundwave_access_token");
}

async function request<T>(method: "GET" | "PATCH", body?: UpdateProfileInput, avatar?: File): Promise<T> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new AuthApiError({
      code: "AUTH_REQUIRED",
      message: "Your login session is missing. Please log in again.",
    }, 401);
  }

  const formData = avatar ? new FormData() : null;
  if (formData && avatar) {
    formData.append("profile", new Blob([JSON.stringify(body)], { type: "application/json" }));
    formData.append("avatar", avatar);
  }

  const response = await fetch(`${API_BASE_URL}/profile`, {
    method,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(formData ? {} : { "Content-Type": "application/json" }),
    },
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiError;
    throw new AuthApiError(payload, response.status);
  }
  return response.json() as Promise<T>;
}

export const profileApi = {
  getCurrent: () => request<ProfileDetails>("GET"),
  updateCurrent: (body: UpdateProfileInput, avatar?: File) => request<ProfileDetails>("PATCH", body, avatar),
};
