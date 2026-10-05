import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { covers } from "../data";
import { CloseIcon } from "../icons";
import type { Playlist } from "../types";

const PRESET_COVERS = [
  covers.dawn,
  covers.night,
  covers.blue,
  covers.warm,
  covers.green,
  covers.city,
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
];

type Props = {
  open: boolean;
  onClose: () => void;
  playlist?: Playlist | null;
  onSave: (data: {
    title: string;
    description: string;
    isPrivate: boolean;
    coverUrl: string;
  }) => void;
};

export function PlaylistFormModal({ open, onClose, playlist, onSave }: Props) {
  const isEdit = Boolean(playlist);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [customCoverInput, setCustomCoverInput] = useState("");
  const [error, setError] = useState("");

  // Reset or fill form whenever the modal opens or the target playlist changes
  useEffect(() => {
    if (open) {
      if (playlist) {
        setTitle(playlist.title);
        setDescription(playlist.description ?? "");
        setIsPrivate(playlist.isPrivate);
        setCoverUrl(playlist.coverUrl || PRESET_COVERS[0]);
        setCustomCoverInput("");
      } else {
        setTitle("");
        setDescription("");
        setIsPrivate(false);
        setCoverUrl(PRESET_COVERS[0]);
        setCustomCoverInput("");
      }
      setError("");
    }
  }, [open, playlist]);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setCoverUrl(PRESET_COVERS[0]);
    setCustomCoverInput("");
    setError("");
    onClose();
  };

  // Rule 4.7: Modal background scroll lock
  useModalScrollLock(open);

  // Rule 4.7: Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a playlist name.");
      return;
    }
    setError("");
    onSave({
      title: trimmedTitle,
      description: description.trim(),
      isPrivate,
      coverUrl: customCoverInput.trim() || coverUrl,
    });
    handleClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px", width: "100%", padding: "26px" }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
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
              PLAYLIST
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0", color: "var(--sw-text)" }}>
              {isEdit ? "Edit Playlist Details" : "Create New Playlist"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={handleClose}
            aria-label="Close"
            style={{ width: "36px", height: "36px", border: "none", background: "#f2f4f7", borderRadius: "50%", cursor: "pointer" }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "10px",
              color: "#DC2626",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name Field per RDS */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="pl-name" style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>
              Name <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              id="pl-name"
              type="text"
              required
              maxLength={150}
              placeholder="e.g. My Favorite Summer Tracks"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              style={{
                height: "42px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid var(--sw-border)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* Description Field per RDS */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="pl-desc" style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>
              Description <span style={{ fontSize: "11px", color: "var(--sw-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="pl-desc"
              rows={3}
              maxLength={1000}
              placeholder="A sunny blend of upbeat acoustic and indie pop songs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--sw-border)",
                fontSize: "13px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          {/* Visibility Radio Group per RDS page 130 */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>
              Visibility
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  border: !isPrivate ? "2px solid var(--sw-primary)" : "1px solid var(--sw-border)",
                  borderRadius: "12px",
                  background: !isPrivate ? "var(--sw-cyan-light, #ECFEFF)" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>Public</div>
                  <div style={{ fontSize: "11px", color: "var(--sw-muted)", marginTop: "2px" }}>
                    Anyone can view and listen to this playlist
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  border: isPrivate ? "2px solid var(--sw-primary)" : "1px solid var(--sw-border)",
                  borderRadius: "12px",
                  background: isPrivate ? "var(--sw-cyan-light, #ECFEFF)" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>Private</div>
                  <div style={{ fontSize: "11px", color: "var(--sw-muted)", marginTop: "2px" }}>
                    Only you can view this playlist
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Cover Artwork Selection */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--sw-text)" }}>
              Playlist Artwork
            </label>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {PRESET_COVERS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    setCoverUrl(url);
                    setCustomCoverInput("");
                  }}
                  style={{
                    flex: "0 0 54px",
                    height: "54px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: coverUrl === url && !customCoverInput ? "3px solid var(--sw-primary)" : "1px solid var(--sw-border)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <img
                    src={url}
                    alt={`Preset ${i + 1}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = covers.dawn;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
            <input
              type="url"
              placeholder="Or enter image URL (https://...)"
              value={customCoverInput}
              onChange={(e) => setCustomCoverInput(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid var(--sw-border)",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          {/* Modal Actions */}
          <div
            className="modal-actions"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
              paddingTop: "14px",
              borderTop: "1px solid var(--sw-border)",
            }}
          >
            <button
              type="button"
              className="button button-ghost"
              onClick={handleClose}
              style={{ height: "40px", padding: "0 18px", borderRadius: "10px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              style={{ height: "40px", padding: "0 22px", borderRadius: "10px", fontWeight: 700 }}
            >
              {isEdit ? "Save changes" : "Create playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
