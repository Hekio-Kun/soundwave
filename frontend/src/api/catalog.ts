import { apiFetch } from "./client";
import type { Genre, LandingTrack } from "../types";

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export const catalogApi = {
  getGenres: async (): Promise<Genre[]> => {
    return apiFetch<Genre[]>("/genres");
  },

  getTracks: async (params?: {
    genre?: string;
    search?: string;
    sort?: "newest" | "trending" | "title";
    page?: number;
    size?: number;
  }): Promise<PageResponse<LandingTrack>> => {
    const query = new URLSearchParams();
    if (params?.genre && params.genre !== "all") query.set("genre", params.genre);
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    return apiFetch<PageResponse<LandingTrack>>(`/tracks${qs ? `?${qs}` : ""}`);
  },

  getTrackById: async (idOrSlug: string | number): Promise<LandingTrack> => {
    return apiFetch<LandingTrack>(`/tracks/${idOrSlug}`);
  },

  getRecommendations: async (idOrSlug: string | number, limit = 5): Promise<LandingTrack[]> => {
    return apiFetch<LandingTrack[]>(`/tracks/${idOrSlug}/recommendations?limit=${limit}`);
  },
};
