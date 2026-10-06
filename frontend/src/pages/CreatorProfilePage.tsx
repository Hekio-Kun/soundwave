import { useState } from "react";
import { albums, featuredCreators, tracks } from "../data";
import { HeadphonesIcon, PauseIcon, PlayIcon, UserIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  creatorId: number;
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack, contextQueue?: LandingTrack[], contextTitle?: string) => void;
  onNavigate: (route: string) => void;
};

const formatPlays = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function CreatorProfilePage({ creatorId, currentTrack, playing, onPlayTrack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<"tracks" | "albums">("tracks");
  const creator = featuredCreators.find((c) => c.userId === creatorId) ?? featuredCreators[0];

  const creatorTracks = tracks.filter((t) => t.creator.userId === creator.userId && t.publicationStatus === "APPROVED");
  const creatorAlbums = albums.filter((a) => a.creatorName === creator.displayName);

  return (
    <div className="creator-profile-page">
      {/* Profile Header */}
      <section className="creator-banner-header">
        <img src={creator.avatarUrl} alt="" className="creator-large-avatar" />
        <div className="creator-header-meta">
          <span className="eyebrow">CREATOR PROFILE</span>
          <h1 className="creator-profile-name">{creator.displayName}</h1>
          <p className="creator-profile-bio">{creator.bio}</p>
          <div className="creator-stats-row">
            <span><b>{creatorTracks.length}</b> published tracks</span>
            <span className="meta-dot">·</span>
            <span><b>{creator.followersCount?.toLocaleString() ?? "1,200"}</b> followers</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="creator-tabs-bar">
        <button
          className={`creator-tab ${activeTab === "tracks" ? "creator-tab--active" : ""}`}
          onClick={() => setActiveTab("tracks")}
        >
          Tracks ({creatorTracks.length})
        </button>
        <button
          className={`creator-tab ${activeTab === "albums" ? "creator-tab--active" : ""}`}
          onClick={() => setActiveTab("albums")}
        >
          Album ({creatorAlbums.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "tracks" ? (
        <div className="creator-tracks-list">
          {creatorTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isPlayingThis = isCurrent && playing;

            return (
              <div
                key={track.id}
                className={`table-track-row ${isCurrent ? "table-track-row--active" : ""}`}
              >
                <span className="row-index">{String(idx + 1).padStart(2, "0")}</span>

                <div
                  className="row-thumbnail"
                  onClick={() => onPlayTrack(track, creatorTracks, `Artist • ${creator.displayName}`)}
                >
                  <img src={track.coverUrl ?? undefined} alt="" />
                  <button
                    className="row-hover-play"
                    aria-label={`Play ${track.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track, creatorTracks, `Artist • ${creator.displayName}`);
                    }}
                  >
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
                  <span className="row-album-name">{track.album?.title ?? "Single"}</span>
                </div>

                <span className="row-plays">
                  <HeadphonesIcon width={12} height={12} /> {formatPlays(track.playCount)}
                </span>

                <span className="row-duration">{formatDuration(track.durationMs)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="app-album-grid">
          {creatorAlbums.map((album) => (
            <div
              key={album.id}
              className="album-item-card"
              onClick={() => onNavigate(`/album/${album.id}`)}
            >
              <div className="album-card-art">
                <img src={album.coverUrl} alt={album.title} />
              </div>
              <h3 className="album-card-title">{album.title}</h3>
              <p className="album-card-creator">{album.releaseYear}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
