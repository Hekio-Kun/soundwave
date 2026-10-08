import { AuthApiError } from "./auth";
import { ApiError, apiFetch } from "./client";

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

async function request<T>(method: "GET" | "PATCH", body?: UpdateProfileInput, avatar?: File): Promise<T> {
  const formData = avatar ? new FormData() : null;
  if (formData && avatar) {
    formData.append("profile", new Blob([JSON.stringify(body)], { type: "application/json" }));
    formData.append("avatar", avatar);
  }

  try {
    return await apiFetch<T>("/profile", {
      method,
      body: formData ?? body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new AuthApiError({
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      }, error.status);
    }
    throw error;
  }
}

export const profileApi = {
  getCurrent: () => request<ProfileDetails>("GET"),
  updateCurrent: (body: UpdateProfileInput, avatar?: File) => request<ProfileDetails>("PATCH", body, avatar),
};
