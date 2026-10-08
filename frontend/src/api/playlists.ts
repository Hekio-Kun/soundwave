import { apiFetch } from "./client";
import type { Playlist } from "../types";

export type PlaylistFormData = {
  title: string;
  description?: string;
  isPrivate?: boolean;
  coverUrl?: string;
};

export const playlistApi = {
  getMyPlaylists: async (): Promise<Playlist[]> => {
    return apiFetch<Playlist[]>("/playlists/me");
  },

  getPublicPlaylists: async (): Promise<Playlist[]> => {
    return apiFetch<Playlist[]>("/playlists?myOnly=false");
  },

  getPlaylistById: async (id: number): Promise<Playlist> => {
    return apiFetch<Playlist>(`/playlists/${id}`);
  },

  uploadCover: async (file: File): Promise<{ coverUrl: string }> => {
    const formData = new FormData();
    formData.append("cover", file);
    return apiFetch<{ coverUrl: string }>("/playlists/upload-cover", {
      method: "POST",
      body: formData,
    });
  },

  createPlaylist: async (data: PlaylistFormData): Promise<Playlist> => {
    return apiFetch<Playlist>("/playlists", {
      method: "POST",
      body: data,
    });
  },

  updatePlaylist: async (id: number, data: PlaylistFormData): Promise<Playlist> => {
    return apiFetch<Playlist>(`/playlists/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  deletePlaylist: async (id: number): Promise<void> => {
    return apiFetch<void>(`/playlists/${id}`, {
      method: "DELETE",
    });
  },

  addTrackToPlaylist: async (playlistId: number, trackId: number): Promise<Playlist> => {
    return apiFetch<Playlist>(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: { trackId },
    });
  },

  removeTrackFromPlaylist: async (playlistId: number, trackId: number): Promise<Playlist> => {
    return apiFetch<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`, {
      method: "DELETE",
    });
  },

  reorderPlaylistTracks: async (
    playlistId: number,
    options: { trackId?: number; direction?: "up" | "down"; trackIds?: number[] }
  ): Promise<Playlist> => {
    return apiFetch<Playlist>(`/playlists/${playlistId}/tracks/reorder`, {
      method: "PUT",
      body: {
        trackId: options.trackId,
        direction: options.direction ? options.direction.toUpperCase() : undefined,
        trackIds: options.trackIds,
      },
    });
  },
};
