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

const REJECTION_PRESETS = [
  "Audio clipping or severe distortion detected in master stream.",
  "Incomplete or placeholder metadata (title, artist or artwork).",
  "Unlicensed sample, beat, or suspected copyright infringement.",
  "Audio file corrupted or encoding does not meet platform standards.",
];

type Props = {
  onNavigate: (route: string) => void;
  initialSubmissionId?: number | null;
};

export function ModeratePendingTracks({ onNavigate: _onNavigate, initialSubmissionId }: Props) {
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [queuePage, setQueuePage] = useState<PageResponse<SubmissionQueueItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Request counter to cancel stale async network responses
  const activeRequestIdRef = useRef<number>(0);
  const toastTimerRef = useRef<number | null>(null);

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

  // Rule 4.7: Scroll Lock when confirmation modals are open with proper cleanup
  useEffect(() => {
    const isDialogOpen = Boolean(approvingTarget || rejectingTarget);
    if (!isDialogOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
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

  // Safe toast notifier with timer cleanup
  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadStats = async () => {
    try {
      const data = await moderationApi.getStats();
      setStats(data);
    } catch (err: unknown) {
      console.error("Error loading moderation stats:", err);
    }
  };

  const loadQueue = async (isManualRefresh = false) => {
    const requestId = ++activeRequestIdRef.current;

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

      // Avoid race conditions: only update if this is still the active request
      if (requestId === activeRequestIdRef.current) {
        setQueuePage(data);
      }
    } catch (err: unknown) {
      if (requestId === activeRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load moderation queue.";
        setError(msg);
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [statusFilter, searchQuery, page]);

  // Debounced search input handler
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

  // Quick Approve action
  const handleConfirmApprove = async () => {
    if (!approvingTarget) return;
    const targetId = approvingTarget.id;
    const title = approvingTarget.trackTitle;

    setIsSubmittingApprove(true);
    try {
      await moderationApi.approveSubmission(targetId, approveNote.trim() || undefined);
      showToast(`Track "${title}" has been published to the catalog!`);
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

  // Quick Reject action
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
      showToast(`Track "${title}" has been rejected. Feedback delivered to creator.`);
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
      {/* Toast Notification with aria-live */}
      {toast ? (
        <div
          className={`staff-floating-toast is-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <CheckIcon width={16} height={16} />
          ) : (
            <AlertIcon width={16} height={16} />
          )}
          <span>{toast.message}</span>
        </div>
      ) : null}

      {/* Top Interactive KPI Metric Cards (Semantic Buttons) */}
      <section className="staff-kpi-grid" aria-label="Moderation throughput statistics">
        {/* 1. Pending (FIFO) */}
        <button
          type="button"
          className={`staff-metric-card is-amber ${
            statusFilter === "PENDING" ? "is-selected-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("PENDING");
            setPage(0);
          }}
          aria-pressed={statusFilter === "PENDING"}
          title="Click to view pending submissions awaiting moderation"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-amber">
              <ClockIcon width={18} height={18} />
            </span>
            <span className="staff-metric-tag is-amber">
              <TrendingUpIcon width={12} height={12} />
              FIFO Queue
            </span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.pendingCount : "--"}</span>
            <strong className="staff-metric-title">Pending Review</strong>
            <span className="staff-metric-caption">Awaiting moderator audit in arrival order</span>
          </div>
        </button>

        {/* 2. Approved */}
        <button
          type="button"
          className={`staff-metric-card is-green ${
            statusFilter === "APPROVED" ? "is-selected-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(0);
          }}
          aria-pressed={statusFilter === "APPROVED"}
          title="Click to view approved music tracks"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-green">
              <CheckIcon width={18} height={18} />
            </span>
            <span className="staff-metric-tag is-green">Published</span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.approvedCount : "--"}</span>
            <strong className="staff-metric-title">Approved Tracks</strong>
            <span className="staff-metric-caption">Live and streaming in catalog</span>
          </div>
        </button>

        {/* 3. Rejected */}
        <button
          type="button"
          className={`staff-metric-card is-red ${
            statusFilter === "REJECTED" ? "is-selected-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(0);
          }}
          aria-pressed={statusFilter === "REJECTED"}
          title="Click to view rejected submissions"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-red">
              <AlertIcon width={18} height={18} />
            </span>
            <span className="staff-metric-tag is-red">Actioned</span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.rejectedCount : "--"}</span>
            <strong className="staff-metric-title">Rejected Submissions</strong>
            <span className="staff-metric-caption">Feedback sent back to creators</span>
          </div>
        </button>

        {/* 4. Total Archive */}
        <button
          type="button"
          className={`staff-metric-card is-cyan ${
            statusFilter === "ALL" ? "is-selected-filter" : ""
          }`}
          onClick={() => {
            setStatusFilter("ALL");
            setPage(0);
          }}
          aria-pressed={statusFilter === "ALL"}
          title="Click to view all submission archives"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-cyan">
              <DiscIcon width={18} height={18} />
            </span>
            <span className="staff-metric-tag is-cyan">All Records</span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.totalCount : "--"}</span>
            <strong className="staff-metric-title">Total Processed</strong>
            <span className="staff-metric-caption">Cumulative queue throughput</span>
          </div>
        </button>
      </section>

      {/* Main Review Workspace Panel */}
      <section className="staff-queue-panel">
        {/* Panel Header & Live Controls */}
        <div className="staff-queue-panel-header">
          <div className="staff-queue-title-group">
            <div className="staff-queue-title-row">
              <h2 className="staff-queue-heading">Moderation Queue</h2>
              <span className="staff-active-status-badge">
                <i />
                {statusFilter === "PENDING"
                  ? "Pending Review (FIFO)"
                  : statusFilter === "APPROVED"
                  ? "Approved Catalog"
                  : statusFilter === "REJECTED"
                  ? "Rejected Archive"
                  : "All Submissions"}
              </span>
            </div>
            <p className="staff-queue-subtitle">
              {statusFilter === "PENDING"
                ? "Submissions awaiting moderator review, sorted strictly by submission time."
                : `Viewing ${statusFilter.toLowerCase()} moderation records.`}
            </p>
          </div>

          <div className="staff-queue-header-actions">
            <span className="staff-counter-badge">
              {queuePage ? `${queuePage.totalElements} submissions` : "Loading..."}
            </span>
            <button
              type="button"
              className="staff-btn-refresh"
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              title="Refresh queue"
            >
              <RefreshIcon width={14} height={14} className={refreshing ? "spin-icon" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Segmented Filter Tabs & Instant Search */}
        <div className="staff-filter-toolbar">
          <div className="staff-segmented-tabs" role="tablist" aria-label="Submission status tabs">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "PENDING"}
              className={`staff-segment-btn ${statusFilter === "PENDING" ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(0);
              }}
            >
              <span className="staff-tab-dot is-amber" />
              <span>Pending</span>
              <span className="staff-tab-count">{stats?.pendingCount ?? 0}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "APPROVED"}
              className={`staff-segment-btn ${statusFilter === "APPROVED" ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter("APPROVED");
                setPage(0);
              }}
            >
              <span className="staff-tab-dot is-green" />
              <span>Approved</span>
              <span className="staff-tab-count">{stats?.approvedCount ?? 0}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "REJECTED"}
              className={`staff-segment-btn ${statusFilter === "REJECTED" ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter("REJECTED");
                setPage(0);
              }}
            >
              <span className="staff-tab-dot is-red" />
              <span>Rejected</span>
              <span className="staff-tab-count">{stats?.rejectedCount ?? 0}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "ALL"}
              className={`staff-segment-btn ${statusFilter === "ALL" ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter("ALL");
                setPage(0);
              }}
            >
              <span className="staff-tab-dot is-cyan" />
              <span>All History</span>
              <span className="staff-tab-count">{stats?.totalCount ?? 0}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="staff-search-wrapper">
            <SearchIcon width={16} height={16} className="staff-search-icon" />
            <input
              type="text"
              placeholder="Search by track title, creator, genre or album..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              className="staff-search-input"
              aria-label="Search track submissions"
            />
            {searchInput ? (
              <button
                type="button"
                className="staff-search-clear-btn"
                onClick={() => setSearchInput("")}
                aria-label="Clear search query"
              >
                <CloseIcon width={14} height={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Content: Loading Skeleton / Error / Empty State / Queue Cards */}
        {loading ? (
          <div
            className="staff-skeletons-container"
            aria-busy="true"
            aria-label="Loading submissions from server"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="staff-skeleton-card">
                <div className="staff-skeleton-thumb" />
                <div className="staff-skeleton-meta">
                  <div className="staff-skeleton-bar is-long" />
                  <div className="staff-skeleton-bar is-short" />
                </div>
                <div className="staff-skeleton-pill" />
                <div className="staff-skeleton-btns" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="staff-state-banner is-error" role="alert">
            <AlertIcon width={32} height={32} />
            <b>Failed to load moderation queue</b>
            <p>{error}</p>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={() => void loadQueue()}
            >
              Retry Loading
            </button>
          </div>
        ) : !queuePage || queuePage.content.length === 0 ? (
          <div className="staff-empty-box" role="status" aria-live="polite">
            <div className="staff-empty-circle">
              <CheckIcon width={36} height={36} />
            </div>
            <h3 className="staff-empty-title">
              {searchInput
                ? "No matching submissions found"
                : statusFilter === "PENDING"
                ? "Moderation Queue Is Clear!"
                : "No submissions recorded"}
            </h3>
            <p className="staff-empty-description">
              {searchInput
                ? `No submissions matched "${searchInput}". Try adjusting keywords or clear the filter.`
                : statusFilter === "PENDING"
                ? "All track submissions have been reviewed and processed. Excellent work!"
                : `There are currently no items under the ${statusFilter.toLowerCase()} tab.`}
            </p>
            {searchInput ? (
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => setSearchInput("")}
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={handleManualRefresh}
              >
                Refresh Queue
              </button>
            )}
          </div>
        ) : (
          <div className="staff-track-cards-list">
            {queuePage.content.map((item) => (
              <article
                className={`staff-track-card ${
                  item.status === "PENDING" ? "is-pending-track" : ""
                }`}
                key={item.id}
              >
                {/* Artwork Thumbnail with quick-listen overlay */}
                <div className="staff-thumb-container">
                  <img
                    src={
                      item.coverUrl ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
                    }
                    alt={item.trackTitle}
                    className="staff-thumb-image"
                  />
                  <button
                    type="button"
                    className="staff-thumb-inspect-btn"
                    onClick={() => setSelectedSubmissionId(item.id)}
                    title="Inspect & listen to audio stream"
                    aria-label={`Inspect ${item.trackTitle}`}
                  >
                    <EyeIcon width={17} height={17} />
                  </button>
                </div>

                {/* Core Track & Creator Metadata with accessible button title */}
                <div className="staff-track-meta-section">
                  <div className="staff-track-name-row">
                    <button
                      type="button"
                      className="staff-track-title-btn"
                      onClick={() => setSelectedSubmissionId(item.id)}
                      title={`Inspect ${item.trackTitle}`}
                    >
                      {item.trackTitle}
                    </button>

                    {item.albumTitle ? (
                      <span className="staff-meta-pill is-album" title={`Album: ${item.albumTitle}`}>
                        <DiscIcon width={12} height={12} />
                        <span>{item.albumTitle}</span>
                      </span>
                    ) : (
                      <span className="staff-meta-pill is-single">Single Release</span>
                    )}

                    <span className="staff-meta-pill is-genre">
                      {item.genreName || "Music"}
                    </span>

                    {item.durationMs ? (
                      <span className="staff-meta-pill is-duration">
                        {formatDuration(item.durationMs)}
                      </span>
                    ) : null}
                  </div>

                  <div className="staff-creator-row">
                    <span className="staff-creator-label">
                      <UserIcon width={13} height={13} />
                      <b>{item.submitterDisplayName || "Unknown Creator"}</b>
                    </span>

                    {item.submitterEmail ? (
                      <span className="staff-creator-email">({item.submitterEmail})</span>
                    ) : null}

                    <span className="staff-queue-time-chip">
                      <ClockIcon width={12} height={12} />
                      Wait: {formatRelativeTime(item.submittedAt)} · {formatDate(item.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="staff-track-status-col">
                  <span
                    className={`staff-status-chip ${
                      item.status === "APPROVED"
                        ? "is-approved"
                        : item.status === "REJECTED"
                        ? "is-rejected"
                        : "is-pending"
                    }`}
                  >
                    <i />
                    <span>
                      {item.status === "APPROVED"
                        ? "Approved"
                        : item.status === "REJECTED"
                        ? "Rejected"
                        : "Pending Audit"}
                    </span>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="staff-track-actions-col">
                  <button
                    type="button"
                    className="staff-btn-review"
                    onClick={() => setSelectedSubmissionId(item.id)}
                    title="Open full inspector and audio preview"
                  >
                    <EyeIcon width={15} height={15} />
                    <span>Inspect</span>
                  </button>

                  {item.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        className="staff-btn-quick-approve"
                        onClick={() => {
                          setApprovingTarget(item);
                          setApproveNote("");
                        }}
                        title="Quick approve and publish"
                      >
                        <CheckIcon width={14} height={14} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        className="staff-btn-quick-reject"
                        onClick={() => {
                          setRejectingTarget(item);
                          setRejectionReason("");
                          setRejectNote("");
                        }}
                        title="Quick reject with feedback"
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

        {/* Pagination Controls */}
        {queuePage && queuePage.totalPages > 1 ? (
          <div className="staff-pagination-bar" aria-label="Queue pagination">
            <button
              type="button"
              disabled={queuePage.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="staff-page-btn"
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <span className="staff-page-indicator">
              Page <b>{queuePage.number + 1}</b> of {queuePage.totalPages} ({queuePage.totalElements} submissions)
            </span>
            <button
              type="button"
              disabled={queuePage.last}
              onClick={() => setPage((p) => p + 1)}
              className="staff-page-btn"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        ) : null}
      </section>

      {/* Approve Confirmation Modal */}
      {approvingTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setApprovingTarget(null)}>
          <div
            className="modal-card staff-action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="staff-dialog-header-info">
                <span className="staff-dialog-badge is-green">
                  <CheckIcon width={18} height={18} />
                </span>
                <div>
                  <h2 id="approve-dialog-title" className="staff-dialog-title">
                    Approve Track Publication
                  </h2>
                  <p className="staff-dialog-subtitle">Publishing to SoundWave Music Catalog</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setApprovingTarget(null)}
                aria-label="Close dialog"
                disabled={isSubmittingApprove}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <div className="staff-dialog-body">
              <p className="staff-dialog-prompt">
                You are about to approve <b>“{approvingTarget.trackTitle}”</b> uploaded by{" "}
                <b>{approvingTarget.submitterDisplayName || "the creator"}</b>. This track will be marked as{" "}
                <span className="staff-text-success font-semibold">PUBLISHED</span> and will immediately become playable and streamable across SoundWave.
              </p>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleConfirmApprove();
                }}
              >
                <label className="staff-input-group" htmlFor="approve-reviewer-note">
                  <span className="staff-input-label">Internal Reviewer Note (Optional)</span>
                  <textarea
                    id="approve-reviewer-note"
                    rows={3}
                    placeholder="e.g. Master file validated, clear mix, complete metadata verified..."
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    disabled={isSubmittingApprove}
                    className="staff-textarea"
                  />
                </label>

                <div className="staff-dialog-footer-actions">
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
                    className="button staff-btn-confirm-approve"
                    disabled={isSubmittingApprove}
                  >
                    {isSubmittingApprove ? "Publishing..." : "Confirm & Publish Track"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Confirmation Modal */}
      {rejectingTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setRejectingTarget(null)}>
          <div
            className="modal-card staff-action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="staff-dialog-header-info">
                <span className="staff-dialog-badge is-red">
                  <AlertIcon width={18} height={18} />
                </span>
                <div>
                  <h2 id="reject-dialog-title" className="staff-dialog-title">
                    Reject Track Submission
                  </h2>
                  <p className="staff-dialog-subtitle">Actionable feedback will be emailed to creator</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setRejectingTarget(null)}
                aria-label="Close dialog"
                disabled={isSubmittingReject}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <div className="staff-dialog-body">
              <p className="staff-dialog-prompt">
                You are rejecting <b>“{rejectingTarget.trackTitle}”</b>. Please provide specific, professional feedback so the creator knows what to fix before resubmitting.
              </p>

              {/* Quick Preset Buttons */}
              <div className="staff-preset-chips-section">
                <span className="staff-preset-title">Quick presets:</span>
                <div className="staff-preset-chips">
                  {REJECTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="staff-preset-btn"
                      onClick={() => setRejectionReason(preset)}
                      disabled={isSubmittingReject}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleConfirmReject();
                }}
              >
                <label className="staff-input-group" htmlFor="reject-reason-input">
                  <span className="staff-input-label">
                    Rejection Reason <span className="staff-text-danger">*</span> (Minimum 10 characters)
                  </span>
                  <textarea
                    id="reject-reason-input"
                    rows={3}
                    autoFocus
                    placeholder="Describe the defect (e.g. Clipping distortion, incomplete tags, sample copyright issue)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isSubmittingReject}
                    className="staff-textarea"
                    aria-invalid={
                      rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10
                    }
                    aria-describedby="reject-char-counter"
                  />
                  <div className="staff-counter-row">
                    <span
                      id="reject-char-counter"
                      className={
                        rejectionReason.trim().length >= 10
                          ? "staff-text-success font-medium"
                          : "staff-text-muted"
                      }
                    >
                      {rejectionReason.trim().length} / 10 characters minimum
                    </span>
                  </div>
                </label>

                <label className="staff-input-group" htmlFor="reject-internal-note">
                  <span className="staff-input-label">Internal Moderator Note (Optional)</span>
                  <textarea
                    id="reject-internal-note"
                    rows={2}
                    placeholder="Staff notes for operations record..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    disabled={isSubmittingReject}
                    className="staff-textarea"
                  />
                </label>

                <div className="staff-dialog-footer-actions">
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
                    className="button staff-btn-confirm-reject"
                    disabled={rejectionReason.trim().length < 10 || isSubmittingReject}
                  >
                    {isSubmittingReject ? "Processing..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Full Track Inspector Modal */}
      {selectedSubmissionId ? (
        <PendingTrackDetailModal
          submissionId={selectedSubmissionId}
          onClose={() => setSelectedSubmissionId(null)}
          onApproveSuccess={() => {
            showToast("Track approved successfully!");
            void loadStats();
            void loadQueue();
          }}
          onRejectSuccess={() => {
            showToast("Track submission rejected.");
            void loadStats();
            void loadQueue();
          }}
        />
      ) : null}
    </div>
  );
}
