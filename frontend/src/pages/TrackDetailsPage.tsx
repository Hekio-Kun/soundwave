import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { TrackCard, SectionHeader } from "../components/MusicCards";
import { tracks } from "../data";
import { catalogApi } from "../api/catalog";
import {
  CheckIcon,
  FileTextIcon,
  HeadphonesIcon,
  HeartFillIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  UserIcon,
} from "../icons";
import type { LandingTrack, Playlist } from "../types";

type Props = {
  trackId: number;
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  onToggleFavorite: (trackId: number) => void;
  isFavorited: boolean;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: number, trackId: number) => void;
};

const formatPlays = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function TrackDetailsPage({
  trackId,
  currentTrack,
  playing,
  onPlayTrack,
  onNavigate,
  onToggleFavorite,
  isFavorited,
  playlists,
  onAddToPlaylist,
}: Props) {
  const initialTrack = useMemo(() => tracks.find((item) => item.id === trackId), [trackId]);
  const [track, setTrack] = useState<LandingTrack | null>(initialTrack ?? null);
  const [loading, setLoading] = useState<boolean>(!initialTrack);
  const [error, setError] = useState<string | null>(null);

  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportCategory, setReportCategory] = useState("copyright");
  const [reportDesc, setReportDesc] = useState("");

  // Fetch track from backend API if not in static data or to get fresh updates
  useEffect(() => {
    let isCancelled = false;
    const initial = tracks.find((item) => item.id === trackId);
    if (initial) {
      setTrack(initial);
      setLoading(false);
    } else {
      setTrack(null);
      setLoading(true);
    }
    setError(null);

    catalogApi
      .getTrackById(trackId)
      .then((data) => {
        if (!isCancelled && data) {
          setTrack(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!isCancelled && !initial) {
          setError("Track not found or unavailable.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [trackId]);

  // Rule 4.7: Modal background scroll lock
  useModalScrollLock(Boolean(playlistModalOpen || reportModalOpen));

  // Rule 4.7: Escape key handler
  useEffect(() => {
    if (!playlistModalOpen && !reportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlaylistModalOpen(false);
        setReportModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playlistModalOpen, reportModalOpen]);

  const recommendations = useMemo(() => {
    if (!track) return [];
    const sameCreator = tracks.filter(
      (item) => item.id !== track.id && item.creator?.userId === track.creator?.userId
    );
    const otherTracks = tracks.filter(
      (item) => item.id !== track.id && item.creator?.userId !== track.creator?.userId
    );
    return [...sameCreator, ...otherTracks].slice(0, 5);
  }, [track]);

  const handleReportSubmit = () => {
    if (reportDesc.trim().length < 10) return;
    setReportSubmitted(true);
    window.setTimeout(() => {
      setReportSubmitted(false);
      setReportModalOpen(false);
      setReportDesc("");
    }, 1800);
  };

  if (loading && !track) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--sw-muted)" }}>
        <div
          style={{
            display: "inline-block",
            width: "36px",
            height: "36px",
            border: "3px solid #E2E8F0",
            borderTopColor: "var(--sw-primary)",
            borderRadius: "50%",
            animation: "sw-spin 0.8s linear infinite",
          }}
        />
        <p style={{ marginTop: "14px", fontSize: "14px", fontWeight: 600 }}>Loading track details...</p>
      </div>
    );
  }

  if (!track || error) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--sw-text)" }}>Track not found</h2>
        <p style={{ fontSize: "14px", color: "var(--sw-muted)", marginTop: "8px" }}>
          The track you are looking for does not exist or has been removed.
        </p>
        <button
          className="button button-primary"
          onClick={() => onNavigate("/")}
          style={{ marginTop: "20px" }}
        >
          Back to Explore
        </button>
      </div>
    );
  }

  const isPlayingThis = currentTrack?.id === track.id && playing;

  return (
    <div className="track-page-v2">
      <nav className="track-breadcrumb" aria-label="Breadcrumb">
        <button onClick={() => onNavigate("/")}>Explore</button>
        <span>/</span>
        <button onClick={() => onNavigate(`/creator/${track.creator?.userId}`)}>
          {track.creator?.displayName ?? "Unknown Artist"}
        </button>
        <span>/</span>
        <b>{track.title}</b>
      </nav>

      <section className="track-showcase">
        <div
          className="track-showcase-glow"
          style={{ backgroundImage: `url(${track.coverUrl ?? ""})` }}
          aria-hidden="true"
        />
        <div className="track-showcase-visual">
          <button
            className="track-cover-button"
            onClick={() => onPlayTrack(track)}
            aria-label={isPlayingThis ? `Pause ${track.title}` : `Play ${track.title}`}
          >
            <img src={track.coverUrl ?? undefined} alt={`Cover for ${track.title}`} />
            <span>
              {isPlayingThis ? <PauseIcon width={28} height={28} /> : <PlayIcon width={28} height={28} />}
            </span>
          </button>
        </div>

        <div className="track-showcase-content">
          <div className="track-labels">
            <span>TRACK</span>
            <span>{track.genreSlug ?? "SoundWave"}</span>
            <span className="is-approved">
              <CheckIcon width={12} height={12} /> Verified
            </span>
          </div>
          <h1>{track.title}</h1>
          <p className="track-intro">
            A featured track on SoundWave, ready to stream and enjoy in high fidelity.
          </p>

          <button
            className="track-creator-chip"
            onClick={() => onNavigate(`/creator/${track.creator?.userId}`)}
          >
            <img src={track.creator?.avatarUrl ?? undefined} alt="" />
            <span>
              <small>Uploaded by</small>
              <strong>{track.creator?.displayName ?? "Unknown Artist"}</strong>
            </span>
          </button>

          <div className="track-stat-row">
            <span>
              <HeadphonesIcon width={16} height={16} />
              <b>{formatPlays(track.playCount)}</b>
              <small>plays</small>
            </span>
            <i />
            <span>
              <b>{formatDuration(track.durationMs)}</b>
              <small>duration</small>
            </span>
            <i />
            <span>
              <b>{track.album?.title ?? "Single"}</b>
              <small>release</small>
            </span>
          </div>

          <div className="track-primary-actions">
            <button className="button button-primary button-large" onClick={() => onPlayTrack(track)}>
              {isPlayingThis ? <PauseIcon /> : <PlayIcon />}
              <span>{isPlayingThis ? "Pause" : "Play track"}</span>
            </button>
            <button
              className={`track-round-action ${isFavorited ? "is-favorite" : ""}`}
              onClick={() => onToggleFavorite(track.id)}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorited ? <HeartFillIcon /> : <HeartIcon />}
            </button>
            <button
              className="track-round-action"
              onClick={() => setPlaylistModalOpen(true)}
              aria-label="Add to playlist"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </section>

      <div className="track-content-grid">
        <section className="track-lyrics-panel">
          <header>
            <div>
              <span className="track-section-icon">
                <FileTextIcon width={19} height={19} />
              </span>
              <span>
                <small>LYRICS</small>
                <h2>{track.title}</h2>
              </span>
            </div>
            <span className="official-lyrics-badge">
              <CheckIcon width={13} height={13} /> Official
            </span>
          </header>
          {track.lyrics ? (
            <pre>{track.lyrics}</pre>
          ) : (
            <div className="track-lyrics-empty">
              <FileTextIcon />
              <strong>No lyrics available</strong>
              <span>Lyrics have not been provided for this track yet.</span>
            </div>
          )}
          <footer>Lyrics are displayed in plain text format and checked for compliance.</footer>
        </section>

        <aside className="track-context-column">
          <section className="track-context-card">
            <span className="context-eyebrow">RELEASE INFORMATION</span>
            <dl>
              <div>
                <dt>Album</dt>
                <dd>
                  {track.album ? (
                    <button onClick={() => onNavigate(`/album/${track.album!.id}`)}>
                      {track.album.title}
                    </button>
                  ) : (
                    "Single"
                  )}
                </dd>
              </div>
              <div>
                <dt>Genre</dt>
                <dd className="is-capitalized">{track.genreSlug ?? "Uncategorized"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="context-status">
                    <CheckIcon width={12} height={12} /> Public
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="track-author-card">
            <img src={track.creator?.avatarUrl ?? undefined} alt="" />
            <span className="track-section-icon">
              <UserIcon width={18} height={18} />
            </span>
            <small>CREATOR</small>
            <h3>{track.creator?.displayName ?? "Unknown"}</h3>
            <p>Explore more music and albums from this creator.</p>
            <button onClick={() => onNavigate(`/creator/${track.creator?.userId}`)}>
              View profile
            </button>
          </section>

          <button className="track-report-button" onClick={() => setReportModalOpen(true)}>
            Report track
          </button>
        </aside>
      </div>

      <section className="track-recommendations">
        <SectionHeader
          title="You may also like"
          description="Next tracks recommended for you"
          actionLabel="Explore more"
          onAction={() => onNavigate("/")}
        />
        <div className="sw-track-grid">
          {recommendations.map((item) => (
            <TrackCard
              key={item.id}
              track={item}
              active={currentTrack?.id === item.id}
              playing={currentTrack?.id === item.id && playing}
              onPlay={onPlayTrack}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {playlistModalOpen ? createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setPlaylistModalOpen(false)}>
          <section
            className="track-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="track-dialog-heading">
              <span><PlusIcon /></span>
              <div>
                <small>YOUR LIBRARY</small>
                <h2 id="playlist-dialog-title">Add to playlist</h2>
              </div>
            </div>
            <p>Select a playlist to add “{track.title}”.</p>
            <div className="track-dialog-list">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onAddToPlaylist(playlist.id, track.id);
                    setPlaylistModalOpen(false);
                  }}
                >
                  <img src={playlist.coverUrl} alt="" />
                  <span>
                    <b>{playlist.title}</b>
                    <small>
                      {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"} · {playlist.isPrivate ? "Private" : "Public"}
                    </small>
                  </span>
                  <PlusIcon width={17} height={17} />
                </button>
              ))}
            </div>
            <button className="button button-secondary" onClick={() => setPlaylistModalOpen(false)}>
              Close
            </button>
          </section>
        </div>,
        document.body
      ) : null}

      {reportModalOpen ? createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setReportModalOpen(false)}>
          <section
            className="track-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {reportSubmitted ? (
              <div className="track-dialog-success">
                <span><CheckIcon width={27} height={27} /></span>
                <h2>Report Submitted</h2>
                <p>Our moderation team will review this report shortly.</p>
              </div>
            ) : (
              <>
                <div className="track-dialog-heading">
                  <span>!</span>
                  <div>
                    <small>COMMUNITY SUPPORT</small>
                    <h2 id="report-dialog-title">Report Track</h2>
                  </div>
                </div>
                <p>Track: <b>{track.title}</b> · {track.creator?.displayName}</p>
                <div className="form-group">
                  <label htmlFor="report-category">Reason</label>
                  <select
                    id="report-category"
                    value={reportCategory}
                    onChange={(event) => setReportCategory(event.target.value)}
                  >
                    <option value="copyright">Copyright infringement</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="quality">Poor audio quality</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="report-description">Detailed description</label>
                  <textarea
                    id="report-description"
                    rows={4}
                    value={reportDesc}
                    onChange={(event) => setReportDesc(event.target.value)}
                    placeholder="Provide at least 10 characters to help staff review..."
                  />
                </div>
                <div className="track-dialog-actions">
                  <button className="button button-secondary" onClick={() => setReportModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className="button button-primary"
                    disabled={reportDesc.trim().length < 10}
                    onClick={handleReportSubmit}
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </section>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
