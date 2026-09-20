import { useState } from "react";
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
      coverUrl: "/pics/album.png",
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
          <h1 className="page-heading">Quản lý bài hát của bạn</h1>
          <p className="page-subtext">Mọi thành viên đều có thể tự do tải lên và phát hành các tác phẩm âm nhạc.</p>
        </div>
        <button className="button button-primary" onClick={() => setUploadModalOpen(true)}>
          <UploadIcon width={18} height={18} />
          <span>Tải lên bài hát mới</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="studio-metrics-grid">
        <div className="metric-card" onClick={() => setFilterStatus("ALL")}>
          <span className="metric-label">Tổng bài hát</span>
          <b className="metric-value">{stats.total}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("APPROVED")}>
          <span className="metric-label metric-label--approved">Đã phê duyệt</span>
          <b className="metric-value text-success">{stats.approved}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("PENDING")}>
          <span className="metric-label metric-label--pending">Đang chờ duyệt</span>
          <b className="metric-value text-warning">{stats.pending}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("REJECTED")}>
          <span className="metric-label metric-label--rejected">Bị từ chối</span>
          <b className="metric-value text-danger">{stats.rejected}</b>
        </div>
        <div className="metric-card" onClick={() => setFilterStatus("DRAFT")}>
          <span className="metric-label">Bản nháp</span>
          <b className="metric-value">{stats.draft}</b>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="studio-tabs-bar">
        <button
          className={`filter-pill ${filterStatus === "ALL" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("ALL")}
        >
          Tất cả ({stats.total})
        </button>
        <button
          className={`filter-pill ${filterStatus === "APPROVED" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("APPROVED")}
        >
          Đã duyệt ({stats.approved})
        </button>
        <button
          className={`filter-pill ${filterStatus === "PENDING" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("PENDING")}
        >
          Chờ duyệt ({stats.pending})
        </button>
        <button
          className={`filter-pill ${filterStatus === "REJECTED" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("REJECTED")}
        >
          Bị từ chối ({stats.rejected})
        </button>
        <button
          className={`filter-pill ${filterStatus === "DRAFT" ? "filter-pill--active" : ""}`}
          onClick={() => setFilterStatus("DRAFT")}
        >
          Bản nháp ({stats.draft})
        </button>
      </div>

      {/* Tracks Table */}
      <div className="studio-table-container">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Tên bài hát</th>
              <th>Thể loại</th>
              <th>Trạng thái</th>
              <th>Ngày nộp</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty-cell">
                  Không có bài hát nào trong mục này.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="table-track-cell">
                      <img src={t.coverUrl ?? "/pics/album.png"} alt="" />
                      <div>
                        <b>{t.title}</b>
                        <small>{t.albumTitle ?? "Đĩa đơn"}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className="genre-badge">{t.genreName}</span></td>
                  <td>
                    <span className={`status-badge status-badge--${t.status.toLowerCase()}`}>
                      {t.status === "APPROVED" && "Đã phát hành"}
                      {t.status === "PENDING" && "Đang chờ Staff duyệt"}
                      {t.status === "REJECTED" && "Bị từ chối"}
                      {t.status === "DRAFT" && "Bản nháp"}
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
                          Gửi duyệt
                        </button>
                      )}

                      {t.status === "REJECTED" && (
                        <>
                          <button
                            className="button button-secondary button-small"
                            onClick={() => setSelectedRejectedTrack(t)}
                          >
                            Xem lý do
                          </button>
                          <button
                            className="button button-primary button-small"
                            onClick={() => onSubmitForReview(t.id)}
                          >
                            Gửi lại
                          </button>
                        </>
                      )}

                      {t.status === "APPROVED" && (
                        <button
                          className="button button-ghost button-small"
                          onClick={() => onNavigate(`/track/1`)}
                        >
                          Xem bài hát
                        </button>
                      )}

                      {t.status === "PENDING" && (
                        <span className="text-muted small">Đang thẩm định...</span>
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
              <h3>Đăng tải bài hát mới</h3>
              <button className="icon-button" onClick={() => setUploadModalOpen(false)}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="track-title">Tiêu đề bài hát *</label>
                <input
                  id="track-title"
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Hôn Trên Phố"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="track-genre">Thể loại âm nhạc *</label>
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
                <label>Tệp âm thanh (MP3, tối đa 15MB) *</label>
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
                    <span>{audioName ? `Đã chọn: ${audioName}` : "Nhấp để chọn file âm thanh MP3"}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Ảnh bìa bài hát (JPG, PNG, tối đa 5MB)</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    accept="image/*"
                    id="cover-file-input"
                    onChange={(e) => setCoverName(e.target.files?.[0]?.name ?? "")}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="cover-file-input" className="file-drop-label">
                    <span>{coverName ? `Đã chọn: ${coverName}` : "Nhấp để chọn ảnh bìa"}</span>
                  </label>
                </div>
              </div>

              <div className="dialog-actions">
                <button type="submit" className="button button-primary" disabled={!title.trim() || !audioName}>
                  Lưu bản nháp (Save Draft)
                </button>
                <button type="button" className="button button-secondary" onClick={() => setUploadModalOpen(false)}>
                  Hủy
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
              <h3>Lý do từ chối kiểm duyệt</h3>
              <button className="icon-button" onClick={() => setSelectedRejectedTrack(null)}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p className="rejection-track-name">Bài hát: <b>{selectedRejectedTrack.title}</b></p>
            <div className="rejection-box">
              <p className="rejection-text">{selectedRejectedTrack.latestRejectionReason}</p>
            </div>
            <p className="rejection-help">
              Bạn có thể điều chỉnh lại file âm thanh hoặc metadata của bài hát và gửi duyệt lại để Staff thẩm định lại.
            </p>
            <div className="dialog-actions">
              <button
                className="button button-primary"
                onClick={() => {
                  onSubmitForReview(selectedRejectedTrack.id);
                  setSelectedRejectedTrack(null);
                }}
              >
                Gửi lại duyệt (Resubmit)
              </button>
              <button className="button button-secondary" onClick={() => setSelectedRejectedTrack(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
