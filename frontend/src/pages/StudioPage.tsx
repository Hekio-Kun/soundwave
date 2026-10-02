import { useState } from "react";
import { covers } from "../data";
import { CheckIcon, CloseIcon, FileTextIcon, PlusIcon, UploadIcon } from "../icons";
import type { StudioTrack } from "../types";

type Props = {
  tracks: StudioTrack[];
  onUploadTrack: (track: Omit<StudioTrack, "id" | "createdAt">) => void;
  onSubmitForReview: (trackId: number) => void;
  onNavigate: (route: string) => void;
};

export function StudioPage({ tracks, onUploadTrack, onSubmitForReview, onNavigate }: Props) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRejectedTrack, setSelectedRejectedTrack] = useState<StudioTrack | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [genreSlug, setGenreSlug] = useState("pop");
  const [audioName, setAudioName] = useState("");
  const [coverName, setCoverName] = useState("");

  const filtered = tracks.filter((t) => filterStatus === "ALL" || t.status === filterStatus);

  const stats = {
    total: tracks.length,
    draft: tracks.filter((t) => t.status === "DRAFT").length,
    pending: tracks.filter((t) => t.status === "PENDING").length,
    approved: tracks.filter((t) => t.status === "APPROVED").length,
    rejected: tracks.filter((t) => t.status === "REJECTED").length,
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioName) return;

    onUploadTrack({
      title: title.trim(),
      coverUrl: covers.dawn,
      audioUrl: "/audio/soundwave-demo.wav",
      durationMs: 240000,
      genreSlug,
      genreName: genreSlug.toUpperCase(),
      status: "DRAFT",
    });

    setTitle("");
    setAudioName("");
    setCoverName("");
    setUploadModalOpen(false);
  };

  return (
    <div className="studio-page">
      <div className="studio-header">
        <div>
          <span className="eyebrow">CONTENT STUDIO</span>
          <h1 className="page-heading">Content Studio</h1>
          <p className="page-subtext">Upload tracks, save drafts, and manage review submissions.</p>
        </div>
        <button className="button button-primary" onClick={() => setUploadModalOpen(true)}>
          <UploadIcon width={18} height={18} />
          <span>Create track</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="studio-metrics-grid">
        <div className="metric-card" onClick={() => setFilterStatus("ALL")}>
          <span className="metric-label">Total tracks</span>
          <b className="metric-value">{stats.total}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("APPROVED")}>
          <span className="metric-label metric-label--approved">Published</span>
          <b className="metric-value text-success">{stats.approved}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("PENDING")}>
          <span className="metric-label metric-label--pending">Pending</span>
          <b className="metric-value text-warning">{stats.pending}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("REJECTED")}>
          <span className="metric-label metric-label--rejected">Rejected</span>
          <b className="metric-value text-danger">{stats.rejected}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("DRAFT")}>
          <span className="metric-label">Draft</span>
          <b className="metric-value">{stats.draft}</b>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="studio-tabs-bar">
        <button
          className={`filter-pill ${filterStatus === "ALL" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("ALL")}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-pill ${filterStatus === "APPROVED" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("APPROVED")}
        >
          Published ({stats.approved})
        </button>
        <button
          className={`filter-pill ${filterStatus === "PENDING" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("PENDING")}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`filter-pill ${filterStatus === "REJECTED" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("REJECTED")}
        >
          Rejected ({stats.rejected})
        </button>
        <button
          className={`filter-pill ${filterStatus === "DRAFT" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("DRAFT")}
        >
          Draft ({stats.draft})
        </button>
      </div>

      {/* Tracks Table */}
      <div className="studio-table-container">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Genre</th>
              <th>Status</th>
              <th>Submitted date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty-cell">
                  No tracks in this category.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="table-track-cell">
                      <img src={t.coverUrl ?? covers.dawn} alt="" />
                      <div>
                        <b>{t.title}</b>
                        <small>{t.albumTitle ?? "Single"}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className="genre-badge">{t.genreName}</span></td>
                  <td>
                    <span className={`status-badge status-badge--${t.status.toLowerCase()}`}>
                      {t.status === "APPROVED" && "Published"}
                      {t.status === "PENDING" && "Pending Staff review"}
                      {t.status === "REJECTED" && "Rejected"}
                      {t.status === "DRAFT" && "Draft"}
                    </span>
                  </td>
                  <td>{t.createdAt}</td>
                  <td>
                    <div className="table-action-btns">
                      {t.status === "DRAFT" && (
                        <button
                          className="button button-primary button-small"
                          onClick={() => onSubmitForReview(t.id)}
                        >
                          Submit for review
                        </button>
                      )}

                      {t.status === "REJECTED" && (
                        <>
                          <button
                            className="button button-secondary button-small"
                            onClick={() => setSelectedRejectedTrack(t)}
                          >
                            View rejection reason
                          </button>
                          <button
                            className="button button-primary button-small"
                            onClick={() => onSubmitForReview(t.id)}
                          >
                            Resubmit
                          </button>
                        </>
                      )}

                      {t.status === "APPROVED" && (
                        <button
                          className="button button-ghost button-small"
                          onClick={() => onNavigate(`/track/1`)}
                        >
                          View track
                        </button>
                      )}

                      {t.status === "PENDING" && (
                        <span className="text-muted small">Under review...</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setUploadModalOpen(false)}>
          <div className="dialog-box dialog-box--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Create track</h3>
              <button className="icon-button" onClick={() => setUploadModalOpen(false)}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="track-title">Title *</label>
                <input
                  id="track-title"
                  type="text"
                  required
                  placeholder="For example: Hoàng Hôn Trên Phố"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="track-genre">Genre *</label>
                <select
                  id="track-genre"
                  value={genreSlug}
                  onChange={(e) => setGenreSlug(e.target.value)}
                >
                  <option value="pop">Pop</option>
                  <option value="ballad">Ballad</option>
                  <option value="rap-hip-hop">Rap / Hip-hop</option>
                  <option value="rnb">R&B</option>
                  <option value="acoustic">Acoustic</option>
                  <option value="edm">EDM</option>
                  <option value="indie">Indie</option>
                  <option value="lofi">Lofi</option>
                </select>
              </div>

              <div className="form-group">
                <label>Audio file (MP3, maximum 15 MB) *</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/*"
                    id="audio-file-input"
                    onChange={(e) => setAudioName(e.target.files?.[0]?.name ?? "")}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="audio-file-input" className="file-drop-label">
                    <UploadIcon width={24} height={24} />
                    <span>{audioName ? `Selected: ${audioName}` : "Select an MP3 audio file"}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Cover image (JPG or PNG, maximum 5 MB)</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    accept="image/*"
                    id="cover-file-input"
                    onChange={(e) => setCoverName(e.target.files?.[0]?.name ?? "")}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="cover-file-input" className="file-drop-label">
                    <span>{coverName ? `Selected: ${coverName}` : "Select a cover image"}</span>
                  </label>
                </div>
              </div>

              <div className="dialog-actions">
                <button type="submit" className="button button-primary" disabled={!title.trim() || !audioName}>
                  Save draft
                </button>
                <button type="button" className="button button-secondary" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {selectedRejectedTrack && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedRejectedTrack(null)}>
          <div className="dialog-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Track Rejection Details</h3>
              <button className="icon-button" onClick={() => setSelectedRejectedTrack(null)}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p className="rejection-track-name">Track: <b>{selectedRejectedTrack.title}</b></p>
            <div className="rejection-box">
              <p className="rejection-text">{selectedRejectedTrack.latestRejectionReason}</p>
            </div>
            <p className="rejection-help">
              Update the audio file or metadata, then resubmit the track for Staff review.
            </p>
            <div className="dialog-actions">
              <button
                className="button button-primary"
                onClick={() => {
                  onSubmitForReview(selectedRejectedTrack.id);
                  setSelectedRejectedTrack(null);
                }}
              >
                Resubmit
              </button>
              <button className="button button-secondary" onClick={() => setSelectedRejectedTrack(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
