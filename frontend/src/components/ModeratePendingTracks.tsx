import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  moderationApi,
  type PageResponse,
  type SubmissionQueueItem,
  type SubmissionStats,
} from "../api/moderation";
import { PendingTrackDetailModal } from "./PendingTrackDetailModal";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  DiscIcon,
  EyeIcon,
  RefreshIcon,
  SearchIcon,
  TrendingUpIcon,
  UserIcon,
} from "../icons";

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return "--:--";
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

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "--";
  try {
    const submitted = new Date(isoString).getTime();
    const diffMs = Date.now() - submitted;
    if (diffMs < 0) return "Just now";
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return formatDate(isoString);
  }
}

type Props = {
  onNavigate: (route: string) => void;
  initialSubmissionId?: number | null;
};

export function ModeratePendingTracks({ onNavigate, initialSubmissionId }: Props) {
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [queuePage, setQueuePage] = useState<PageResponse<SubmissionQueueItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Dedicated Pending Track Detail Modal State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(
    initialSubmissionId ?? null
  );

  useEffect(() => {
    if (initialSubmissionId) {
      setSelectedSubmissionId(initialSubmissionId);
    }
  }, [initialSubmissionId]);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  // Approval Modal State
  const [approvingTarget, setApprovingTarget] = useState<SubmissionQueueItem | null>(null);
  const [approveNote, setApproveNote] = useState<string>("");
  const [isSubmittingApprove, setIsSubmittingApprove] = useState<boolean>(false);

  // Rejection Modal State
  const [rejectingTarget, setRejectingTarget] = useState<SubmissionQueueItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [rejectNote, setRejectNote] = useState<string>("");
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  // Rule 4.7: Scroll Lock when confirmation modals are open
  useEffect(() => {
    const isDialogOpen = Boolean(approvingTarget || rejectingTarget);
    if (isDialogOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [approvingTarget, rejectingTarget]);

  // Rule 4.7: Escape Key Listener for confirmation modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (approvingTarget) setApprovingTarget(null);
        if (rejectingTarget) setRejectingTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approvingTarget, rejectingTarget]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadStats = async () => {
    try {
      const data = await moderationApi.getStats();
      setStats(data);
    } catch (err: unknown) {
      console.error("Error loading moderation stats:", err);
    }
  };

  const loadQueue = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await moderationApi.getQueue({
        status: statusFilter,
        search: searchQuery,
        page,
        size: pageSize,
      });
      setQueuePage(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load moderation queue.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleManualRefresh = () => {
    void loadStats();
    void loadQueue(true);
  };

  // Approve action
  const handleConfirmApprove = async () => {
    if (!approvingTarget) return;
    const targetId = approvingTarget.id;
    const title = approvingTarget.trackTitle;

    setIsSubmittingApprove(true);
    try {
      await moderationApi.approveSubmission(targetId, approveNote.trim() || undefined);
      showToast(`Track "${title}" has been successfully approved!`);
      setApprovingTarget(null);
      setApproveNote("");
      void loadStats();
      void loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve track.";
      showToast(msg, "error");
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  // Reject action
  const handleConfirmReject = async () => {
    if (!rejectingTarget) return;
    if (rejectionReason.trim().length < 10) {
      showToast("Rejection reason must be at least 10 characters.", "error");
      return;
    }

    const targetId = rejectingTarget.id;
    const title = rejectingTarget.trackTitle;

    setIsSubmittingReject(true);
    try {
      await moderationApi.rejectSubmission(
        targetId,
        rejectionReason.trim(),
        rejectNote.trim() || undefined
      );
      showToast(`Track "${title}" has been rejected.`);
      setRejectingTarget(null);
      setRejectionReason("");
      setRejectNote("");
      void loadStats();
      void loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject track.";
      showToast(msg, "error");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="mod-track-view">
      {/* Top Statistics KPI Cards (Interactive Filter Triggers) */}
      <section className="ops-metric-grid" aria-label="Moderation statistics">
        <article
          className={`ops-metric ops-metric--amber staff-kpi-card ${
            statusFilter === "PENDING" ? "is-active-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(0);
          }}
          title="Click to view pending submissions"
        >
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <ClockIcon />
            </span>
            <span className="ops-metric-change">
              <TrendingUpIcon width={13} height={13} />
              FIFO Priority
            </span>
          </div>
          <strong>{stats ? stats.pendingCount : "--"}</strong>
          <span className="ops-metric-label">Pending Review</span>
          <small>Prioritized by earliest wait time</small>
        </article>

        <article
          className={`ops-metric ops-metric--green staff-kpi-card ${
            statusFilter === "APPROVED" ? "is-active-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(0);
          }}
          title="Click to view approved tracks"
        >
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <CheckIcon />
            </span>
            <span className="ops-metric-change">
              <CheckIcon width={13} height={13} />
              Approved
            </span>
          </div>
          <strong>{stats ? stats.approvedCount : "--"}</strong>
          <span className="ops-metric-label">Approved Tracks</span>
          <small>Live in public music catalog</small>
        </article>

        <article
          className={`ops-metric ops-metric--red staff-kpi-card ${
            statusFilter === "REJECTED" ? "is-active-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(0);
          }}
          title="Click to view rejected submissions"
        >
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <AlertIcon />
            </span>
            <span className="ops-metric-change">Actioned</span>
          </div>
          <strong>{stats ? stats.rejectedCount : "--"}</strong>
          <span className="ops-metric-label">Rejected Submissions</span>
          <small>Feedback returned to creators</small>
        </article>

        <article
          className={`ops-metric ops-metric--violet staff-kpi-card ${
            statusFilter === "ALL" ? "is-active-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("ALL");
            setPage(0);
          }}
          title="Click to view full archive"
        >
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <DiscIcon />
            </span>
            <span className="ops-metric-change">Full Archive</span>
          </div>
          <strong>{stats ? stats.totalCount : "--"}</strong>
          <span className="ops-metric-label">Total Submissions</span>
          <small>All-time submission history</small>
        </article>
      </section>

      {/* Main Review Queue Workspace Panel */}
      <article className="ops-panel staff-review-panel">
        <div className="staff-panel-header">
          <div className="staff-panel-header-copy">
            <div className="staff-panel-title-wrap">
              <h2>Moderation Queue</h2>
              <span className="staff-status-pill">
                {statusFilter === "PENDING"
                  ? "Pending Review (FIFO)"
                  : statusFilter === "APPROVED"
                  ? "Approved Archive"
                  : statusFilter === "REJECTED"
                  ? "Rejected Archive"
                  : "All Submissions"}
              </span>
            </div>
            <p>
              {statusFilter === "PENDING"
                ? "Submissions awaiting moderator review, sorted strictly by submission time."
                : `Viewing ${statusFilter.toLowerCase()} moderation records.`}
            </p>
          </div>

          <div className="staff-panel-header-actions">
            <span className="staff-count-tag">
              {queuePage ? `${queuePage.totalElements} items` : "Loading..."}
            </span>
            <button
              className="button button-ghost button-small staff-refresh-btn"
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              title="Refresh queue"
              aria-label="Refresh queue"
            >
              <RefreshIcon width={14} height={14} className={refreshing ? "spin-icon" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Segmented Filter Tabs & Search */}
        <div className="mod-toolbar">
          <div className="mod-filter-tabs">
            <button
              className={statusFilter === "PENDING" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(0);
              }}
            >
              Pending ({stats?.pendingCount ?? 0})
            </button>
            <button
              className={statusFilter === "APPROVED" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("APPROVED");
                setPage(0);
              }}
            >
              Approved ({stats?.approvedCount ?? 0})
            </button>
            <button
              className={statusFilter === "REJECTED" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("REJECTED");
                setPage(0);
              }}
            >
              Rejected ({stats?.rejectedCount ?? 0})
            </button>
            <button
              className={statusFilter === "ALL" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("ALL");
                setPage(0);
              }}
            >
              All ({stats?.totalCount ?? 0})
            </button>
          </div>

          <div className="mod-search-box">
            <SearchIcon width={16} height={16} />
            <input
              type="text"
              placeholder="Search by track title, creator or album..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              aria-label="Search submissions"
            />
            {searchInput ? (
              <button
                className="mod-search-clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                <CloseIcon width={14} height={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Content list / Loading skeletons / Empty state */}
        {loading ? (
          <div className="staff-skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="staff-skeleton-row">
                <div className="staff-skeleton-cover" />
                <div className="staff-skeleton-info">
                  <div className="staff-skeleton-line staff-skeleton-line--long" />
                  <div className="staff-skeleton-line staff-skeleton-line--short" />
                </div>
                <div className="staff-skeleton-pill" />
                <div className="staff-skeleton-actions" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mod-error-state">
            <AlertIcon width={32} height={32} />
            <b>Failed to load moderation queue</b>
            <p>{error}</p>
            <button
              className="button button-primary button-small"
              onClick={() => void loadQueue()}
            >
              Retry Loading
            </button>
          </div>
        ) : !queuePage || queuePage.content.length === 0 ? (
          <div className="ops-empty-state staff-empty-state">
            <div className="staff-empty-icon">
              <CheckIcon width={32} height={32} />
            </div>
            <b>No submissions found</b>
            <p>
              {searchInput
                ? `No submissions matched "${searchInput}". Try adjusting your keywords.`
                : statusFilter === "PENDING"
                ? "The queue is completely caught up! No pending tracks require moderation right now."
                : "No track submissions match the selected filter."}
            </p>
            {searchInput ? (
              <button
                className="button button-ghost button-small"
                onClick={() => setSearchInput("")}
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                className="button button-ghost button-small"
                onClick={handleManualRefresh}
              >
                Refresh Queue
              </button>
            )}
          </div>
        ) : (
          <div className="staff-queue-list">
            {queuePage.content.map((item) => (
              <article
                className={`staff-queue-card ${
                  item.status === "PENDING" ? "is-pending-card" : ""
                }`}
                key={item.id}
              >
                {/* Track Thumbnail with inspect overlay */}
                <div className="staff-card-cover-wrap">
                  <img
                    src={
                      item.coverUrl ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                    }
                    alt={item.trackTitle}
                    className="staff-card-cover"
                  />
                  <button
                    type="button"
                    className="staff-cover-play-btn"
                    onClick={() => setSelectedSubmissionId(item.id)}
                    title="Inspect track & audio stream"
                    aria-label={`Inspect ${item.trackTitle}`}
                  >
                    <EyeIcon width={16} height={16} />
                  </button>
                </div>

                {/* Track & Creator Info */}
                <div
                  className="staff-card-details"
                  onClick={() => setSelectedSubmissionId(item.id)}
                  title="Click to view full review modal"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedSubmissionId(item.id);
                    }
                  }}
                >
                  <div className="staff-card-title-line">
                    <strong className="staff-track-title">{item.trackTitle}</strong>
                    {item.albumTitle ? (
                      <span className="mod-badge mod-badge--album" title={`Album: ${item.albumTitle}`}>
                        <DiscIcon width={12} height={12} /> {item.albumTitle}
                      </span>
                    ) : (
                      <span className="mod-badge mod-badge--single">Single</span>
                    )}
                    <span className="mod-badge mod-badge--format">
                      {item.genreName || "Music"}
                    </span>
                    {item.durationMs ? (
                      <span className="staff-duration-pill">
                        {formatDuration(item.durationMs)}
                      </span>
                    ) : null}
                  </div>

                  <div className="staff-card-creator-line">
                    <span className="staff-creator-name">
                      <UserIcon width={12} height={12} />
                      Creator: <b>{item.submitterDisplayName || "Unknown Creator"}</b>
                    </span>
                    {item.submitterEmail ? (
                      <span className="staff-creator-email">({item.submitterEmail})</span>
                    ) : null}
                    <span className="staff-timeline-chip">
                      <ClockIcon width={12} height={12} />
                      Wait time: {formatRelativeTime(item.submittedAt)} ({formatDate(item.submittedAt)})
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="staff-card-status">
                  <span
                    className={`ops-status ${
                      item.status === "APPROVED"
                        ? "is-success"
                        : item.status === "REJECTED"
                        ? "is-danger"
                        : "is-warning"
                    }`}
                  >
                    <i />
                    {item.status === "APPROVED"
                      ? "Approved"
                      : item.status === "REJECTED"
                      ? "Rejected"
                      : "Pending Review"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="staff-card-actions">
                  <button
                    className="button button-ghost button-small staff-action-review"
                    onClick={() => setSelectedSubmissionId(item.id)}
                    title="Inspect full track details & stream audio"
                    aria-label={`Review ${item.trackTitle}`}
                  >
                    <EyeIcon width={15} height={15} />
                    <span>Review</span>
                  </button>

                  {item.status === "PENDING" ? (
                    <>
                      <button
                        className="button button-small staff-action-approve"
                        onClick={() => {
                          setApprovingTarget(item);
                          setApproveNote("");
                        }}
                        title="Quick approve track"
                        aria-label={`Approve ${item.trackTitle}`}
                      >
                        <CheckIcon width={14} height={14} />
                        <span>Approve</span>
                      </button>
                      <button
                        className="button button-small staff-action-reject"
                        onClick={() => {
                          setRejectingTarget(item);
                          setRejectionReason("");
                          setRejectNote("");
                        }}
                        title="Quick reject track"
                        aria-label={`Reject ${item.trackTitle}`}
                      >
                        <CloseIcon width={14} height={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {queuePage && queuePage.totalPages > 1 ? (
          <div className="mod-pagination staff-pagination">
            <button
              disabled={queuePage.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="button button-ghost button-small"
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <span className="staff-pagination-text">
              Page <b>{queuePage.number + 1}</b> of {queuePage.totalPages} ({queuePage.totalElements} results)
            </span>
            <button
              disabled={queuePage.last}
              onClick={() => setPage((p) => p + 1)}
              className="button button-ghost button-small"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        ) : null}
      </article>

      {/* Approve Confirmation Modal */}
      {approvingTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setApprovingTarget(null)}>
          <div
            className="modal-card ops-reject-dialog staff-dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="staff-modal-header-info">
                <span className="ops-dialog-icon is-green">
                  <CheckIcon />
                </span>
                <div>
                  <h2 id="approve-dialog-title" className="staff-modal-title">Confirm Track Approval</h2>
                  <p className="staff-modal-subtitle">
                    Publication to SoundWave catalog
                  </p>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setApprovingTarget(null)}
                aria-label="Close dialog"
                disabled={isSubmittingApprove}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <p className="dialog-description">
              You are approving the submission for <b>“{approvingTarget.trackTitle}”</b> uploaded by{" "}
              <b>{approvingTarget.submitterDisplayName || "the creator"}</b>. The track status will be updated to
              <b> PUBLISHED</b> and available for streaming.
            </p>

            <form noValidate onSubmit={(e) => { e.preventDefault(); void handleConfirmApprove(); }}>
              <label className="ops-reason-field" htmlFor="approve-reviewer-note">
                <span>Reviewer Note (Optional)</span>
                <textarea
                  id="approve-reviewer-note"
                  rows={3}
                  placeholder="e.g. Master file validated, clear mix, metadata verified..."
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  disabled={isSubmittingApprove}
                />
              </label>

              <div className="staff-dialog-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setApprovingTarget(null)}
                  disabled={isSubmittingApprove}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary staff-action-approve"
                  disabled={isSubmittingApprove}
                >
                  {isSubmittingApprove ? "Processing..." : "Confirm & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Reject Confirmation Modal */}
      {rejectingTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setRejectingTarget(null)}>
          <div
            className="modal-card ops-reject-dialog staff-dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="staff-modal-header-info">
                <span className="ops-dialog-icon is-red">
                  <AlertIcon />
                </span>
                <div>
                  <h2 id="reject-dialog-title" className="staff-modal-title">Reject Track Submission</h2>
                  <p className="staff-modal-subtitle">
                    Actionable feedback sent to creator
                  </p>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setRejectingTarget(null)}
                aria-label="Close dialog"
                disabled={isSubmittingReject}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <p className="dialog-description">
              You are rejecting the submission for <b>“{rejectingTarget.trackTitle}”</b>. The creator will
              receive your feedback so they can fix audio or metadata issues and re-submit.
            </p>

            <form noValidate onSubmit={(e) => { e.preventDefault(); void handleConfirmReject(); }}>
              <label className="ops-reason-field" htmlFor="reject-reason-input">
                <span>
                  Rejection Reason <strong className="text-danger">*</strong> (Minimum 10 characters)
                </span>
                <textarea
                  id="reject-reason-input"
                  rows={3}
                  autoFocus
                  placeholder="Explain the specific issue (e.g. Clipping distortion in master audio, incomplete metadata, unlicensed sample)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isSubmittingReject}
                  aria-invalid={rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10}
                  aria-describedby="reject-char-counter"
                />
                <small
                  id="reject-char-counter"
                  className={rejectionReason.trim().length >= 10 ? "text-success" : "text-muted"}
                >
                  Entered: {rejectionReason.trim().length} / 10 characters minimum
                </small>
              </label>

              <label className="ops-reason-field" htmlFor="reject-internal-note">
                <span>Internal Staff Note (Optional)</span>
                <textarea
                  id="reject-internal-note"
                  rows={2}
                  placeholder="Internal notes for operations record..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  disabled={isSubmittingReject}
                />
              </label>

              <div className="staff-dialog-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setRejectingTarget(null)}
                  disabled={isSubmittingReject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button ops-danger-button"
                  disabled={rejectionReason.trim().length < 10 || isSubmittingReject}
                >
                  {isSubmittingReject ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Dedicated Pending Track Review Detail Modal */}
      {selectedSubmissionId ? (
        <PendingTrackDetailModal
          submissionId={selectedSubmissionId}
          onClose={() => setSelectedSubmissionId(null)}
          onApproveSuccess={() => {
            showToast("Track approved and published successfully!", "success");
            void loadStats();
            void loadQueue();
          }}
          onRejectSuccess={() => {
            showToast("Track rejected and feedback sent to creator.", "success");
            void loadStats();
            void loadQueue();
          }}
        />
      ) : null}

      {/* Toast Feedback */}
      {toast ? (
        <div
          className={`ops-toast ${toast.type === "error" ? "ops-toast--error" : ""}`}
          role="status"
        >
          {toast.type === "error" ? <AlertIcon width={17} height={17} /> : <CheckIcon width={17} height={17} />}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
