import { apiFetch } from "./client";

export type AdminGenre = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminGenrePage = {
  content: AdminGenre[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type GenreInput = {
  name: string;
  slug: string;
  description: string;
};

export const adminGenreApi = {
  getGenres: (params: { search?: string; active?: boolean; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.active !== undefined) query.set("active", String(params.active));
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 10));
    query.set("sort", "name,asc");
    return apiFetch<AdminGenrePage>(`/admin/genres?${query.toString()}`);
  },

  createGenre: (input: GenreInput) =>
    apiFetch<AdminGenre>("/admin/genres", { method: "POST", body: input }),

  updateGenre: (id: number, input: GenreInput) =>
    apiFetch<AdminGenre>(`/admin/genres/${id}`, { method: "PUT", body: input }),

  updateGenreStatus: (id: number, active: boolean) =>
    apiFetch<AdminGenre>(`/admin/genres/${id}/status`, {
      method: "PATCH",
      body: { active },
    }),
};
