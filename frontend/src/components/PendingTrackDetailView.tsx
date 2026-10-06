import { useEffect, useMemo, useRef, useState } from "react";
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
  onBack: () => void;
  onApproveSuccess?: () => void;
  onRejectSuccess?: () => void;
};

export function PendingTrackDetailView({
  submissionId,
  onBack,
  onApproveSuccess,
  onRejectSuccess,
}: Props) {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio playback ref and play-promise tracker to prevent race conditions
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  // Moderation Action states
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Lyrics inspection state
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const handleCopyLyrics = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const lyricLines = useMemo(() => {
    if (!detail?.track.lyrics) return [];
    return detail.track.lyrics.split(/\r?\n/);
  }, [detail?.track.lyrics]);

  const lyricStats = useMemo(() => {
    if (!detail?.track.lyrics) return { lines: 0, words: 0, characters: 0 };
    const raw = detail.track.lyrics.trim();
    const lines = lyricLines.filter((l) => l.trim().length > 0).length;
    const words = raw.split(/\s+/).filter(Boolean).length;
    return { lines, words, characters: raw.length };
  }, [detail?.track.lyrics, lyricLines]);

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
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to reject track.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const maxSeekTime = duration || (detail?.track.durationMs ? detail.track.durationMs / 1000 : 100);

  return (
    <div className="staff-detail-view-container">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="staff-detail-top-nav">
        <button
          type="button"
          onClick={onBack}
          className="staff-detail-back-btn"
          title="Back to queue list"
        >
          <span className="staff-detail-back-arrow" aria-hidden="true">←</span>
          <span>Back to Queue</span>
        </button>

        <div className="staff-detail-breadcrumbs">
          <span className="staff-crumb-muted">Moderation Queue</span>
          <span className="staff-crumb-sep">/</span>
          <span className="staff-crumb-active">Submission Details #{submissionId}</span>
        </div>

        {detail ? (
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
        ) : null}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="staff-inspector-loading" aria-busy="true" aria-live="polite">
          <div className="staff-inspector-spinner" />
          <span>Loading track submission metadata and audio stream...</span>
        </div>
      ) : error ? (
        <div className="staff-inspector-error" role="alert">
          <AlertIcon width={36} height={36} />
          <b>Failed to load submission details</b>
          <p>{error}</p>
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={onBack}
          >
            Back to Queue
          </button>
        </div>
      ) : detail ? (
        <div className="staff-detail-content-body">
          {/* Status & Submission Metadata Banner */}
          <div className="staff-inspector-status-banner">
            <div className="staff-status-group">
              <span className="staff-status-label">Submission Status:</span>
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

          {/* Hero Card & Integrated Stream Player (Spacious Full-Width) */}
          <div className="staff-inspector-hero-card staff-detail-hero-card">
            <div className="staff-hero-artwork-wrap staff-detail-artwork-wrap">
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

              <h2 className="staff-hero-track-title staff-detail-track-title">
                {detail.track.title}
              </h2>

              <p className="staff-hero-creator-line">
                <UserIcon width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Submitted by: <b>{detail.submitter?.displayName || detail.submitter?.email}</b>
                {detail.submitter?.email ? (
                  <span className="staff-creator-email">({detail.submitter.email})</span>
                ) : null}
              </p>

              {/* Built-in High-Fidelity Audio Studio Player */}
              <div className="staff-audio-studio-player staff-detail-audio-player">
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
                    aria-label={isPlaying ? "Pause audio stream" : "Play audio stream"}
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
                      title="Volume slider"
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
              <span>Creator Note</span>
            </div>
            <p className="staff-note-content">
              {detail.submitterNote ? (
                `“${detail.submitterNote}”`
              ) : (
                <span className="staff-text-muted">
                  No creator note attached for this submission.
                </span>
              )}
            </p>
          </div>

          {/* Technical Specifications Grid */}
          <div className="staff-specs-matrix">
            <div className="staff-matrix-cell">
              <small>Artist / Submitter</small>
              <strong>{detail.submitter?.displayName || "--"}</strong>
            </div>
            <div className="staff-matrix-cell">
              <small>Account Email</small>
              <strong>{detail.submitter?.email || "--"}</strong>
            </div>
            <div className="staff-matrix-cell">
              <small>Artist Username</small>
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

          {/* Lyrics Section */}
          <div className="staff-lyrics-card">
            <div className="staff-lyrics-header">
              <div className="staff-lyrics-title-group">
                <span className="staff-lyrics-icon-badge">
                  <FileTextIcon width={17} height={17} />
                </span>
                <h4 className="staff-lyrics-heading">Lyrics</h4>
              </div>

              {detail.track.lyrics ? (
                <div className="staff-lyrics-header-actions">
                  <div className="staff-lyrics-stats-badge">
                    <span><b>{lyricStats.lines}</b> lines</span>
                    <span>·</span>
                    <span><b>{lyricStats.words}</b> words</span>
                  </div>
                  <button
                    type="button"
                    className="staff-lyrics-copy-btn"
                    onClick={() => void handleCopyLyrics(detail.track.lyrics!)}
                    title="Copy lyrics"
                  >
                    {copiedLyrics ? (
                      <>
                        <CheckIcon width={13} height={13} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FileTextIcon width={13} height={13} />
                        <span>Copy Lyrics</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>

            {detail.track.lyrics ? (
              <div className="staff-lyrics-viewer-wrapper">
                <div className="staff-lyrics-lines-container">
                  {lyricLines.map((line, idx) => (
                    <div key={idx} className="staff-lyrics-line-row">
                      <span className="staff-lyrics-line-number" aria-hidden="true">
                        {idx + 1}
                      </span>
                      <span className="staff-lyrics-line-content">
                        {line || "\u00A0"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="staff-lyrics-empty-state">
                <FileTextIcon width={28} height={28} />
                <div className="staff-lyrics-empty-text">
                  <strong>No lyrics provided</strong>
                  <span>The uploader did not attach lyrics for this release.</span>
                </div>
              </div>
            )}
          </div>

          {/* Previous Review History (if already reviewed) */}
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
                    <span>Track approved and published to catalog</span>
                  </>
                ) : (
                  <>
                    <AlertIcon width={16} height={16} />
                    <span>Track submission was rejected</span>
                  </>
                )}
              </div>

              {detail.rejectionReason ? (
                <p className="staff-decision-reason">
                  <b>Rejection Reason:</b> {detail.rejectionReason}
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

          {/* Moderation Decision Form Section (Buttons moved into detail page) */}
          {detail.status === "PENDING" ? (
            <div className="staff-moderation-decision-area staff-detail-decision-area">
              {actionType === "APPROVE" ? (
                <div className="staff-decision-panel is-approve">
                  <h4 className="staff-decision-panel-title text-success">
                    Approve & Publish “{detail.track.title}”
                  </h4>
                  <p className="staff-decision-panel-desc">
                    The track will immediately change to <b>PUBLISHED</b> status and be streamable on SoundWave. An automated email notification will be delivered to the artist.
                  </p>

                  <label className="staff-input-group" htmlFor="detail-approve-note">
                    <span className="staff-input-label">Internal Reviewer Note (Optional)</span>
                    <input
                      id="detail-approve-note"
                      type="text"
                      className="staff-text-input"
                      placeholder="e.g. Master stream balanced, good dynamic range, meets publishing standard..."
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
                      Cancel
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
                    Reject Submission “{detail.track.title}”
                  </h4>
                  <p className="staff-decision-panel-desc">
                    Please provide specific, constructive feedback so the creator understands the defects and can rectify them before resubmitting.
                  </p>

                  {/* Quick Preset Buttons */}
                  <div className="staff-preset-chips-section">
                    <span className="staff-preset-title">Common presets:</span>
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

                  <label className="staff-input-group" htmlFor="detail-reject-reason">
                    <span className="staff-input-label">
                      Rejection Reason <span className="staff-text-danger">*</span> (Min 10 characters)
                    </span>
                    <textarea
                      id="detail-reject-reason"
                      rows={3}
                      className="staff-textarea"
                      placeholder="Provide specific reasons why this submission does not meet publication criteria..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      disabled={submittingAction}
                      aria-invalid={
                        rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10
                      }
                      aria-describedby="detail-reject-counter"
                    />
                    <span
                      id="detail-reject-counter"
                      className={
                        rejectionReason.trim().length >= 10
                          ? "staff-text-success font-medium"
                          : "staff-text-muted"
                      }
                    >
                      {rejectionReason.trim().length} / 10 minimum characters
                    </span>
                  </label>

                  <label className="staff-input-group" htmlFor="detail-reject-internal-note">
                    <span className="staff-input-label">Internal Operations Note (Optional)</span>
                    <input
                      id="detail-reject-internal-note"
                      type="text"
                      className="staff-text-input"
                      placeholder="Internal audit notes for moderation records..."
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
                      Cancel
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
                <div className="staff-detail-action-buttons-card">
                  <div className="staff-detail-action-hint">
                    <HeadphonesIcon width={18} height={18} />
                    <span>Audition and inspection complete? Make a moderation decision below:</span>
                  </div>

                  <div className="staff-initial-action-buttons">
                    <button
                      type="button"
                      className="button staff-btn-approve-primary staff-btn-action-large"
                      onClick={() => setActionType("APPROVE")}
                    >
                      <CheckIcon width={16} height={16} />
                      <span>Approve & Publish</span>
                    </button>
                    <button
                      type="button"
                      className="button staff-btn-reject-primary staff-btn-action-large"
                      onClick={() => setActionType("REJECT")}
                    >
                      <CloseIcon width={16} height={16} />
                      <span>Reject Submission</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
