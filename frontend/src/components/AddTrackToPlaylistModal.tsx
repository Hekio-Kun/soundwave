import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { tracks } from "../data";
import { CloseIcon, PlusIcon, SearchIcon, CheckIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  playlistTitle: string;
  currentTrackIds: number[];
  onAddTrack: (trackId: number) => void;
  allTracks?: LandingTrack[];
};

export function AddTrackToPlaylistModal({
  open,
  onClose,
  playlistTitle,
  currentTrackIds,
  onAddTrack,
  allTracks,
}: Props) {
  const [search, setSearch] = useState("");

  const availableTracks = allTracks && allTracks.length > 0 ? allTracks : tracks;
  const approvedTracks = useMemo(
    () => availableTracks.filter((t) => t.publicationStatus === "APPROVED" || t.publicationStatus === "PUBLISHED"),
    [availableTracks]
  );

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return approvedTracks;
    return approvedTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.creator.displayName.toLowerCase().includes(q) ||
        (t.album?.title.toLowerCase().includes(q) ?? false)
    );
  }, [approvedTracks, search]);

  // Rule 4.7: Modal background scroll lock
  useModalScrollLock(open);

  // Rule 4.7: Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "100%", padding: "26px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--sw-primary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              PLAYLIST MANAGEMENT
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0", color: "var(--sw-text)" }}>
              Add Tracks to "{playlistTitle}"
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: "36px", height: "36px", border: "none", background: "#f2f4f7", borderRadius: "50%", cursor: "pointer" }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            border: "1px solid var(--sw-border)",
            borderRadius: "12px",
            background: "#F8FAFC",
            marginBottom: "16px",
          }}
        >
          <SearchIcon width={16} height={16} />
          <input
            type="text"
            placeholder="Search songs or artists to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "13px",
            }}
          />
        </div>

        {/* Tracks List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingRight: "4px",
            minHeight: "240px",
          }}
        >
          {filteredTracks.map((t: LandingTrack) => {
            const isAdded = currentTrackIds.includes(t.id);
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: isAdded ? "#F8FAFC" : "#fff",
                  border: "1px solid var(--sw-border)",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <img
                    src={t.coverUrl ?? undefined}
                    alt=""
                    style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--sw-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--sw-muted)" }}>
                      {t.creator.displayName} · {t.album?.title ?? "Single"}
                    </div>
                  </div>
                </div>

                {isAdded ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#059669",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "#ECFDF5",
                    }}
                  >
                    <CheckIcon width={13} height={13} /> Added
                  </span>
                ) : (
                  <button
                    className="button button-secondary"
                    onClick={() => onAddTrack(t.id)}
                    style={{
                      padding: "6px 14px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <PlusIcon width={13} height={13} /> Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--sw-border)",
          }}
        >
          <button
            className="button button-primary"
            onClick={onClose}
            style={{ height: "38px", padding: "0 20px", borderRadius: "10px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
