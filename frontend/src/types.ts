export type LandingTrack = {
  id: number;
  title: string;
  coverUrl: string | null;
  audioUrl: string;
  durationMs: number;
  playCount: number;
  slug?: string;
  publicationStatus?: "APPROVED" | "PUBLISHED" | string;
  genreSlug?: string;
  genreName?: string;
  description?: string;
  createdAt?: string;
  lyrics?: string;
  creator: {
    userId: number;
    displayName: string;
    avatarUrl: string | null;
  };
  album?: {
    id: number;
    title: string;
  };
};

export type FeaturedAlbum = {
  id: number;
  title: string;
  coverUrl: string;
  creatorName: string;
  releaseYear: number;
  tracksCount?: number;
  description?: string;
};

export type FeaturedCreator = {
  userId: number;
  displayName: string;
  avatarUrl: string;
  bio: string;
  publishedTracks: number;
  followersCount?: number;
};

export type Genre = {
  id: number;
  name: string;
  slug: string;
  color: string;
  accent: string;
  description?: string;
};

export type Playlist = {
  id: number;
  title: string;
  description?: string;
  coverUrl: string;
  trackCount: number;
  isPrivate: boolean;
  ownerId: number;
  ownerName: string;
  creatorName?: string;
  createdAt?: string;
  trackIds: number[];
  tracks?: LandingTrack[];
};

export type StudioTrack = {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  coverUrl: string | null;
  audioUrl: string;
  durationMs: number;
  genreId?: number;
  genreSlug: string;
  genreName: string;
  albumId?: number;
  albumTitle?: string;
  trackNumber?: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "TAKEN_DOWN";
  latestRejectionReason?: string;
  reviewerNote?: string;
  createdAt: string;
  updatedAt?: string;
  lyrics?: string;
};

export type CurrentUser = {
  id: number;
  userId?: number;
  email: string;
  username?: string;
  displayName: string;
  avatarUrl: string | null;
  role: "LISTENER" | "STAFF" | "ADMIN";
  bio?: string;
  dateOfBirth?: string;
  countryCode?: string;
};

