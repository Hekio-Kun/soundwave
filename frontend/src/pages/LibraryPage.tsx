import { useState } from "react";
import { tracks } from "../data";
import { HeartIcon, PauseIcon, PlayIcon, PlusIcon, TrashIcon } from "../icons";
import type { LandingTrack, Playlist } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  favoriteIds: number[];
  onToggleFavorite: (trackId: number) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: number) => void;
  initialTab?: "favorites" | "playlists";
};

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function LibraryPage({
  currentTrack,
  playing,
  onPlayTrack,
  onNavigate,
  favoriteIds,
  onToggleFavorite,
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  initialTab = "favorites",
}: Props) {
  const [tab, setTab] = useState<"favorites" | "playlists">(initialTab);

  const favoriteTracks = tracks.filter((t) => favoriteIds.includes(t.id));

  return (
    <div className="library-page">
      <div className="page-title-banner">
        <div>
          <span className="eyebrow">PERSONAL COLLECTION</span>
          <h1 className="page-heading">Your Library</h1>
          <p className="page-subtext">Manage your Favorite tracks and Playlists.</p>
        </div>
      </div>

      <div className="library-tabs-bar">
        <div className="library-nav-tabs">
          <button
            className={`library-tab ${tab === "favorites" ? "library-tab--active" : ""}`}
            onClick={() => setTab("favorites")}
          >
            Favorite tracks ({favoriteTracks.length})
          </button>
          <button
            className={`library-tab ${tab === "playlists" ? "library-tab--active" : ""}`}
            onClick={() => setTab("playlists")}
          >
            Playlists ({playlists.length})
          </button>
        </div>

        {tab === "playlists" && (
          <button className="button button-primary button-small" onClick={onCreatePlaylist}>
            <PlusIcon width={16} height={16} />
            <span>Create playlist</span>
          </button>
        )}
      </div>

      {tab === "favorites" ? (
        favoriteTracks.length === 0 ? (
          <div className="state-empty-box">
            <HeartIcon width={48} height={48} />
            <p className="empty-title">No favorite tracks yet</p>
            <p className="empty-desc">Select the heart icon on a track to save it here.</p>
            <button className="button button-primary button-small" onClick={() => onNavigate("/explore")}>
              Explore tracks
            </button>
          </div>
        ) : (
          <div className="library-tracks-table">
            {favoriteTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlayingThis = isCurrent && playing;

              return (
                <div
                  key={track.id}
                  className={`table-track-row ${isCurrent ? "table-track-row--active" : ""}`}
                >
                  <span className="row-index">{String(idx + 1).padStart(2, "0")}</span>

                  <div className="row-thumbnail" onClick={() => onPlayTrack(track)}>
                    <img src={track.coverUrl ?? undefined} alt="" />
                    <button className="row-hover-play" aria-label={`Play ${track.title}`}>
                      {isPlayingThis ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
                    </button>
                  </div>

                  <div className="row-main-info">
                    <a
                      className="row-title"
                      href={`#/track/${track.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/track/${track.id}`);
                      }}
                    >
                      {track.title}
                    </a>
                    <a
                      className="row-creator"
                      href={`#/creator/${track.creator.userId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/creator/${track.creator.userId}`);
                      }}
                    >
                      {track.creator.displayName}
                    </a>
                  </div>

                  <span className="row-album-name">{track.album?.title ?? "Single"}</span>
                  <span className="row-duration">{formatDuration(track.durationMs)}</span>

                  <div className="row-actions">
                    <button
                      className="row-icon-btn row-icon-btn--favorited"
                      onClick={() => onToggleFavorite(track.id)}
                      title="Remove favorite"
                    >
                      <HeartIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="playlists-grid">
          {playlists.map((pl) => (
            <div key={pl.id} className="playlist-card">
              <div className="playlist-art" onClick={() => onNavigate(`/playlist/${pl.id}`)}>
                <img src={pl.coverUrl} alt={pl.title} />
                <span className="playlist-hover-play">
                  <PlayIcon width={20} height={20} />
                </span>
              </div>
              <div className="playlist-info">
                <h3 className="playlist-title">{pl.title}</h3>
                <p className="playlist-meta">
                  {pl.trackCount} tracks · {pl.isPrivate ? "Private" : "Public"}
                </p>
                {pl.description && <p className="playlist-desc">{pl.description}</p>}
              </div>
              <button
                className="playlist-delete-btn"
                onClick={() => onDeletePlaylist(pl.id)}
                title="Delete"
              >
                <TrashIcon width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
