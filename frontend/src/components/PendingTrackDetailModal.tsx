import { useEffect, useRef, useState } from "react";
import {
  moderationApi,
  type SubmissionDetail,
} from "../api/moderation";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  DiscIcon,
  FileTextIcon,
  HeadphonesIcon,
  PauseIcon,
  PlayIcon,
  UserIcon,
  VolumeIcon,
} from "../icons";

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

type Props = {
  submissionId: number;
  onClose: () => void;
  onApproveSuccess?: () => void;
  onRejectSuccess?: () => void;
};

export function PendingTrackDetailModal({
  submissionId,
  onClose,
  onApproveSuccess,
  onRejectSuccess,
}: Props) {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio preview playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  // Quick Action Dialogs inside Detail Modal
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    moderationApi
      .getSubmissionDetail(submissionId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load submission details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [submissionId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Audio play error:", e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirmApprove = async () => {
    if (!detail) return;
    setSubmittingAction(true);
    setActionError(null);
    try {
      await moderationApi.approveSubmission(detail.id, approveNote.trim() || undefined);
      if (audioRef.current) audioRef.current.pause();
      onApproveSuccess?.();
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to approve track.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!detail || !rejectionReason.trim()) return;
    setSubmittingAction(true);
    setActionError(null);
    try {
      await moderationApi.rejectSubmission(
        detail.id,
        rejectionReason.trim(),
        rejectNote.trim() || undefined
      );
      if (audioRef.current) audioRef.current.pause();
      onRejectSuccess?.();
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to reject track.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card mod-detail-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "760px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className="ops-dialog-icon"
              style={{
                background:
                  detail?.status === "APPROVED"
                    ? "#ecfdf3"
                    : detail?.status === "REJECTED"
                    ? "#fef2f2"
                    : "#fffbeb",
                color:
                  detail?.status === "APPROVED"
                    ? "#039855"
                    : detail?.status === "REJECTED"
                    ? "#d92d20"
                    : "#b45309",
              }}
            >
              <HeadphonesIcon />
            </span>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0 }}>
                Pending Track Review
              </h2>
              <small style={{ color: "#64748b", fontSize: "11px" }}>
                Submission #{submissionId} · Prioritized by FIFO Queue
              </small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Loading / Error / Body */}
        {loading ? (
          <div className="mod-loading-state" style={{ padding: "40px 0" }}>
            <div className="mod-spinner" />
            <span>Loading pending track details...</span>
          </div>
        ) : error ? (
          <div className="mod-error-state" style={{ margin: "20px 0" }}>
            <AlertIcon width={28} height={28} />
            <b>Failed to load review details</b>
            <p>{error}</p>
            <button className="button button-ghost button-small" onClick={onClose}>
              Close
            </button>
          </div>
        ) : detail ? (
          <div style={{ padding: "4px 0 16px" }}>
            {/* Status and Timestamp Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "11.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span
                  className={`ops-status ${
                    detail.status === "APPROVED"
                      ? "is-success"
                      : detail.status === "REJECTED"
                      ? "is-danger"
                      : "is-warning"
                  }`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  <i />
                  <b>{detail.status}</b>
                </span>
              </div>
              <div style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                <ClockIcon width={13} height={13} />
                <span>Submitted at: <b>{formatDate(detail.submittedAt)}</b></span>
              </div>
            </div>

            {/* Track Hero Card */}
            <div className="mod-detail-hero">
              <img
                src={
                  detail.track.coverUrl ||
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                }
                alt={detail.track.title}
                className="mod-detail-cover"
              />
              <div className="mod-detail-hero-info" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {detail.track.genre?.name || "General"}
                  </span>
                  {detail.track.album ? (
                    <span
                      style={{
                        background: "#f3e8ff",
                        color: "#7e22ce",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      Album: {detail.track.album.title}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#f1f5f9",
                        color: "#64748b",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                      }}
                    >
                      Single Release
                    </span>
                  )}
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {detail.track.audioFormat.toUpperCase()} · {formatDuration(detail.track.durationMs)}
                  </span>
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>
                  {detail.track.title}
                </h3>
                <p className="mod-detail-artist" style={{ fontSize: "12px", color: "#475569" }}>
                  Uploaded by: <b>{detail.submitter?.displayName || detail.submitter?.email}</b>
                </p>

                {/* Built-in Audio Player Preview */}
                <div
                  style={{
                    marginTop: "12px",
                    background: "#0f172a",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                >
                  <audio
                    ref={audioRef}
                    src={detail.track.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    preload="metadata"
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="button button-primary"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: "#06b6d4",
                      }}
                      title={isPlaying ? "Pause audio" : "Play audio preview"}
                    >
                      {isPlaying ? (
                        <PauseIcon width={16} height={16} />
                      ) : (
                        <PlayIcon width={16} height={16} />
                      )}
                    </button>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        type="range"
                        min={0}
                        max={duration || (detail.track.durationMs ? detail.track.durationMs / 1000 : 100)}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ width: "100%", accentColor: "#06b6d4", cursor: "pointer" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "10px",
                          color: "#94a3b8",
                        }}
                      >
                        <span>{formatSeconds(currentTime)}</span>
                        <span>
                          {formatSeconds(
                            duration || (detail.track.durationMs ? detail.track.durationMs / 1000 : 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <VolumeIcon width={14} height={14} style={{ color: "#94a3b8" }} />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{ width: "50px", accentColor: "#06b6d4", cursor: "pointer" }}
                        title="Volume"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitter Note Highlight Box */}
            <div
              style={{
                marginTop: "16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#15803d",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  marginBottom: "4px",
                }}
              >
                <FileTextIcon width={14} height={14} />
                <span>Submitter Note (from Artist)</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  color: "#14532d",
                  lineHeight: "1.55",
                  fontStyle: "italic",
                }}
              >
                {detail.submitterNote ? (
                  `“${detail.submitterNote}”`
                ) : (
                  <span style={{ color: "#64748b", fontStyle: "normal" }}>
                    No submitter note attached to this track.
                  </span>
                )}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="mod-detail-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="mod-grid-item">
                <small>Submitter Artist</small>
                <strong>{detail.submitter?.displayName || "--"}</strong>
              </div>
              <div className="mod-grid-item">
                <small>Submitter Email</small>
                <strong>{detail.submitter?.email || "--"}</strong>
              </div>
              <div className="mod-grid-item">
                <small>Submitter Username</small>
                <strong>@{detail.submitter?.username || "--"}</strong>
              </div>
              <div className="mod-grid-item">
                <small>Track Slug</small>
                <code>{detail.track.slug}</code>
              </div>
              <div className="mod-grid-item">
                <small>Track Number</small>
                <strong>{detail.track.trackNumber ?? "Single"}</strong>
              </div>
              <div className="mod-grid-item">
                <small>Audio Stream Format</small>
                <strong>{detail.track.audioFormat.toUpperCase()}</strong>
              </div>
            </div>

            {/* Track Description if available */}
            {detail.track.description ? (
              <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>
                  Track Description
                </small>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                  {detail.track.description}
                </p>
              </div>
            ) : null}

            {/* Moderation History if reviewed */}
            {detail.status !== "PENDING" ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: detail.status === "APPROVED" ? "#f0fdf4" : "#fef2f2",
                  border: detail.status === "APPROVED" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    color: detail.status === "APPROVED" ? "#166534" : "#991b1b",
                    marginBottom: "4px",
                  }}
                >
                  Moderation Result · {detail.status}
                </div>
                {detail.rejectionReason ? (
                  <p style={{ margin: "4px 0", fontSize: "12px", color: "#b91c1c" }}>
                    <b>Rejection Reason:</b> {detail.rejectionReason}
                  </p>
                ) : null}
                {detail.reviewerNote ? (
                  <p style={{ margin: "4px 0", fontSize: "12px", color: "#334155" }}>
                    <b>Reviewer Note:</b> {detail.reviewerNote}
                  </p>
                ) : null}
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  Reviewed by <b>{detail.reviewer?.displayName || detail.reviewer?.email || "Staff"}</b> at{" "}
                  {formatDate(detail.reviewedAt)}
                </small>
              </div>
            ) : null}

            {/* Actions for PENDING status */}
            {detail.status === "PENDING" ? (
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                {actionType === "APPROVE" ? (
                  <div
                    style={{
                      background: "#f0fdf4",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "#166534" }}>
                      Approve “{detail.track.title}”
                    </h4>
                    <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: "#15803d" }}>
                      This track will immediately be set to <b>PUBLISHED</b> and visible in the public music catalog. An email notification will be sent to the artist.
                    </p>
                    <div className="form-group" style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#14532d" }}>
                        Reviewer Note (Optional):
                      </label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder="e.g. Master file sounds balanced and ready for publication."
                        value={approveNote}
                        onChange={(e) => setApproveNote(e.target.value)}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                    {actionError ? (
                      <p style={{ color: "#b91c1c", fontSize: "11px", margin: "0 0 8px" }}>
                        {actionError}
                      </p>
                    ) : null}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button button-ghost button-small"
                        onClick={() => setActionType(null)}
                        disabled={submittingAction}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-primary button-small"
                        style={{ background: "#16a34a", borderColor: "#16a34a" }}
                        onClick={handleConfirmApprove}
                        disabled={submittingAction}
                      >
                        {submittingAction ? "Approving..." : "Confirm & Publish Track"}
                      </button>
                    </div>
                  </div>
                ) : actionType === "REJECT" ? (
                  <div
                    style={{
                      background: "#fef2f2",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "#991b1b" }}>
                      Reject “{detail.track.title}”
                    </h4>
                    <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: "#b91c1c" }}>
                      Please provide a clear and constructive reason. The artist will receive this feedback via email and system notification to help them fix the issue.
                    </p>
                    <div className="form-group" style={{ marginBottom: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#7f1d1d" }}>
                        Rejection Reason *
                      </label>
                      <textarea
                        className="text-input"
                        rows={3}
                        placeholder="Specify what needs to be revised (e.g. Audio distortion at 1:45, incomplete lyrics, copyright clearance issue)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ fontSize: "12px", width: "100%", resize: "vertical" }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#7f1d1d" }}>
                        Internal Staff Note (Optional):
                      </label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder="Internal note for staff archive..."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                    {actionError ? (
                      <p style={{ color: "#b91c1c", fontSize: "11px", margin: "0 0 8px" }}>
                        {actionError}
                      </p>
                    ) : null}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button button-ghost button-small"
                        onClick={() => setActionType(null)}
                        disabled={submittingAction}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-primary button-small"
                        style={{ background: "#dc2626", borderColor: "#dc2626" }}
                        onClick={handleConfirmReject}
                        disabled={submittingAction || !rejectionReason.trim()}
                      >
                        {submittingAction ? "Rejecting..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={onClose}
                    >
                      Close
                    </button>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className="button button-small"
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          borderColor: "#fca5a5",
                          fontWeight: 600,
                        }}
                        onClick={() => setActionType("REJECT")}
                      >
                        <CloseIcon width={14} height={14} />
                        Reject Track
                      </button>
                      <button
                        type="button"
                        className="button button-primary button-small"
                        style={{
                          background: "#16a34a",
                          borderColor: "#16a34a",
                          fontWeight: 600,
                        }}
                        onClick={() => setActionType("APPROVE")}
                      >
                        <CheckIcon width={14} height={14} />
                        Approve Track
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
