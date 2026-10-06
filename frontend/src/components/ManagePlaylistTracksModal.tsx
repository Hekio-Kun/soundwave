import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  HeadphonesIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../icons";
import type { LandingTrack, Playlist } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  playlist: Playlist;
  tracks: LandingTrack[];
  onRemoveTrack: (playlistId: number, trackId: number) => Promise<void>;
  onReorderTracks: (playlistId: number, trackId: number, direction: "up" | "down") => Promise<void>;
  onOpenAddTrackModal: () => void;
};

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function ManagePlaylistTracksModal({
  open,
  onClose,
  playlist,
  tracks,
  onRemoveTrack,
  onReorderTracks,
  onOpenAddTrackModal,
}: Props) {
  const [search, setSearch] = useState("");
  const [actionLoadingTrackId, setActionLoadingTrackId] = useState<number | null>(null);

  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.creator.displayName.toLowerCase().includes(q)
    );
  }, [tracks, search]);

  const totalDurationMs = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
  }, [tracks]);

  const handleRemove = async (trackId: number) => {
    setActionLoadingTrackId(trackId);
    try {
      await onRemoveTrack(playlist.id, trackId);
    } catch {
      // error handled in parent
    } finally {
      setActionLoadingTrackId(null);
    }
  };

  const handleReorder = async (trackId: number, direction: "up" | "down") => {
    setActionLoadingTrackId(trackId);
    try {
      await onReorderTracks(playlist.id, trackId, direction);
    } catch {
      // error handled in parent
    } finally {
      setActionLoadingTrackId(null);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1100,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "680px",
          width: "92vw",
          padding: "24px 28px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.22)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          background: "#ffffff",
        }}
      >
        {/* Header with Playlist Identity Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
          {playlist.coverUrl && (
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                objectFit: "cover",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "var(--sw-primary)",
                  background: "var(--sw-cyan-light, #ECFEFF)",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                Playlist
              </span>
              <span style={{ fontSize: "12px", color: "var(--sw-muted)", fontWeight: 500 }}>
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"} • {formatDuration(totalDurationMs)}
              </span>
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                margin: 0,
                color: "var(--sw-text)",
                letterSpacing: "-0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage Tracks in &ldquo;{playlist.title}&rdquo;
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--sw-muted)" }}>
              Reorder track positions or remove songs from this playlist.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#F1F5F9",
              border: "none",
              cursor: "pointer",
              color: "var(--sw-muted)",
              display: "grid",
              placeItems: "center",
              transition: "background .15s, color .15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E2E8F0";
              e.currentTarget.style.color = "var(--sw-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
              e.currentTarget.style.color = "var(--sw-muted)";
            }}
            title="Close"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Toolbar: Sleek Search & Add Track Button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <SearchIcon
              width={16}
              height={16}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--sw-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search tracks in playlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "38px",
                paddingRight: search ? "34px" : "14px",
                height: "40px",
                fontSize: "13px",
                borderRadius: "12px",
                border: "1.5px solid #E2E8F0",
                background: "#F8FAFC",
                color: "var(--sw-text)",
                outline: "none",
                transition: "border-color .18s, box-shadow .18s, background .18s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--sw-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(8, 145, 178, 0.12)";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#F8FAFC";
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "var(--sw-muted)",
                  display: "grid",
                  placeItems: "center",
                }}
                title="Clear search"
              >
                <CloseIcon width={14} height={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddTrackModal();
            }}
            style={{
              height: "40px",
              padding: "0 16px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #0891b2, #0e7490)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(8, 145, 178, 0.28)",
              transition: "transform .18s, box-shadow .18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(8, 145, 178, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(8, 145, 178, 0.28)";
            }}
          >
            <PlusIcon width={16} height={16} />
            <span>Add More Tracks</span>
          </button>
        </div>

        {/* Tracks List Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #EEF2F6",
            borderRadius: "16px",
            background: "#F8FAFC",
            padding: "8px",
            maxHeight: "420px",
          }}
        >
          {tracks.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--sw-cyan-light, #ECFEFF)",
                  color: "var(--sw-primary)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: "12px",
                }}
              >
                <HeadphonesIcon width={28} height={28} />
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "var(--sw-text)" }}>
                No tracks in this playlist yet
              </p>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--sw-muted)", maxWidth: "320px" }}>
                Add songs from the SoundWave catalog to start listening.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddTrackModal();
                }}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--sw-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                <PlusIcon width={15} height={15} />
                <span>Add Tracks Now</span>
              </button>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--sw-muted)", fontSize: "13px" }}>
              No tracks match &ldquo;{search}&rdquo;.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredTracks.map((track, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === filteredTracks.length - 1;
                const isLoading = actionLoadingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 4px rgba(15, 23, 42, 0.02)",
                      transition: "all .18s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.06)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(15, 23, 42, 0.02)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {/* Position Badge */}
                    <span
                      style={{
                        width: "30px",
                        height: "30px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "8px",
                        background: "#F1F5F9",
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#475467",
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      #{String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Thumbnail */}
                    <img
                      src={track.coverUrl || ""}
                      alt={track.title}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        background: "#F1F5F9",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                        flexShrink: 0,
                      }}
                    />

                    {/* Track info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "var(--sw-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {track.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--sw-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "2px",
                        }}
                      >
                        {track.creator?.displayName || "Artist"} • {formatDuration(track.durationMs)}
                      </div>
                    </div>

                    {/* Manage Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={isFirst || isLoading || Boolean(search)}
                        onClick={() => handleReorder(track.id, "up")}
                        title={search ? "Clear search to reorder" : "Move up"}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          background: isFirst || Boolean(search) ? "#F8FAFC" : "#ffffff",
                          color: isFirst || Boolean(search) ? "#94A3B8" : "var(--sw-text)",
                          cursor: isFirst || Boolean(search) ? "not-allowed" : "pointer",
                          display: "grid",
                          placeItems: "center",
                          transition: "all .15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isFirst && !search && !isLoading) {
                            e.currentTarget.style.background = "var(--sw-cyan-light, #ECFEFF)";
                            e.currentTarget.style.borderColor = "var(--sw-primary)";
                            e.currentTarget.style.color = "var(--sw-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isFirst && !search && !isLoading) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#E2E8F0";
                            e.currentTarget.style.color = "var(--sw-text)";
                          }
                        }}
                      >
                        <ArrowUpIcon width={16} height={16} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={isLast || isLoading || Boolean(search)}
                        onClick={() => handleReorder(track.id, "down")}
                        title={search ? "Clear search to reorder" : "Move down"}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          background: isLast || Boolean(search) ? "#F8FAFC" : "#ffffff",
                          color: isLast || Boolean(search) ? "#94A3B8" : "var(--sw-text)",
                          cursor: isLast || Boolean(search) ? "not-allowed" : "pointer",
                          display: "grid",
                          placeItems: "center",
                          transition: "all .15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isLast && !search && !isLoading) {
                            e.currentTarget.style.background = "var(--sw-cyan-light, #ECFEFF)";
                            e.currentTarget.style.borderColor = "var(--sw-primary)";
                            e.currentTarget.style.color = "var(--sw-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLast && !search && !isLoading) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#E2E8F0";
                            e.currentTarget.style.color = "var(--sw-text)";
                          }
                        }}
                      >
                        <ArrowDownIcon width={16} height={16} />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleRemove(track.id)}
                        title="Remove track from playlist"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          height: "32px",
                          padding: "0 12px",
                          borderRadius: "8px",
                          border: "1px solid #FECACA",
                          background: "#FEF2F2",
                          color: "#DC2626",
                          cursor: isLoading ? "wait" : "pointer",
                          fontSize: "12px",
                          fontWeight: 700,
                          transition: "all .18s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.background = "#DC2626";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.borderColor = "#DC2626";
                            e.currentTarget.style.boxShadow = "0 3px 10px rgba(220, 38, 38, 0.25)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.background = "#FEF2F2";
                            e.currentTarget.style.color = "#DC2626";
                            e.currentTarget.style.borderColor = "#FECACA";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        <TrashIcon width={14} height={14} />
                        <span>{isLoading ? "Removing..." : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "6px",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <span style={{ fontSize: "12.5px", color: "var(--sw-muted)" }}>
            Showing <b>{filteredTracks.length}</b> of <b>{tracks.length}</b> tracks
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: "38px",
              padding: "0 24px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              background: "#0F172A",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.16)",
              transition: "background .15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1E293B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0F172A";
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
