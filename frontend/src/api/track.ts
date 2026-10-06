import { ApiError, apiFetch } from "./client";

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

async function studioRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown | FormData
): Promise<T> {
  try {
    return await apiFetch<T>(path, { method, body });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new TrackApiError({
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      }, error.status);
    }
    throw error;
  }
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
