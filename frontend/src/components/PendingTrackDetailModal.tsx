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

function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const PRESET_REASONS = [
  "Audio clipping or severe distortion detected in master stream.",
  "Incomplete or placeholder metadata (title, artist or artwork).",
  "Unlicensed sample, beat, or suspected copyright infringement.",
  "Audio file corrupted or encoding does not meet platform standards.",
];

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

  // Audio playback ref and play-promise tracker to prevent race conditions
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  // Action states inside modal
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rule 4.7: Scroll Lock with restoration
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Rule 4.7: Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus close button on mount for accessibility
  useEffect(() => {
    const timer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch track submission detail safely
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
      // Safely pause audio during unmount
      if (audioRef.current) {
        if (playPromiseRef.current) {
          playPromiseRef.current
            .then(() => {
              audioRef.current?.pause();
            })
            .catch(() => {
              // Ignore aborted play promise on cleanup
            });
        } else {
          audioRef.current.pause();
        }
      }
    };
  }, [submissionId]);

  // Safe Play/Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      if (playPromiseRef.current) {
        playPromiseRef.current
          .then(() => {
            audioRef.current?.pause();
            setIsPlaying(false);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err: Error) => {
            if (err.name !== "AbortError") {
              console.error("Audio playback error:", err);
            }
            setIsPlaying(false);
          });
      }
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
      audioRef.current.volume = volume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleApprove = async () => {
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

  const handleReject = async () => {
    if (!detail) return;
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

  const maxSeekTime = duration || (detail?.track.durationMs ? detail.track.durationMs / 1000 : 100);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card staff-inspector-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-track-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header staff-inspector-header">
          <div className="staff-inspector-title-meta">
            <span
              className={`staff-inspector-icon ${
                detail?.status === "APPROVED"
                  ? "is-approved"
                  : detail?.status === "REJECTED"
                  ? "is-rejected"
                  : "is-pending"
              }`}
            >
              <HeadphonesIcon width={20} height={20} />
            </span>
            <div>
              <h2 id="pending-track-dialog-title" className="staff-inspector-heading">
                Track Inspection Studio
              </h2>
              <p className="staff-inspector-subheading">
                Submission #{submissionId} · FIFO Quality Audit
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close inspector dialog"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Loading / Error / Body */}
        {loading ? (
          <div className="staff-inspector-loading" aria-busy="true" aria-live="polite">
            <div className="staff-inspector-spinner" />
            <span>Loading lossless audio stream and metadata...</span>
          </div>
        ) : error ? (
          <div className="staff-inspector-error" role="alert">
            <AlertIcon width={32} height={32} />
            <b>Failed to load submission details</b>
            <p>{error}</p>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : detail ? (
          <div className="staff-inspector-body">
            {/* Top Status & Timestamp Banner */}
            <div className="staff-inspector-status-banner">
              <div className="staff-status-group">
                <span className="staff-status-label">Current Audit Status:</span>
                <span
                  className={`staff-status-chip ${
                    detail.status === "APPROVED"
                      ? "is-approved"
                      : detail.status === "REJECTED"
                      ? "is-rejected"
                      : "is-pending"
                  }`}
                >
                  <i />
                  <span>
                    {detail.status === "APPROVED"
                      ? "Approved & Published"
                      : detail.status === "REJECTED"
                      ? "Rejected"
                      : "Pending Review"}
                  </span>
                </span>
              </div>

              <div className="staff-time-group">
                <ClockIcon width={13} height={13} />
                <span>Submitted: <b>{formatDate(detail.submittedAt)}</b></span>
              </div>
            </div>

            {/* Track Hero Card & Integrated Stream Player */}
            <div className="staff-inspector-hero-card">
              <div className="staff-hero-artwork-wrap">
                <img
                  src={
                    detail.track.coverUrl ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                  }
                  alt={detail.track.title}
                  className="staff-hero-artwork"
                />
              </div>

              <div className="staff-hero-info-col">
                <div className="staff-hero-badge-row">
                  <span className="staff-meta-pill is-genre">
                    {detail.track.genre?.name || "Music"}
                  </span>
                  {detail.track.album ? (
                    <span className="staff-meta-pill is-album">
                      <DiscIcon width={12} height={12} />
                      Album: {detail.track.album.title}
                    </span>
                  ) : (
                    <span className="staff-meta-pill is-single">Single Release</span>
                  )}
                  <span className="staff-meta-pill is-format">
                    {detail.track.audioFormat.toUpperCase()} · {formatDuration(detail.track.durationMs)}
                  </span>
                </div>

                <h3 className="staff-hero-track-title">{detail.track.title}</h3>

                <p className="staff-hero-creator-line">
                  Uploaded by: <b>{detail.submitter?.displayName || detail.submitter?.email}</b>
                  {detail.submitter?.email ? (
                    <span className="staff-creator-email">({detail.submitter.email})</span>
                  ) : null}
                </p>

                {/* Built-in High Quality Audio Player */}
                <div className="staff-audio-studio-player">
                  <audio
                    ref={audioRef}
                    src={detail.track.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    preload="metadata"
                  />

                  <div className="staff-player-controls-row">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className={`staff-player-main-btn ${isPlaying ? "is-playing" : ""}`}
                      title={isPlaying ? "Pause audio stream" : "Play audio stream"}
                      aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
                    >
                      {isPlaying ? (
                        <PauseIcon width={18} height={18} />
                      ) : (
                        <PlayIcon width={18} height={18} />
                      )}
                    </button>

                    {/* Equalizer animation bars while playing */}
                    <div className={`staff-equalizer-bars ${isPlaying ? "is-active" : ""}`}>
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    {/* Timeline Seekbar with full accessibility attributes */}
                    <div className="staff-player-seek-wrap">
                      <div className="staff-player-times">
                        <span className="staff-time-current">{formatSeconds(currentTime)}</span>
                        <span className="staff-time-total">
                          {formatSeconds(
                            duration || (detail.track.durationMs ? detail.track.durationMs / 1000 : 0)
                          )}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={maxSeekTime}
                        value={currentTime}
                        onChange={handleSeek}
                        className="staff-player-slider-bar"
                        aria-label="Seek track position"
                        aria-valuemin={0}
                        aria-valuemax={maxSeekTime}
                        aria-valuenow={currentTime}
                        aria-valuetext={`${formatSeconds(currentTime)} of ${formatSeconds(maxSeekTime)}`}
                      />
                    </div>

                    {/* Volume Slider */}
                    <div className="staff-player-vol-wrap">
                      <VolumeIcon width={16} height={16} />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={handleVolumeChange}
                        className="staff-vol-slider-bar"
                        title="Volume"
                        aria-label="Volume slider"
                        aria-valuemin={0}
                        aria-valuemax={1}
                        aria-valuenow={volume}
                        aria-valuetext={`${Math.round(volume * 100)}%`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitter Note Highlight Box */}
            <div className="staff-note-box">
              <div className="staff-note-header">
                <FileTextIcon width={14} height={14} />
                <span>Creator Note (Submitted by Artist)</span>
              </div>
              <p className="staff-note-content">
                {detail.submitterNote ? (
                  `“${detail.submitterNote}”`
                ) : (
                  <span className="staff-text-muted">
                    No special note attached to this submission.
                  </span>
                )}
              </p>
            </div>

            {/* Technical Specifications Grid */}
            <div className="staff-specs-matrix">
              <div className="staff-matrix-cell">
                <small>Creator / Submitter</small>
                <strong>{detail.submitter?.displayName || "--"}</strong>
              </div>
              <div className="staff-matrix-cell">
                <small>Submitter Email</small>
                <strong>{detail.submitter?.email || "--"}</strong>
              </div>
              <div className="staff-matrix-cell">
                <small>Submitter Username</small>
                <strong>@{detail.submitter?.username || "--"}</strong>
              </div>
              <div className="staff-matrix-cell">
                <small>Catalog Slug</small>
                <code>{detail.track.slug}</code>
              </div>
              <div className="staff-matrix-cell">
                <small>Track Number</small>
                <strong>{detail.track.trackNumber ?? "Single"}</strong>
              </div>
              <div className="staff-matrix-cell">
                <small>Master Audio Format</small>
                <strong>{detail.track.audioFormat.toUpperCase()}</strong>
              </div>
            </div>

            {/* Description if provided */}
            {detail.track.description ? (
              <div className="staff-desc-box">
                <small>Track Description</small>
                <p>{detail.track.description}</p>
              </div>
            ) : null}

            {/* Previous Review History (if actioned) */}
            {detail.status !== "PENDING" ? (
              <div
                className={`staff-decision-summary ${
                  detail.status === "APPROVED" ? "is-approved" : "is-rejected"
                }`}
              >
                <div className="staff-decision-title">
                  {detail.status === "APPROVED" ? (
                    <>
                      <CheckIcon width={16} height={16} />
                      <span>Approved for Streaming</span>
                    </>
                  ) : (
                    <>
                      <AlertIcon width={16} height={16} />
                      <span>Submission Rejected</span>
                    </>
                  )}
                </div>

                {detail.rejectionReason ? (
                  <p className="staff-decision-reason">
                    <b>Reason:</b> {detail.rejectionReason}
                  </p>
                ) : null}

                {detail.reviewerNote ? (
                  <p className="staff-decision-note">
                    <b>Reviewer Note:</b> {detail.reviewerNote}
                  </p>
                ) : null}

                <small className="staff-decision-meta">
                  Reviewed by <b>{detail.reviewer?.displayName || detail.reviewer?.email || "Staff"}</b> on{" "}
                  {formatDate(detail.reviewedAt)}
                </small>
              </div>
            ) : null}

            {/* Moderation Decision Form (for PENDING tracks) */}
            {detail.status === "PENDING" ? (
              <div className="staff-moderation-decision-area">
                {actionType === "APPROVE" ? (
                  <div className="staff-decision-panel is-approve">
                    <h4 className="staff-decision-panel-title text-success">
                      Approve “{detail.track.title}”
                    </h4>
                    <p className="staff-decision-panel-desc">
                      This track will immediately be set to <b>PUBLISHED</b> and become available in the SoundWave catalog. An automated confirmation email will be sent to the creator.
                    </p>

                    <label className="staff-input-group" htmlFor="modal-approve-note">
                      <span className="staff-input-label">Internal Reviewer Note (Optional)</span>
                      <input
                        id="modal-approve-note"
                        type="text"
                        className="staff-text-input"
                        placeholder="e.g. Master file sounds balanced, high dynamic range, ready for release."
                        value={approveNote}
                        onChange={(e) => setApproveNote(e.target.value)}
                        disabled={submittingAction}
                      />
                    </label>

                    {actionError ? (
                      <p className="staff-action-error" role="alert">
                        <AlertIcon width={13} height={13} />
                        <span>{actionError}</span>
                      </p>
                    ) : null}

                    <div className="staff-decision-actions-row">
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => setActionType(null)}
                        disabled={submittingAction}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="button staff-btn-confirm-approve"
                        onClick={() => void handleApprove()}
                        disabled={submittingAction}
                      >
                        {submittingAction ? "Publishing..." : "Confirm & Publish Track"}
                      </button>
                    </div>
                  </div>
                ) : actionType === "REJECT" ? (
                  <div className="staff-decision-panel is-reject">
                    <h4 className="staff-decision-panel-title text-danger">
                      Reject “{detail.track.title}”
                    </h4>
                    <p className="staff-decision-panel-desc">
                      Provide clear, constructive feedback. The creator will receive this note to fix issues and resubmit.
                    </p>

                    {/* Presets */}
                    <div className="staff-preset-chips-section">
                      <span className="staff-preset-title">Quick presets:</span>
                      <div className="staff-preset-chips">
                        {PRESET_REASONS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="staff-preset-btn"
                            onClick={() => setRejectionReason(preset)}
                            disabled={submittingAction}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="staff-input-group" htmlFor="modal-reject-reason">
                      <span className="staff-input-label">
                        Rejection Reason <span className="staff-text-danger">*</span> (Minimum 10 characters)
                      </span>
                      <textarea
                        id="modal-reject-reason"
                        rows={3}
                        className="staff-textarea"
                        placeholder="Explain specifically why the track cannot be published..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        disabled={submittingAction}
                        aria-invalid={
                          rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10
                        }
                        aria-describedby="modal-reject-counter"
                      />
                      <span
                        id="modal-reject-counter"
                        className={
                          rejectionReason.trim().length >= 10
                            ? "staff-text-success font-medium"
                            : "staff-text-muted"
                        }
                      >
                        {rejectionReason.trim().length} / 10 characters minimum
                      </span>
                    </label>

                    <label className="staff-input-group" htmlFor="modal-reject-internal-note">
                      <span className="staff-input-label">Internal Staff Note (Optional)</span>
                      <input
                        id="modal-reject-internal-note"
                        type="text"
                        className="staff-text-input"
                        placeholder="Internal notes for ops team..."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        disabled={submittingAction}
                      />
                    </label>

                    {actionError ? (
                      <p className="staff-action-error" role="alert">
                        <AlertIcon width={13} height={13} />
                        <span>{actionError}</span>
                      </p>
                    ) : null}

                    <div className="staff-decision-actions-row">
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => setActionType(null)}
                        disabled={submittingAction}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="button staff-btn-confirm-reject"
                        onClick={() => void handleReject()}
                        disabled={rejectionReason.trim().length < 10 || submittingAction}
                      >
                        {submittingAction ? "Processing..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="staff-initial-action-buttons">
                    <button
                      type="button"
                      className="button staff-btn-approve-primary"
                      onClick={() => setActionType("APPROVE")}
                    >
                      <CheckIcon width={16} height={16} />
                      <span>Approve & Publish</span>
                    </button>
                    <button
                      type="button"
                      className="button staff-btn-reject-primary"
                      onClick={() => setActionType("REJECT")}
                    >
                      <CloseIcon width={16} height={16} />
                      <span>Reject Submission</span>
                    </button>
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
