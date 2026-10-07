import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  moderationApi,
  type PageResponse,
  type SubmissionQueueItem,
  type SubmissionStats,
} from "../api/moderation";
import { PendingTrackDetailView } from "./PendingTrackDetailView";
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
  onSelectionChange?: (id: number | null) => void;
};

export function ModeratePendingTracks({
  onNavigate,
  initialSubmissionId,
  onSelectionChange,
}: Props) {
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [queuePage, setQueuePage] = useState<PageResponse<SubmissionQueueItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Request counter to cancel stale async network responses
  const activeRequestIdRef = useRef<number>(0);
  const toastTimerRef = useRef<number | null>(null);

  // Dedicated Pending Track Detail View State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(
    initialSubmissionId ?? null
  );

  useEffect(() => {
    setSelectedSubmissionId(initialSubmissionId ?? null);
  }, [initialSubmissionId]);

  const handleSelectSubmission = (id: number | null) => {
    setSelectedSubmissionId(id);
    onSelectionChange?.(id);
    if (id) {
      onNavigate(`/staff/submissions/${id}`);
    } else {
      onNavigate("/staff/dashboard");
    }
  };

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

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

  // Render Dedicated Detail View if a submission is selected
  if (selectedSubmissionId) {
    return (
      <div className="mod-track-view">
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

        <PendingTrackDetailView
          submissionId={selectedSubmissionId}
          onBack={() => handleSelectSubmission(null)}
          onApproveSuccess={() => {
            showToast("Track approved and published successfully!");
            handleSelectSubmission(null);
            void loadStats();
            void loadQueue();
          }}
          onRejectSuccess={() => {
            showToast("Track submission rejected.");
            handleSelectSubmission(null);
            void loadStats();
            void loadQueue();
          }}
        />
      </div>
    );
  }

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
        {/* 1. Pending */}
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
          title="Filter: Pending review"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-amber">
              <ClockIcon width={18} height={18} />
            </span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.pendingCount : "--"}</span>
            <strong className="staff-metric-title">Pending</strong>
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
          title="Filter: Approved catalog"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-green">
              <CheckIcon width={18} height={18} />
            </span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.approvedCount : "--"}</span>
            <strong className="staff-metric-title">Approved</strong>
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
          title="Filter: Rejected"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-red">
              <AlertIcon width={18} height={18} />
            </span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.rejectedCount : "--"}</span>
            <strong className="staff-metric-title">Rejected</strong>
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
          title="Filter: All records"
        >
          <div className="staff-metric-header">
            <span className="staff-metric-icon is-cyan">
              <DiscIcon width={18} height={18} />
            </span>
          </div>
          <div className="staff-metric-body">
            <span className="staff-metric-value">{stats ? stats.totalCount : "--"}</span>
            <strong className="staff-metric-title">Total Tracks</strong>
          </div>
        </button>
      </section>

      {/* Main Review Workspace Panel */}
      <section className="staff-queue-panel">
        {/* Panel Header & Live Controls */}
        <div className="staff-queue-panel-header">
          <div className="staff-queue-title-group">
            <h2 className="staff-queue-heading">Moderation Queue</h2>
            <span className="staff-counter-badge">
              {queuePage ? `${queuePage.totalElements} tracks` : "..."}
            </span>
          </div>

          <div className="staff-queue-header-actions">
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
                    onClick={() => handleSelectSubmission(item.id)}
                    title="Inspect track details"
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
                      onClick={() => handleSelectSubmission(item.id)}
                      title={`Inspect ${item.trackTitle}`}
                    >
                      {item.trackTitle}
                    </button>

                    {item.albumTitle ? (
                      <span className="staff-meta-pill is-album" title={`Album: ${item.albumTitle}`}>
                        <DiscIcon width={12} height={12} />
                        <span>{item.albumTitle}</span>
                      </span>
                    ) : null}

                    {item.genreName ? (
                      <span className="staff-meta-pill is-genre">{item.genreName}</span>
                    ) : null}

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

                    <span className="staff-queue-time-chip">
                      <ClockIcon width={12} height={12} />
                      <span>{formatRelativeTime(item.submittedAt)}</span>
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
                        : "Pending"}
                    </span>
                  </span>
                </div>

                {/* Action Buttons: Only 1 Inspect button */}
                <div className="staff-track-actions-col">
                  <button
                    type="button"
                    className="staff-btn-review"
                    onClick={() => handleSelectSubmission(item.id)}
                    title="Inspect track details and audio"
                  >
                    <EyeIcon width={15} height={15} />
                    <span>Inspect</span>
                  </button>
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
    </div>
  );
}

