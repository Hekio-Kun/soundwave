import { apiFetch } from "./client";
import type { LandingTrack } from "../types";

export const favoriteApi = {
  getFavorites: async (): Promise<LandingTrack[]> => apiFetch<LandingTrack[]>("/favorites"),

  addFavorite: async (trackId: number): Promise<void> => {
    await apiFetch(`/favorites/${trackId}`, { method: "POST" });
  },

  removeFavorite: async (trackId: number): Promise<void> => {
    await apiFetch(`/favorites/${trackId}`, { method: "DELETE" });
  },
};
