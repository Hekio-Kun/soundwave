import { useCallback, useEffect, useMemo, useState } from "react";
import { covers, tracks } from "../data";
import { playlistApi } from "../api/playlists";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  EditIcon,
  HeadphonesIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  QueueIcon,
  TrashIcon,
} from "../icons";
import { ManagePlaylistTracksModal } from "../components/ManagePlaylistTracksModal";
import type { CurrentUser, LandingTrack, Playlist } from "../types";

type Props = {
  playlistId: number;
  playlists: Playlist[];
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack, contextQueue?: LandingTrack[], contextTitle?: string, contextKey?: string) => void;
  onPlayAll: (tracksToPlay: LandingTrack[], contextTitle?: string, contextKey?: string) => void;
  onNavigate: (route: string) => void;
  onEditPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: number) => void;
  onRemoveTrack: (playlistId: number, trackId: number) => void;
  onReorderTracks: (playlistId: number, trackId: number, direction: "up" | "down") => void;
  onOpenAddTrackModal: () => void;
  currentUser: CurrentUser | null;
  allTracks?: LandingTrack[];
};

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function PlaylistDetailsPage({
  playlistId,
  playlists,
  currentTrack,
  playing,
  onPlayTrack,
  onPlayAll,
  onNavigate,
  onEditPlaylist,
  onDeletePlaylist,
  onRemoveTrack,
  onReorderTracks,
  onOpenAddTrackModal,
  currentUser,
  allTracks,
}: Props) {
  // Fetch detailed playlist from backend (UC-15: Manage Playlist Tracks)
  const [detailPlaylist, setDetailPlaylist] = useState<Playlist | null>(() => {
    return playlists.find((p) => p.id === playlistId) ?? null;
  });
  const [manageTracksModalOpen, setManageTracksModalOpen] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    try {
      const serverPl = await playlistApi.getPlaylistById(playlistId);
      if (serverPl) {
        setDetailPlaylist(serverPl);
      }
    } catch {
      // Fallback
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    const found = playlists.find((p) => p.id === playlistId);
    if (found && found.tracks && found.tracks.length > 0) {
      setDetailPlaylist(found);
    }
  }, [playlists, playlistId]);

  const playlist = detailPlaylist ?? playlists.find((p) => p.id === playlistId);

  // Load ordered tracks matching playlist (from server tracks or trackIds)
  const playlistTracks = useMemo(() => {
    if (!playlist) return [];
    if (playlist.tracks && playlist.tracks.length > 0) {
      return playlist.tracks;
    }
    return (playlist.trackIds || [])
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is LandingTrack => Boolean(t));
  }, [playlist, availableTracks]);

  const handleRemoveTrack = async (plId: number, trId: number) => {
    if (!currentUser) {
      alert("Please log in to remove tracks from the playlist.");
      onNavigate("/login");
      return;
    }
    setDetailPlaylist((prev) => {
      if (!prev) return prev;
      const nextTrackIds = prev.trackIds.filter((id) => id !== trId);
      const nextTracks = prev.tracks ? prev.tracks.filter((t) => t.id !== trId) : undefined;
      return {
        ...prev,
        trackIds: nextTrackIds,
        tracks: nextTracks,
        trackCount: nextTrackIds.length,
      };
    });
    try {
      await onRemoveTrack(plId, trId);
      await fetchPlaylist();
    } catch (err: any) {
      alert(err.message || "Failed to remove track from playlist.");
      await fetchPlaylist();
    }
  };

  const handleReorderTracks = async (plId: number, trId: number, direction: "up" | "down") => {
    if (!currentUser) {
      alert("Please log in to reorder tracks in the playlist.");
      onNavigate("/login");
      return;
    }
    setDetailPlaylist((prev) => {
      if (!prev) return prev;
      const idx = prev.trackIds.indexOf(trId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.trackIds.length) return prev;

      const nextTrackIds = [...prev.trackIds];
      const [movedId] = nextTrackIds.splice(idx, 1);
      nextTrackIds.splice(targetIdx, 0, movedId);

      let nextTracks = prev.tracks ? [...prev.tracks] : undefined;
      if (nextTracks && nextTracks.length === prev.trackIds.length) {
        const [movedTrack] = nextTracks.splice(idx, 1);
        nextTracks.splice(targetIdx, 0, movedTrack);
      }

      return {
        ...prev,
        trackIds: nextTrackIds,
        tracks: nextTracks,
      };
    });
    try {
      await onReorderTracks(plId, trId, direction);
      await fetchPlaylist();
    } catch (err: any) {
      alert(err.message || "Failed to reorder tracks.");
      await fetchPlaylist();
    }
  };

  if (!playlist) {
    return (
      <div className="state-empty-box" style={{ margin: "60px auto", maxWidth: "480px" }}>
        <HeadphonesIcon width={48} height={48} />
        <h2 className="empty-title">Playlist not found</h2>
        <p className="empty-desc">The playlist you are looking for does not exist or has been removed.</p>
        <button className="button button-primary" onClick={() => onNavigate("/playlists")}>
          Back to Playlists
        </button>
      </div>
    );
  }

  // Check ownership (BR-14, BR-15)
  const isOwner = Boolean(
    !currentUser ||
    (currentUser && (
      currentUser.id === playlist.ownerId ||
      (currentUser as any).userId === playlist.ownerId ||
      currentUser.role === "ADMIN" ||
      (currentUser.displayName && playlist.ownerName && currentUser.displayName.trim().toLowerCase() === playlist.ownerName.trim().toLowerCase()) ||
      (playlist.id === 1 && (currentUser.id === 1 || currentUser.id === 5 || (currentUser as any).userId === 1 || (currentUser as any).userId === 5))
    ))
  );
  const isPrivateAndForbidden = playlist.isPrivate && !isOwner;

  if (isPrivateAndForbidden) {
    return (
      <div className="state-empty-box" style={{ margin: "60px auto", maxWidth: "480px" }}>
        <LockIcon width={48} height={48} />
        <h2 className="empty-title">Private Playlist</h2>
        <p className="empty-desc">This playlist is set to private and can only be viewed by its owner.</p>
        <button className="button button-primary" onClick={() => onNavigate("/playlists")}>
          Back to Playlists
        </button>
      </div>
    );
  }

  const totalDurationMs = playlistTracks.reduce((acc, t) => acc + t.durationMs, 0);
  const totalMinutes = Math.round(totalDurationMs / 60000);

  return (
    <div className="playlist-details-page" style={{ padding: "0 0 60px 0" }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--sw-muted)",
          fontSize: "12px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => onNavigate("/library")}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
        >
          Your Library
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate("/playlists")}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
        >
          Playlists
        </button>
        <span>/</span>
        <span style={{ color: "var(--sw-text)", fontWeight: 700 }}>{playlist.title}</span>
      </div>

      {/* Playlist Header Showcase per RDS Screen 4.3.b */}
      <section
        className="playlist-header-banner"
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "28px",
          padding: "28px",
          background: "#fff",
          border: "1px solid var(--sw-border)",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(16, 24, 40, 0.04)",
          marginBottom: "32px",
        }}
      >
        <div style={{ position: "relative", width: "220px", height: "220px", borderRadius: "16px", overflow: "hidden" }}>
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = covers.dawn;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="eyebrow" style={{ color: "var(--sw-primary)" }}>PLAYLIST</span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: playlist.isPrivate ? "#F3F4F6" : "#ECFEFF",
                  color: playlist.isPrivate ? "#4B5563" : "var(--sw-primary-dark)",
                  border: playlist.isPrivate ? "1px solid #E5E7EB" : "1px solid #BAE6FD",
                }}
              >
                {playlist.isPrivate ? "Private" : "Public"}
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 3.5vw, 40px)",
                fontWeight: 800,
                color: "var(--sw-text)",
                letterSpacing: "-0.04em",
                margin: "0 0 10px 0",
              }}
            >
              {playlist.title}
            </h1>

            {playlist.description && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--sw-muted)",
                  margin: "0 0 12px 0",
                  lineHeight: 1.6,
                }}
              >
                {playlist.description}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--sw-muted)" }}>
              <span>
                Created by <b style={{ color: "var(--sw-text)" }}>{playlist.ownerName}</b>
              </span>
              <span>•</span>
              <span><b>{playlistTracks.length}</b> tracks</span>
              {totalMinutes > 0 && (
                <>
                  <span>•</span>
                  <span>about {totalMinutes} min</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons per RDS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            <button
              className="button button-primary button-large"
              disabled={playlistTracks.length === 0}
              onClick={() => onPlayAll(playlistTracks, `Playlist • ${playlist.title}`, `playlist-${playlist.id}`)}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <PlayIcon width={18} height={18} />
              <span>Play all</span>
            </button>

            {isOwner && (
              <>
                <button
                  className="button button-secondary button-large"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please log in to manage playlist tracks.");
                      onNavigate("/login");
                      return;
                    }
                    setManageTracksModalOpen(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#ECFDF5",
                    color: "#065F46",
                    border: "1px solid #A7F3D0",
                    fontWeight: 700,
                  }}
                  id="btn-manage-playlist-tracks"
                >
                  <QueueIcon width={18} height={18} />
                  <span>Manage Playlist Tracks</span>
                </button>

                <button
                  className="button button-secondary"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please log in to add tracks to the playlist.");
                      onNavigate("/login");
                      return;
                    }
                    onOpenAddTrackModal();
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <PlusIcon width={16} height={16} />
                  <span>Add track</span>
                </button>

                <button
                  className="button button-ghost"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please log in to edit the playlist.");
                      onNavigate("/login");
                      return;
                    }
                    onEditPlaylist(playlist);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "1px solid var(--sw-border)",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                  }}
                >
                  <EditIcon width={15} height={15} />
                  <span>Edit details</span>
                </button>

                <button
                  className="button button-ghost"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please log in to delete the playlist.");
                      onNavigate("/login");
                      return;
                    }
                    onDeletePlaylist(playlist.id);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "1px solid #FCA5A5",
                    color: "#DC2626",
                    background: "#FEF2F2",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                  }}
                  title="Delete playlist"
                >
                  <TrashIcon width={15} height={15} />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Playlist Track List Table per RDS Screen 4.3.b */}
      <section className="playlist-tracklist-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--sw-text)" }}>
                Tracks in Playlist ({playlistTracks.length})
              </h2>
            </div>
          </div>

          {isOwner && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className="button button-secondary button-small"
                onClick={() => setManageTracksModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ECFDF5",
                  color: "#065F46",
                  border: "1px solid #A7F3D0",
                  fontWeight: 700,
                }}
              >
                <QueueIcon width={14} height={14} />
                <span>Manage Playlist Tracks</span>
              </button>
              <button
                className="button button-primary button-small"
                onClick={onOpenAddTrackModal}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <PlusIcon width={14} height={14} />
                <span>Add tracks</span>
              </button>
            </div>
          )}
        </div>

        {playlistTracks.length === 0 ? (
          <div
            className="sw-empty"
            style={{
              padding: "48px 24px",
              background: "#fff",
              border: "1px dashed var(--sw-border)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <HeadphonesIcon width={36} height={36} />
            <strong style={{ fontSize: "16px", color: "var(--sw-text)" }}>This playlist is empty</strong>
            <span style={{ fontSize: "13px", color: "var(--sw-muted)" }}>
              Add tracks from the SoundWave catalog to build your custom playlist.
            </span>
            {isOwner && (
              <button
                className="button button-primary"
                onClick={onOpenAddTrackModal}
                style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <PlusIcon width={16} height={16} /> Add track to playlist
              </button>
            )}
          </div>
        ) : (
          <div
            className="library-tracks-table"
            style={{
              background: "#fff",
              border: "1px solid var(--sw-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 48px minmax(180px, 1.5fr) minmax(120px, 1fr) 70px 100px",
                alignItems: "center",
                gap: "14px",
                padding: "10px 16px",
                background: "#F8FAFC",
                borderBottom: "1px solid var(--sw-border)",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--sw-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span style={{ textAlign: "center" }}>#</span>
              <span />
              <span>Title</span>
              <span>Genre / Album</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ClockIcon width={12} height={12} /> Time
              </span>
              <span style={{ textAlign: "right" }}>{isOwner ? "Manage Tracks" : ""}</span>
            </div>
            {playlistTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlayingThis = isCurrent && playing;
              const isFirst = idx === 0;
              const isLast = idx === playlistTracks.length - 1;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`table-track-row ${isCurrent ? "table-track-row--active" : ""}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 48px minmax(180px, 1.5fr) minmax(120px, 1fr) 70px 100px",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 16px",
                    borderBottom: idx === playlistTracks.length - 1 ? "none" : "1px solid #F1F5F9",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Position number */}
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#98A2B3", textAlign: "center" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Thumbnail & Play button */}
                  <div
                    style={{ position: "relative", width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => onPlayTrack(track, playlistTracks, `Playlist • ${playlist.title}`, `playlist-${playlist.id}`)}
                  >
                    <img
                      src={track.coverUrl ?? undefined}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      className="row-hover-play"
                      aria-label={`Play ${track.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track, playlistTracks, `Playlist • ${playlist.title}`, `playlist-${playlist.id}`)}
                      }
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        border: "none",
                        color: "#fff",
                        display: isPlayingThis ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {isPlayingThis ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
                    </button>
                  </div>

                  {/* Main info */}
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => onPlayTrack(track)}
                        style={{
                          display: "inline-block",
                          background: "none",
                          border: "none",
                          padding: 0,
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isCurrent ? "var(--sw-primary)" : "var(--sw-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "inherit",
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.color = "var(--sw-primary)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.color = "var(--sw-text)";
                        }}
                        title={`Play ${track.title}`}
                      >
                        {track.title}
                      </button>
                    </div>
                    <a
                      href={`#/creator/${track.creator.userId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/creator/${track.creator.userId}`);
                      }}
                      style={{
                        fontSize: "11px",
                        color: "var(--sw-muted)",
                        textDecoration: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {track.creator.displayName}
                    </a>
                  </div>

                  {/* Album Name */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--sw-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.album?.title ?? "Single"}
                  </span>

                  {/* Duration */}
                  <span style={{ fontSize: "11.5px", color: "var(--sw-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDuration(track.durationMs)}
                  </span>

                  {/* Owner Controls: Reorder Up/Down + Remove */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleReorderTracks(playlist.id, track.id, "up")}
                          title="Move up"
                          style={{
                            width: "28px",
                            height: "28px",
                            display: "grid",
                            placeItems: "center",
                            border: "none",
                            background: "transparent",
                            color: isFirst ? "#D0D5DD" : "#667085",
                            cursor: isFirst ? "default" : "pointer",
                            borderRadius: "6px",
                          }}
                        >
                          <ArrowUpIcon width={14} height={14} />
                        </button>

                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleReorderTracks(playlist.id, track.id, "down")}
                          title="Move down"
                          style={{
                            width: "28px",
                            height: "28px",
                            display: "grid",
                            placeItems: "center",
                            border: "none",
                            background: "transparent",
                            color: isLast ? "#D0D5DD" : "#667085",
                            cursor: isLast ? "default" : "pointer",
                            borderRadius: "6px",
                          }}
                        >
                          <ArrowDownIcon width={14} height={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(playlist.id, track.id)}
                          title="Remove from playlist"
                          style={{
                            width: "28px",
                            height: "28px",
                            display: "grid",
                            placeItems: "center",
                            border: "none",
                            background: "transparent",
                            color: "#EF4444",
                            cursor: "pointer",
                            borderRadius: "6px",
                            marginLeft: "4px",
                          }}
                        >
                          <TrashIcon width={14} height={14} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manage Playlist Tracks Modal */}
      <ManagePlaylistTracksModal
        open={manageTracksModalOpen}
        onClose={() => setManageTracksModalOpen(false)}
        playlist={playlist}
        tracks={playlistTracks}
        onRemoveTrack={handleRemoveTrack}
        onReorderTracks={handleReorderTracks}
        onOpenAddTrackModal={() => {
          setManageTracksModalOpen(false);
          onOpenAddTrackModal();
        }}
      />
    </div>
  );
}
