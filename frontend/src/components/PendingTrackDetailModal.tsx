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

  // Rule 4.7: Scroll Lock when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Rule 4.7: Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    if (rejectionReason.trim().length < 10) {
      setActionError("Rejection reason must be at least 10 characters.");
      return;
    }
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
        className="modal-card mod-detail-modal staff-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-track-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="staff-modal-header-info">
            <span
              className={`ops-dialog-icon ${
                detail?.status === "APPROVED"
                  ? "is-green"
                  : detail?.status === "REJECTED"
                  ? "is-red"
                  : "is-amber"
              }`}
            >
              <HeadphonesIcon />
            </span>
            <div>
              <h2 id="pending-track-dialog-title" className="staff-modal-title">
                Pending Track Review
              </h2>
              <p className="staff-modal-subtitle">
                Submission #{submissionId} · FIFO Queue Priority
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Loading / Error / Body */}
        {loading ? (
          <div className="mod-loading-state">
            <div className="mod-spinner" />
            <span>Loading track audio stream and submission metadata...</span>
          </div>
        ) : error ? (
          <div className="mod-error-state">
            <AlertIcon width={32} height={32} />
            <b>Failed to load submission details</b>
            <p>{error}</p>
            <button className="button button-ghost button-small" onClick={onClose}>
              Close
            </button>
          </div>
        ) : detail ? (
          <div className="staff-modal-body">
            {/* Status and Timestamp Bar */}
            <div className="staff-modal-statusbar">
              <div className="staff-modal-statusbar-status">
                <span className="text-muted">Status:</span>
                <span
                  className={`ops-status ${
                    detail.status === "APPROVED"
                      ? "is-success"
                      : detail.status === "REJECTED"
                      ? "is-danger"
                      : "is-warning"
                  }`}
                >
                  <i />
                  <b>{detail.status}</b>
                </span>
              </div>
              <div className="staff-modal-statusbar-time">
                <ClockIcon width={14} height={14} />
                <span>Submitted: <b>{formatDate(detail.submittedAt)}</b></span>
              </div>
            </div>

            {/* Track Hero Card */}
            <div className="staff-modal-hero">
              <img
                src={
                  detail.track.coverUrl ||
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                }
                alt={detail.track.title}
                className="staff-modal-cover"
              />
              <div className="staff-modal-hero-info">
                <div className="staff-badge-group">
                  <span className="mod-badge mod-badge--format">
                    {detail.track.genre?.name || "Music"}
                  </span>
                  {detail.track.album ? (
                    <span className="mod-badge mod-badge--album">
                      <DiscIcon width={12} height={12} /> Album: {detail.track.album.title}
                    </span>
                  ) : (
                    <span className="mod-badge mod-badge--single">Single Release</span>
                  )}
                  <span className="staff-duration-pill">
                    {detail.track.audioFormat.toUpperCase()} · {formatDuration(detail.track.durationMs)}
                  </span>
                </div>

                <h3 className="staff-modal-track-name">
                  {detail.track.title}
                </h3>
                <p className="staff-modal-creator-tag">
                  Uploaded by: <b>{detail.submitter?.displayName || detail.submitter?.email}</b>
                </p>

                {/* Sleek Light-Themed Audio Preview Player */}
                <div className="staff-player-container">
                  <audio
                    ref={audioRef}
                    src={detail.track.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    preload="metadata"
                  />
                  <div className="staff-player-row">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="staff-player-play-btn"
                      title={isPlaying ? "Pause audio preview" : "Play audio preview"}
                      aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
                    >
                      {isPlaying ? (
                        <PauseIcon width={17} height={17} />
                      ) : (
                        <PlayIcon width={17} height={17} />
                      )}
                    </button>

                    <div className="staff-player-timeline">
                      <input
                        type="range"
                        min={0}
                        max={duration || (detail.track.durationMs ? detail.track.durationMs / 1000 : 100)}
                        value={currentTime}
                        onChange={handleSeek}
                        className="staff-player-slider"
                        aria-label="Track progress slider"
                      />
                      <div className="staff-player-timestamps">
                        <span>{formatSeconds(currentTime)}</span>
                        <span>
                          {formatSeconds(
                            duration || (detail.track.durationMs ? detail.track.durationMs / 1000 : 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="staff-player-volume">
                      <VolumeIcon width={15} height={15} />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={handleVolumeChange}
                        className="staff-player-vol-slider"
                        title="Volume"
                        aria-label="Volume slider"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitter Note Highlight Box */}
            <div className="staff-note-callout">
              <div className="staff-note-callout-header">
                <FileTextIcon width={14} height={14} />
                <span>Submitter Note (from Creator)</span>
              </div>
              <p className="staff-note-callout-text">
                {detail.submitterNote ? (
                  `“${detail.submitterNote}”`
                ) : (
                  <span className="text-muted">
                    No submitter note attached to this submission.
                  </span>
                )}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="staff-specs-grid">
              <div className="staff-spec-item">
                <small>Creator / Submitter</small>
                <strong>{detail.submitter?.displayName || "--"}</strong>
              </div>
              <div className="staff-spec-item">
                <small>Submitter Email</small>
                <strong>{detail.submitter?.email || "--"}</strong>
              </div>
              <div className="staff-spec-item">
                <small>Submitter Handle</small>
                <strong>@{detail.submitter?.username || "--"}</strong>
              </div>
              <div className="staff-spec-item">
                <small>Track Slug</small>
                <code>{detail.track.slug}</code>
              </div>
              <div className="staff-spec-item">
                <small>Track Number</small>
                <strong>{detail.track.trackNumber ?? "Single"}</strong>
              </div>
              <div className="staff-spec-item">
                <small>Audio Stream Format</small>
                <strong>{detail.track.audioFormat.toUpperCase()}</strong>
              </div>
            </div>

            {/* Track Description if available */}
            {detail.track.description ? (
              <div className="staff-track-desc-box">
                <small>Track Description</small>
                <p>{detail.track.description}</p>
              </div>
            ) : null}

            {/* Moderation History if reviewed */}
            {detail.status !== "PENDING" ? (
              <div
                className={`staff-audit-result-box ${
                  detail.status === "APPROVED"
                    ? "staff-audit-result-box--approved"
                    : "staff-audit-result-box--rejected"
                }`}
              >
                <div className="staff-audit-title">
                  Moderation Result · {detail.status}
                </div>
                {detail.rejectionReason ? (
                  <p className="error-text">
                    <b>Rejection Reason:</b> {detail.rejectionReason}
                  </p>
                ) : null}
                {detail.reviewerNote ? (
                  <p>
                    <b>Reviewer Note:</b> {detail.reviewerNote}
                  </p>
                ) : null}
                <small className="text-muted">
                  Reviewed by <b>{detail.reviewer?.displayName || detail.reviewer?.email || "Staff"}</b> at{" "}
                  {formatDate(detail.reviewedAt)}
                </small>
              </div>
            ) : null}

            {/* Actions for PENDING status */}
            {detail.status === "PENDING" ? (
              <div className="staff-modal-action-footer">
                {actionType === "APPROVE" ? (
                  <div className="staff-inline-action-panel staff-inline-action-panel--approve">
                    <h4 className="title-green">
                      Approve “{detail.track.title}”
                    </h4>
                    <p className="copy-green">
                      This track will immediately be set to <b>PUBLISHED</b> and visible in the public music catalog. An email notification will be sent to the creator.
                    </p>
                    <div className="form-group">
                      <label className="label-green" htmlFor="modal-approve-note">
                        Reviewer Note (Optional):
                      </label>
                      <input
                        id="modal-approve-note"
                        type="text"
                        className="text-input"
                        placeholder="e.g. Master file sounds balanced, high dynamic range, ready for release."
                        value={approveNote}
                        onChange={(e) => setApproveNote(e.target.value)}
                      />
                    </div>
                    {actionError ? (
                      <p className="auth-v2-field-error">
                        <AlertIcon width={12} height={12} />
                        {actionError}
                      </p>
                    ) : null}
                    <div className="staff-dialog-actions">
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
                        className="button button-primary button-small staff-action-approve"
                        onClick={handleConfirmApprove}
                        disabled={submittingAction}
                      >
                        {submittingAction ? "Approving..." : "Confirm & Publish Track"}
                      </button>
                    </div>
                  </div>
                ) : actionType === "REJECT" ? (
                  <div className="staff-inline-action-panel staff-inline-action-panel--reject">
                    <h4 className="title-red">
                      Reject “{detail.track.title}”
                    </h4>
                    <p className="copy-red">
                      Please provide a clear and constructive reason. The creator will receive this feedback via email and system notification so they can revise and re-submit.
                    </p>
                    <div className="form-group">
                      <label className="label-red" htmlFor="modal-reject-reason">
                        Rejection Reason * (Minimum 10 characters)
                      </label>
                      <textarea
                        id="modal-reject-reason"
                        className="text-input"
                        rows={3}
                        placeholder="Specify what needs to be revised (e.g. Clipping distortion in master audio, incomplete metadata, unlicensed sample)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        aria-invalid={rejectionReason.trim().length < 10}
                      />
                      <small className={rejectionReason.trim().length >= 10 ? "text-success" : "text-muted"}>
                        Entered: {rejectionReason.trim().length} / 10 characters minimum
                      </small>
                    </div>
                    <div className="form-group">
                      <label className="label-red" htmlFor="modal-reject-note">
                        Internal Staff Note (Optional):
                      </label>
                      <input
                        id="modal-reject-note"
                        type="text"
                        className="text-input"
                        placeholder="Internal note for moderation archive..."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                      />
                    </div>
                    {actionError ? (
                      <p className="auth-v2-field-error">
                        <AlertIcon width={12} height={12} />
                        {actionError}
                      </p>
                    ) : null}
                    <div className="staff-dialog-actions">
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
                        className="button button-primary button-small staff-action-reject"
                        onClick={handleConfirmReject}
                        disabled={submittingAction || rejectionReason.trim().length < 10}
                      >
                        {submittingAction ? "Rejecting..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="staff-modal-action-bar">
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={onClose}
                    >
                      Close
                    </button>
                    <div className="staff-modal-decision-btns">
                      <button
                        type="button"
                        className="button button-small staff-action-reject"
                        onClick={() => setActionType("REJECT")}
                      >
                        <CloseIcon width={14} height={14} />
                        Reject Track
                      </button>
                      <button
                        type="button"
                        className="button button-primary button-small staff-action-approve"
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
