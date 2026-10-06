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
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "APPROVED" | "REJECTED" | "TAKEN_DOWN";
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
  durationMs?: number;
  lyrics?: string;
};

export type UpdateTrackPayload = {
  title: string;
  genreId: number;
  albumId?: number;
  trackNumber?: number;
  description?: string;
  durationMs?: number;
  lyrics?: string;
};

type TrackApiErrorPayload = {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export class TrackApiError extends Error {
  readonly code?: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(payload: TrackApiErrorPayload, status: number) {
    super(payload.message || "The track could not be saved. Please try again.");
    this.name = "TrackApiError";
    this.code = payload.code;
    this.status = status;
    this.fieldErrors = payload.fieldErrors ?? {};
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem("soundwave_access_token") ?? sessionStorage.getItem("soundwave_access_token");
}

async function studioRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown | FormData
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new TrackApiError({
      code: "AUTH_REQUIRED",
      message: "Please log in before managing your tracks.",
    }, 401);
  }

  const headers: Record<string, string> = {};
  headers["Authorization"] = `Bearer ${token}`;
  const isMultipart = body instanceof FormData;
  if (body !== undefined && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : isMultipart ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({})) as TrackApiErrorPayload;
    throw new TrackApiError(errorPayload, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildTrackFormData(
  payload: CreateTrackPayload | UpdateTrackPayload,
  audio?: File,
  cover?: File,
): FormData {
  const formData = new FormData();
  formData.append("track", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (audio) formData.append("audio", audio);
  if (cover) formData.append("cover", cover);
  return formData;
}

export const studioApi = {
  getMyTracks: (status?: string) => {
    const backendStatus = status === "APPROVED" ? "PUBLISHED" : status;
    return studioRequest<ApiTrack[]>(`/studio/tracks${backendStatus && backendStatus !== "ALL" ? `?status=${backendStatus}` : ""}`);
  },
  getTrackById: (id: number) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}`),
  createDraft: (payload: CreateTrackPayload, audio: File, cover?: File) =>
    studioRequest<ApiTrack>("/studio/tracks", "POST", buildTrackFormData(payload, audio, cover)),
  updateTrack: (id: number, payload: UpdateTrackPayload, audio?: File, cover?: File) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}`, "PUT", buildTrackFormData(payload, audio, cover)),
  deleteTrack: (id: number) =>
    studioRequest<void>(`/studio/tracks/${id}`, "DELETE"),
  submitForReview: (id: number, submitterNote?: string) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}/submit`, "POST", { submitterNote }),
  withdrawSubmission: (id: number) =>
    studioRequest<ApiTrack>(`/studio/tracks/${id}/withdraw`, "POST"),
  getRejectionDetails: (id: number) =>
    studioRequest<RejectionDetails>(`/studio/tracks/${id}/rejection`),
  getStats: () =>
    studioRequest<StudioStats>("/studio/stats"),
  getGenres: () =>
    studioRequest<GenreOption[]>("/studio/genres"),
  getMyAlbums: () =>
    studioRequest<AlbumOption[]>("/studio/albums"),
};
