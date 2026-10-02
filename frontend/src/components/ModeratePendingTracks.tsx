import { useEffect, useState, type ChangeEvent } from "react";
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
  SearchIcon,
  TrendingUpIcon,
} from "../icons";

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
  onNavigate: (route: string) => void;
  initialSubmissionId?: number | null;
};

export function ModeratePendingTracks({ onNavigate, initialSubmissionId }: Props) {
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [queuePage, setQueuePage] = useState<PageResponse<SubmissionQueueItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  const loadQueue = async () => {
    setLoading(true);
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

  // Approve action
  const handleConfirmApprove = async () => {
    if (!approvingTarget) return;
    const targetId = approvingTarget.id;
    const title = approvingTarget.trackTitle;

    setIsSubmittingApprove(true);
    try {
      await moderationApi.approveSubmission(targetId, approveNote);
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
      await moderationApi.rejectSubmission(targetId, rejectionReason.trim(), rejectNote.trim());
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
      {/* Top statistics overview */}
      <section className="ops-metric-grid" aria-label="Moderation statistics">
        <article className="ops-metric ops-metric--amber">
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <ClockIcon />
            </span>
            <span className="ops-metric-change">
              <TrendingUpIcon width={13} height={13} />
              FIFO Queue
            </span>
          </div>
          <strong>{stats ? stats.pendingCount : "--"}</strong>
          <span className="ops-metric-label">Pending Tracks</span>
          <small>Prioritized by earliest submission time</small>
        </article>

        <article className="ops-metric ops-metric--green">
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <CheckIcon />
            </span>
            <span className="ops-metric-change">
              <CheckIcon width={13} height={13} />
              Approved
            </span>
          </div>
          <strong>{statusFilter === "APPROVED" && queuePage ? queuePage.totalElements : "1+"}</strong>
          <span className="ops-metric-label">Approved Tracks</span>
          <small>Tracks published to public catalog</small>
        </article>

        <article className="ops-metric ops-metric--red">
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <AlertIcon />
            </span>
            <span className="ops-metric-change">Requires Action</span>
          </div>
          <strong>{statusFilter === "REJECTED" && queuePage ? queuePage.totalElements : "1+"}</strong>
          <span className="ops-metric-label">Rejected Tracks</span>
          <small>Feedback and reason sent to artists</small>
        </article>

        <article className="ops-metric ops-metric--violet">
          <div className="ops-metric-top">
            <span className="ops-metric-icon">
              <DiscIcon />
            </span>
            <span className="ops-metric-change">Total Archive</span>
          </div>
          <strong>{statusFilter === "ALL" && queuePage ? queuePage.totalElements : "6"}</strong>
          <span className="ops-metric-label">Total Submissions</span>
          <small>All moderation submission history</small>
        </article>
      </section>

      {/* Main Review Queue Panel */}
      <article className="ops-panel ops-review-panel" style={{ marginTop: "18px" }}>
        <div className="ops-panel-heading">
          <div>
            <h2>Moderate Pending Tracks</h2>
            <p>Review tracks prioritized by wait time (FIFO)</p>
          </div>
          <span className="ops-queue-count">
            {queuePage ? `${queuePage.totalElements} tracks` : "Loading..."}
          </span>
        </div>

        {/* Search & Filter Toolbar */}
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
              Approved
            </button>
            <button
              className={statusFilter === "REJECTED" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("REJECTED");
                setPage(0);
              }}
            >
              Rejected
            </button>
            <button
              className={statusFilter === "ALL" ? "is-active" : ""}
              onClick={() => {
                setStatusFilter("ALL");
                setPage(0);
              }}
            >
              All
            </button>
          </div>

          <div className="mod-search-box">
            <SearchIcon width={16} height={16} />
            <input
              type="text"
              placeholder="Search by track title, artist or email..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
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

        {/* Content list */}
        {loading ? (
          <div className="mod-loading-state">
            <div className="mod-spinner" />
            <span>Loading data from SoundWave server...</span>
          </div>
        ) : error ? (
          <div className="mod-error-state">
            <AlertIcon width={28} height={28} />
            <b>An error occurred</b>
            <p>{error}</p>
            <button className="button button-primary button-small" onClick={() => void loadQueue()}>
              Retry
            </button>
          </div>
        ) : !queuePage || queuePage.content.length === 0 ? (
          <div className="ops-empty-state">
            <CheckIcon width={32} height={32} />
            <b>No tracks found in this queue</b>
            <span>No records match the current filter or search criteria.</span>
          </div>
        ) : (
          <div className="ops-review-list">
            {queuePage.content.map((item) => (
              <article
                className={`ops-review-row ${item.status === "PENDING" ? "is-priority" : ""}`}
                key={item.id}
              >
                <img
                  src={item.coverUrl ?? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"}
                  alt=""
                />

                <div
                  className="ops-review-copy"
                  onClick={() => setSelectedSubmissionId(item.id)}
                  style={{ cursor: "pointer" }}
                  title="Click to view submission details"
                >
                  <div className="ops-review-title-line">
                    <strong>{item.trackTitle}</strong>
                    {item.albumTitle ? (
                      <span className="mod-badge mod-badge--album" title={`Album: ${item.albumTitle}`}>
                        <DiscIcon width={12} height={12} /> {item.albumTitle}
                      </span>
                    ) : null}
                  </div>

                  <p>
                    {item.submitterDisplayName ?? "Artist"} <i /> {item.genreName ?? "Pop"}
                  </p>

                  <small>
                    <ClockIcon width={12} height={12} /> Submitted: {formatDate(item.submittedAt)}
                  </small>
                </div>

                <div className="ops-review-state">
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
                      : "Pending"}
                  </span>
                </div>

                <div className="ops-review-actions">
                  <button
                    className="ops-icon-action"
                    aria-label={`Open review for ${item.trackTitle}`}
                    title="Open details & preview track"
                    onClick={() => setSelectedSubmissionId(item.id)}
                  >
                    <EyeIcon width={17} height={17} />
                  </button>

                  {item.status === "PENDING" ? (
                    <>
                      <button
                        className="ops-decision ops-decision--approve"
                        onClick={() => {
                          setApprovingTarget(item);
                          setApproveNote("");
                        }}
                      >
                        <CheckIcon width={15} height={15} />
                        Approve
                      </button>
                      <button
                        className="ops-decision ops-decision--reject"
                        onClick={() => {
                          setRejectingTarget(item);
                          setRejectionReason("");
                          setRejectNote("");
                        }}
                      >
                        <CloseIcon width={15} height={15} />
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination bar */}
        {queuePage && queuePage.totalPages > 1 ? (
          <div className="mod-pagination">
            <button
              disabled={queuePage.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="button button-ghost button-small"
            >
              ← Previous
            </button>
            <span>
              Page <b>{queuePage.number + 1}</b> of {queuePage.totalPages} ({queuePage.totalElements} results)
            </span>
            <button
              disabled={queuePage.last}
              onClick={() => setPage((p) => p + 1)}
              className="button button-ghost button-small"
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
            className="modal-card ops-reject-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="ops-dialog-icon" style={{ background: "#ecfdf3", color: "#039855" }}>
                  <CheckIcon />
                </span>
                <h2>Confirm Track Approval</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setApprovingTarget(null)}
                aria-label="Close"
                disabled={isSubmittingApprove}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <p>
              You are approving the track <b>“{approvingTarget.trackTitle}”</b>. It will be moved to
              <b> PUBLISHED</b> status and made available to listeners.
            </p>

            <label className="ops-reason-field" style={{ marginTop: "14px" }}>
              <span>Reviewer Note (Optional)</span>
              <textarea
                rows={3}
                placeholder="e.g. Meets 320kbps audio quality standard, metadata accurate..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                disabled={isSubmittingApprove}
              />
            </label>

            <div className="modal-actions" style={{ marginTop: "18px" }}>
              <button
                className="button button-ghost"
                onClick={() => setApprovingTarget(null)}
                disabled={isSubmittingApprove}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                style={{ background: "#039855", borderColor: "#039855" }}
                onClick={() => void handleConfirmApprove()}
                disabled={isSubmittingApprove}
              >
                {isSubmittingApprove ? "Processing..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Confirmation Modal */}
      {rejectingTarget ? (
        <div className="modal-overlay" role="presentation" onClick={() => setRejectingTarget(null)}>
          <div
            className="modal-card ops-reject-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="ops-dialog-icon">
                  <AlertIcon />
                </span>
                <h2>Reject Track Submission</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setRejectingTarget(null)}
                aria-label="Close"
                disabled={isSubmittingReject}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <p>
              You are rejecting the track <b>“{rejectingTarget.trackTitle}”</b>. The rejection reason will
              be sent via email to the artist so they can revise and re-submit.
            </p>

            <label className="ops-reason-field" style={{ marginTop: "14px" }}>
              <span>
                Rejection Reason <strong style={{ color: "#d92d20" }}>*</strong> (Minimum 10 characters)
              </span>
              <textarea
                rows={3}
                autoFocus
                placeholder="Provide a clear reason (e.g. Audio distortion detected, copyright verification needed, low bitrate...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isSubmittingReject}
              />
              <small style={{ color: rejectionReason.trim().length >= 10 ? "#039855" : "#98a2b3" }}>
                Entered: {rejectionReason.trim().length}/10 characters minimum
              </small>
            </label>

            <label className="ops-reason-field" style={{ marginTop: "10px" }}>
              <span>Internal Reviewer Note (Optional)</span>
              <textarea
                rows={2}
                placeholder="Internal notes for editorial team..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                disabled={isSubmittingReject}
              />
            </label>

            <div className="modal-actions" style={{ marginTop: "18px" }}>
              <button
                className="button button-ghost"
                onClick={() => setRejectingTarget(null)}
                disabled={isSubmittingReject}
              >
                Cancel
              </button>
              <button
                className="button ops-danger-button"
                disabled={rejectionReason.trim().length < 10 || isSubmittingReject}
                onClick={() => void handleConfirmReject()}
              >
                {isSubmittingReject ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
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
