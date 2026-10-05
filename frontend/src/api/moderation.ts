import { API_BASE_URL } from "./client";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SubmissionStats = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
};

export type SubmissionQueueItem = {
  id: number;
  trackId: number;
  trackTitle: string;
  genreName: string | null;
  albumTitle: string | null;
  coverUrl: string | null;
  durationMs: number | null;
  submitterId: number;
  submitterDisplayName: string | null;
  submitterEmail: string | null;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerDisplayName: string | null;
};

export type SubmissionDetail = {
  id: number;
  status: SubmissionStatus;
  submitterNote: string | null;
  reviewerNote: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  track: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    trackNumber: number | null;
    publicationStatus: string;
    audioUrl: string;
    audioFormat: string;
    durationMs: number;
    coverUrl: string | null;
    playCount: number;
    approvedAt: string | null;
    latestRejectionReason: string | null;
    createdAt: string;
    genre: { id: number; name: string; slug: string } | null;
    album: { id: number; title: string; slug: string; status: string } | null;
  };
  submitter: { id: number; email: string; username: string; displayName: string } | null;
  reviewer: { id: number; email: string; username: string; displayName: string } | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

function getAuthToken(): string | null {
  return localStorage.getItem("soundwave_access_token") ?? sessionStorage.getItem("soundwave_access_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const moderationApi = {
  getStats: () => apiFetch<SubmissionStats>("/moderation/submissions/stats"),

  getQueue: (params: { status?: string; search?: string; page?: number; size?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "ALL") {
      searchParams.set("status", params.status);
    }
    if (params.search && params.search.trim()) {
      searchParams.set("search", params.search.trim());
    }
    searchParams.set("page", String(params.page ?? 0));
    searchParams.set("size", String(params.size ?? 10));

    return apiFetch<PageResponse<SubmissionQueueItem>>(`/moderation/submissions?${searchParams.toString()}`);
  },

  getSubmissionDetail: (id: number) =>
    apiFetch<SubmissionDetail>(`/moderation/submissions/${id}`),

  approveSubmission: (
    id: number,
    reviewerNoteOrRequest?: string | { reviewerNote?: string }
  ) => {
    const note =
      typeof reviewerNoteOrRequest === "string"
        ? reviewerNoteOrRequest
        : reviewerNoteOrRequest?.reviewerNote;
    return apiFetch<SubmissionDetail>(`/moderation/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewerNote: note || undefined }),
    });
  },

  rejectSubmission: (
    id: number,
    reasonOrRequest: string | { rejectionReason: string; reviewerNote?: string },
    reviewerNoteParam?: string
  ) => {
    const reason =
      typeof reasonOrRequest === "string"
        ? reasonOrRequest
        : reasonOrRequest.rejectionReason;
    const note =
      typeof reasonOrRequest === "string"
        ? reviewerNoteParam
        : reasonOrRequest.reviewerNote;
    return apiFetch<SubmissionDetail>(`/moderation/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({
        rejectionReason: reason,
        reviewerNote: note || undefined,
      }),
    });
  },
};
