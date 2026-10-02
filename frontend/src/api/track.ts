const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type ApiTrack = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  genreId: number;
  genreName: string;
  genreSlug: string;
  albumId?: number;
  albumTitle?: string;
  trackNumber?: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "TAKEN_DOWN";
  audioUrl: string;
  audioFormat?: string;
  durationMs: number;
  coverUrl?: string;
  playCount: number;
  latestRejectionReason?: string;
  reviewerNote?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  lyrics?: string;
};

export type StudioStats = {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type GenreOption = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type AlbumOption = {
  id: number;
  title: string;
  slug: string;
};

export type RejectionDetails = {
  trackId: number;
  trackTitle: string;
  status: string;
  rejectionReason: string;
  reviewerNote?: string;
  reviewedAt?: string;
};

export type CreateTrackPayload = {
  title: string;
  genreId: number;
  albumId?: number;
  trackNumber?: number;
  description?: string;
  audioUrl?: string;
  audioPublicId?: string;
  audioFormat?: string;
  durationMs?: number;
  coverUrl?: string;
  coverPublicId?: string;
  lyrics?: string;
};

export type UpdateTrackPayload = {
  title: string;
  genreId: number;
  albumId?: number;
  trackNumber?: number;
  description?: string;
  audioUrl?: string;
  audioPublicId?: string;
  audioFormat?: string;
  durationMs?: number;
  coverUrl?: string;
  coverPublicId?: string;
  lyrics?: string;
};

function getAuthToken(): string | null {
  return localStorage.getItem("soundwave_access_token") ?? sessionStorage.getItem("soundwave_access_token");
}

async function studioRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const studioApi = {
  getMyTracks: (status?: string) =>
    studioRequest<ApiTrack[]>(`/studio/tracks${status && status !== "ALL" ? `?status=${status}` : ""}`),
  getTrackById: (id: number) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}`),
  createDraft: (payload: CreateTrackPayload) =>
    studioRequest<ApiTrack>("/studio/tracks", "POST", payload),
  updateTrack: (id: number, payload: UpdateTrackPayload) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}`, "PUT", payload),
  deleteTrack: (id: number) =>
    studioRequest<void>(`/studio/tracks/${id}`, "DELETE"),
  submitForReview: (id: number, submitterNote?: string) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}/submit`, "POST", { submitterNote }),
  getRejectionDetails: (id: number) =>
    studioRequest<RejectionDetails>(`/studio/tracks/${id}/rejection`),
  getStats: () =>
    studioRequest<StudioStats>("/studio/stats"),
  getGenres: () =>
    studioRequest<GenreOption[]>("/studio/genres"),
  getMyAlbums: () =>
    studioRequest<AlbumOption[]>("/studio/albums"),
};
