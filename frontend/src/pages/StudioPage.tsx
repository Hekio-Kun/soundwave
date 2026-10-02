import { useEffect, useState, type FormEvent } from "react";
import {
  studioApi,
  type ApiTrack,
  type GenreOption,
  type AlbumOption,
  type RejectionDetails,
} from "../api/track";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  FileTextIcon,
  TrashIcon,
  UploadIcon,
} from "../icons";
import type { StudioTrack } from "../types";

type Props = {
  tracks: StudioTrack[];
  onUploadTrack?: (track: Omit<StudioTrack, "id" | "createdAt">) => void;
  onSubmitForReview?: (trackId: number) => void;
  onNavigate: (route: string) => void;
};

type FormMode = "create" | "edit";

export function StudioPage({ tracks: fallbackTracks, onNavigate }: Props) {
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  // Server state
  const [trackList, setTrackList] = useState<StudioTrack[]>(fallbackTracks);
  const [stats, setStats] = useState({
    total: fallbackTracks.length,
    draft: fallbackTracks.filter((t) => t.status === "DRAFT").length,
    pending: fallbackTracks.filter((t) => t.status === "PENDING").length,
    approved: fallbackTracks.filter((t) => t.status === "APPROVED").length,
    rejected: fallbackTracks.filter((t) => t.status === "REJECTED").length,
  });
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals state
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<FormMode>("create");
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);

  const [deleteConfirmTrack, setDeleteConfirmTrack] = useState<StudioTrack | null>(null);
  const [rejectionModalTrack, setRejectionModalTrack] = useState<RejectionDetails | null>(null);
  const [submittingNoteTrack, setSubmittingNoteTrack] = useState<StudioTrack | null>(null);
  const [submitterNote, setSubmitterNote] = useState("");

  // Form inputs
  const [title, setTitle] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState<number>(1);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | "">("");
  const [trackNumber, setTrackNumber] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [lyricsContent, setLyricsContent] = useState("");
  const [lyricsFileName, setLyricsFileName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load data from Backend API
  const loadStudioData = async () => {
    try {
      setLoading(true);
      const [fetchedTracks, fetchedStats, fetchedGenres, fetchedAlbums] =
        await Promise.all([
          studioApi.getMyTracks(filterStatus).catch(() => null),
          studioApi.getStats().catch(() => null),
          studioApi.getGenres().catch(() => null),
          studioApi.getMyAlbums().catch(() => null),
        ]);

      if (fetchedTracks) {
        const mapped: StudioTrack[] = fetchedTracks.map((t: ApiTrack) => ({
          id: t.id,
          title: t.title,
          slug: t.slug,
          description: t.description,
          coverUrl: t.coverUrl ?? "/pics/album.png",
          audioUrl: t.audioUrl,
          durationMs: t.durationMs,
          genreId: t.genreId,
          genreSlug: t.genreSlug,
          genreName: t.genreName,
          albumId: t.albumId,
          albumTitle: t.albumTitle,
          trackNumber: t.trackNumber,
          status: t.status === "TAKEN_DOWN" ? "REJECTED" : t.status,
          latestRejectionReason: t.latestRejectionReason,
          reviewerNote: t.reviewerNote,
          createdAt: new Date(t.createdAt).toLocaleDateString(),
          lyrics: t.lyrics,
        }));
        setTrackList(mapped);
      }

      if (fetchedStats) {
        setStats(fetchedStats);
      }

      if (fetchedGenres && fetchedGenres.length > 0) {
        setGenres(fetchedGenres);
        if (!selectedGenreId) {
          setSelectedGenreId(fetchedGenres[0].id);
        }
      }

      if (fetchedAlbums) {
        setAlbums(fetchedAlbums);
      }
    } catch {
      // Keep existing data on network/auth error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudioData();
  }, [filterStatus]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setEditingTrackId(null);
    setTitle("");
    setDescription("");
    setSelectedAlbumId("");
    setTrackNumber("");
    setAudioFileName("");
    setCoverFileName("");
    setLyricsContent("");
    setLyricsFileName("");
    setFormErrors({});
    if (genres.length > 0) {
      setSelectedGenreId(genres[0].id);
    }
    setTrackModalOpen(true);
  };

  // Open Edit Modal (UC-19.3)
  const openEditModal = (track: StudioTrack) => {
    setModalMode("edit");
    setEditingTrackId(track.id);
    setTitle(track.title);
    setDescription(track.description ?? "");
    setSelectedAlbumId(track.albumId ?? "");
    setTrackNumber(track.trackNumber ?? "");
    if (track.genreId) {
      setSelectedGenreId(track.genreId);
    } else if (genres.length > 0) {
      const match = genres.find((g) => g.slug === track.genreSlug);
      setSelectedGenreId(match ? match.id : genres[0].id);
    }
    setAudioFileName(track.audioUrl ? "Existing audio file attached" : "");
    setCoverFileName(track.coverUrl ? "Existing cover artwork attached" : "");
    setLyricsContent(track.lyrics ?? "");
    setLyricsFileName(track.lyrics ? "Existing lyrics attached" : "");
    setFormErrors({});
    setTrackModalOpen(true);
  };

  // Form submission validation & handling (UC-19.1 & UC-19.3)
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Please enter the track title.";
    } else if (title.trim().length > 200) {
      errors.title = "Track title cannot exceed 200 characters.";
    }

    if (!selectedGenreId) {
      errors.genre = "Please select a music genre.";
    }

    if (modalMode === "create" && !audioFileName) {
      errors.audio = "Please select an audio file (MP3, WAV).";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const genreObj = genres.find((g) => g.id === selectedGenreId);
      const genreSlug = genreObj ? genreObj.slug : "pop";
      const genreName = genreObj ? genreObj.name : "POP";

      if (modalMode === "create") {
        await studioApi
          .createDraft({
            title: title.trim(),
            genreId: selectedGenreId,
            albumId: selectedAlbumId ? Number(selectedAlbumId) : undefined,
            trackNumber: trackNumber ? Number(trackNumber) : undefined,
            description: description.trim() || undefined,
            audioUrl: "/audio/soundwave-demo.wav",
            coverUrl: "/pics/album.png",
            lyrics: lyricsContent.trim() || undefined,
          })
          .catch(() => {
            // Local fallback if backend is offline
            const localNew: StudioTrack = {
              id: Date.now(),
              title: title.trim(),
              genreId: selectedGenreId,
              genreSlug,
              genreName,
              albumId: selectedAlbumId ? Number(selectedAlbumId) : undefined,
              trackNumber: trackNumber ? Number(trackNumber) : undefined,
              description: description.trim() || undefined,
              coverUrl: "/pics/album.png",
              audioUrl: "/audio/soundwave-demo.wav",
              durationMs: 240000,
              status: "DRAFT",
              createdAt: "Just now",
              lyrics: lyricsContent.trim() || undefined,
            };
            setTrackList((prev) => [localNew, ...prev]);
            setStats((prev) => ({
              ...prev,
              total: prev.total + 1,
              draft: prev.draft + 1,
            }));
          });
      } else if (editingTrackId) {
        await studioApi
          .updateTrack(editingTrackId, {
            title: title.trim(),
            genreId: selectedGenreId,
            albumId: selectedAlbumId ? Number(selectedAlbumId) : undefined,
            trackNumber: trackNumber ? Number(trackNumber) : undefined,
            description: description.trim() || undefined,
            coverUrl: "/pics/album.png",
            lyrics: lyricsContent.trim() || undefined,
          })
          .catch(() => {
            // Local fallback
            setTrackList((prev) =>
              prev.map((t) =>
                t.id === editingTrackId
                  ? {
                      ...t,
                      title: title.trim(),
                      genreId: selectedGenreId,
                      genreSlug,
                      genreName,
                      albumId: selectedAlbumId ? Number(selectedAlbumId) : undefined,
                      trackNumber: trackNumber ? Number(trackNumber) : undefined,
                      description: description.trim() || undefined,
                      lyrics: lyricsContent.trim() || undefined,
                    }
                  : t
              )
            );
          });
      }

      setTrackModalOpen(false);
      await loadStudioData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to save track.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Track (UC-19.4)
  const handleDeleteTrack = async () => {
    if (!deleteConfirmTrack) return;
    try {
      setIsSaving(true);
      await studioApi.deleteTrack(deleteConfirmTrack.id).catch(() => {
        setTrackList((prev) => prev.filter((t) => t.id !== deleteConfirmTrack.id));
      });
      setDeleteConfirmTrack(null);
      await loadStudioData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete track.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit For Review (UC-19.5)
  const handleSubmitReview = async () => {
    if (!submittingNoteTrack) return;
    try {
      setIsSaving(true);
      await studioApi
        .submitForReview(submittingNoteTrack.id, submitterNote.trim() || undefined)
        .catch(() => {
          setTrackList((prev) =>
            prev.map((t) =>
              t.id === submittingNoteTrack.id
                ? { ...t, status: "PENDING" as const }
                : t
            )
          );
        });
      setSubmittingNoteTrack(null);
      setSubmitterNote("");
      await loadStudioData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to submit track.");
    } finally {
      setIsSaving(false);
    }
  };

  // View Rejection Reason (UC-20)
  const handleViewRejection = async (track: StudioTrack) => {
    try {
      const details = await studioApi.getRejectionDetails(track.id).catch(() => null);
      if (details) {
        setRejectionModalTrack(details);
      } else {
        setRejectionModalTrack({
          trackId: track.id,
          trackTitle: track.title,
          status: "REJECTED",
          rejectionReason:
            track.latestRejectionReason ||
            "The audio file or metadata does not satisfy SoundWave community standards.",
          reviewerNote: track.reviewerNote,
        });
      }
    } catch {
      setRejectionModalTrack({
        trackId: track.id,
        trackTitle: track.title,
        status: "REJECTED",
        rejectionReason:
          track.latestRejectionReason || "Audio content violates policy.",
      });
    }
  };

  const filtered = trackList.filter(
    (t) => filterStatus === "ALL" || t.status === filterStatus
  );

  return (
    <div className="studio-page">
      <div className="studio-header">
        <div>
          <span className="eyebrow">CONTENT STUDIO</span>
          <h1 className="page-heading">Content Studio</h1>
          <p className="page-subtext">
            Upload tracks, save drafts, manage submissions, and review staff feedback.
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={openCreateModal}
          id="btn-open-create-track"
        >
          <UploadIcon width={18} height={18} />
          <span>Upload track</span>
        </button>
      </div>

      {actionError && (
        <div className="auth-v2-error" role="alert" style={{ marginBottom: "20px" }}>
          <span><AlertIcon width={18} height={18} /></span>
          <div>
            <b>Operation failed</b>
            <small>{actionError}</small>
          </div>
          <button
            className="icon-button"
            onClick={() => setActionError(null)}
            style={{ marginLeft: "auto" }}
            aria-label="Dismiss error"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="studio-metrics-grid">
        <div
          className={`metric-card ${filterStatus === "ALL" ? "metric-card--active" : ""}`}
          onClick={() => setFilterStatus("ALL")}
          role="button"
          tabIndex={0}
        >
          <span className="metric-label">Total tracks</span>
          <b className="metric-value">{stats.total}</b>
        </div>
        <div
          className={`metric-card ${filterStatus === "APPROVED" ? "metric-card--active" : ""}`}
          onClick={() => setFilterStatus("APPROVED")}
          role="button"
          tabIndex={0}
        >
          <span className="metric-label metric-label--approved">Published</span>
          <b className="metric-value text-success">{stats.approved}</b>
        </div>
        <div
          className={`metric-card ${filterStatus === "PENDING" ? "metric-card--active" : ""}`}
          onClick={() => setFilterStatus("PENDING")}
          role="button"
          tabIndex={0}
        >
          <span className="metric-label metric-label--pending">Pending</span>
          <b className="metric-value text-warning">{stats.pending}</b>
        </div>
        <div
          className={`metric-card ${filterStatus === "REJECTED" ? "metric-card--active" : ""}`}
          onClick={() => setFilterStatus("REJECTED")}
          role="button"
          tabIndex={0}
        >
          <span className="metric-label metric-label--rejected">Rejected</span>
          <b className="metric-value text-danger">{stats.rejected}</b>
        </div>
        <div
          className={`metric-card ${filterStatus === "DRAFT" ? "metric-card--active" : ""}`}
          onClick={() => setFilterStatus("DRAFT")}
          role="button"
          tabIndex={0}
        >
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
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--sw-text-muted)" }}>
            Loading tracks...
          </div>
        ) : (
          <table className="studio-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Genre</th>
                <th>Album</th>
                <th>Status</th>
                <th>Created date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    No tracks in this category. Click &quot;Upload track&quot; to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="table-track-cell">
                        <img src={t.coverUrl ?? "/pics/album.png"} alt={t.title} />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <b>{t.title}</b>
                            {t.lyrics && (
                              <span
                                title="Official lyrics attached"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  padding: "2px 6px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  background: "#ecfeff",
                                  color: "#0891b2",
                                  borderRadius: "4px",
                                  border: "1px solid #cffafe",
                                }}
                              >
                                <FileTextIcon width={10} height={10} /> Lyrics
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <small
                              style={{
                                display: "block",
                                color: "var(--sw-text-muted)",
                                maxWidth: "260px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.description}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="genre-badge">{t.genreName}</span>
                    </td>
                    <td>
                      <span className="text-secondary small">
                        {t.albumTitle ? `${t.albumTitle}${t.trackNumber ? ` (#${t.trackNumber})` : ""}` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${t.status.toLowerCase()}`}>
                        {t.status === "APPROVED" && "Published"}
                        {t.status === "PENDING" && "Pending Review"}
                        {t.status === "REJECTED" && "Rejected"}
                        {t.status === "DRAFT" && "Draft"}
                      </span>
                    </td>
                    <td>{t.createdAt}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-action-btns" style={{ justifyContent: "flex-end" }}>
                        {t.status === "DRAFT" && (
                          <>
                            <button
                              className="button button-ghost button-small"
                              onClick={() => openEditModal(t)}
                              title="Edit draft metadata"
                            >
                              Edit
                            </button>
                            <button
                              className="button button-primary button-small"
                              onClick={() => {
                                setSubmittingNoteTrack(t);
                                setSubmitterNote("");
                              }}
                            >
                              Submit for review
                            </button>
                            <button
                              className="button button-ghost button-small text-danger"
                              onClick={() => setDeleteConfirmTrack(t)}
                              title="Delete draft"
                              aria-label="Delete draft"
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          </>
                        )}

                        {t.status === "REJECTED" && (
                          <>
                            <button
                              className="button button-secondary button-small"
                              onClick={() => handleViewRejection(t)}
                            >
                              Rejection feedback
                            </button>
                            <button
                              className="button button-ghost button-small"
                              onClick={() => openEditModal(t)}
                              title="Edit rejected track before resubmitting"
                            >
                              Edit
                            </button>
                            <button
                              className="button button-primary button-small"
                              onClick={() => {
                                setSubmittingNoteTrack(t);
                                setSubmitterNote("");
                              }}
                            >
                              Resubmit
                            </button>
                            <button
                              className="button button-ghost button-small text-danger"
                              onClick={() => setDeleteConfirmTrack(t)}
                              title="Delete track"
                              aria-label="Delete rejected track"
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          </>
                        )}

                        {t.status === "APPROVED" && (
                          <button
                            className="button button-ghost button-small"
                            onClick={() => onNavigate(`/track/${t.id}`)}
                          >
                            View track
                          </button>
                        )}

                        {t.status === "PENDING" && (
                          <span className="text-muted small">Under review by staff...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload & Edit Track Modal (UC-19.1 & UC-19.3) */}
      {trackModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !isSaving && setTrackModalOpen(false)}
        >
          <div
            className="modal-card modal-card--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Upload new track" : "Edit track"}</h3>
              <button
                className="icon-button"
                onClick={() => setTrackModalOpen(false)}
                disabled={isSaving}
                aria-label="Close dialog"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            {Object.keys(formErrors).length > 0 && (
              <div className="auth-v2-error" role="alert">
                <span><AlertIcon width={16} height={16} /></span>
                <div>
                  <b>Please review errors below</b>
                  <small>Make sure all mandatory fields are correctly filled.</small>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form" noValidate>
              <div className="form-group">
                <label htmlFor="track-title">
                  Title <span style={{ color: "var(--sw-danger)" }}>*</span>
                </label>
                <input
                  id="track-title"
                  type="text"
                  placeholder="For example: Sunset Memories"
                  value={title}
                  style={formErrors.title ? { borderColor: "#b42318", background: "#fef3f2" } : {}}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formErrors.title) {
                      setFormErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                />
                {formErrors.title && (
                  <small className="auth-v2-field-error">
                    <AlertIcon width={12} height={12} />
                    {formErrors.title}
                  </small>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label htmlFor="track-genre">
                    Genre <span style={{ color: "var(--sw-danger)" }}>*</span>
                  </label>
                  <select
                    id="track-genre"
                    value={selectedGenreId}
                    onChange={(e) => {
                      setSelectedGenreId(Number(e.target.value));
                      if (formErrors.genre) {
                        setFormErrors((prev) => ({ ...prev, genre: "" }));
                      }
                    }}
                  >
                    {genres.length > 0 ? (
                      genres.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Pop</option>
                        <option value={2}>Ballad</option>
                        <option value={3}>Rap / Hip-hop</option>
                        <option value={4}>R&B</option>
                        <option value={5}>Acoustic</option>
                        <option value={6}>EDM</option>
                        <option value={7}>Indie</option>
                        <option value={8}>Lofi</option>
                      </>
                    )}
                  </select>
                  {formErrors.genre && (
                    <small className="auth-v2-field-error">
                      <AlertIcon width={12} height={12} />
                      {formErrors.genre}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="track-album">Album (optional)</label>
                  <select
                    id="track-album"
                    value={selectedAlbumId}
                    onChange={(e) =>
                      setSelectedAlbumId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">None (Single track)</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label htmlFor="track-number">Track #</label>
                  <input
                    id="track-number"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={trackNumber}
                    onChange={(e) =>
                      setTrackNumber(e.target.value ? Number(e.target.value) : "")
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="track-desc">Description (optional)</label>
                  <input
                    id="track-desc"
                    type="text"
                    placeholder="Brief description or mood of the track"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Audio file (MP3, WAV, FLAC - Max 30 MB){" "}
                  {modalMode === "create" && (
                    <span style={{ color: "var(--sw-danger)" }}>*</span>
                  )}
                </label>
                <div
                  className="file-drop-zone"
                  style={formErrors.audio ? { borderColor: "#b42318", background: "#fef3f2" } : {}}
                >
                  <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/flac,audio/*"
                    id="audio-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setAudioFileName(file ? file.name : "");
                      if (formErrors.audio) {
                        setFormErrors((prev) => ({ ...prev, audio: "" }));
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="audio-file-input" className="file-drop-label">
                    <UploadIcon width={24} height={24} />
                    <span>
                      {audioFileName
                        ? `Selected: ${audioFileName}`
                        : modalMode === "edit"
                        ? "Click to replace audio file (optional)"
                        : "Click to choose an audio file"}
                    </span>
                  </label>
                </div>
                {formErrors.audio && (
                  <small className="auth-v2-field-error">
                    <AlertIcon width={12} height={12} />
                    {formErrors.audio}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Cover image (JPG, PNG - Max 5 MB)</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    accept="image/*"
                    id="cover-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setCoverFileName(file ? file.name : "");
                    }}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="cover-file-input" className="file-drop-label">
                    <span>
                      {coverFileName
                        ? `Selected: ${coverFileName}`
                        : modalMode === "edit"
                        ? "Click to replace cover artwork (optional)"
                        : "Select cover artwork (optional)"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="lyrics-file-input" style={{ margin: 0 }}>
                    Lyrics file (.lrc, .txt - Optional)
                  </label>
                  {lyricsContent && (
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--sw-danger, #ef4444)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                      }}
                      onClick={() => {
                        setLyricsContent("");
                        setLyricsFileName("");
                      }}
                    >
                      Remove lyrics
                    </button>
                  )}
                </div>

                <div className="file-drop-zone">
                  <input
                    type="file"
                    accept=".lrc,.txt,.srt,text/plain"
                    id="lyrics-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLyricsFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result;
                        if (typeof content === "string") {
                          setLyricsContent(content);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="lyrics-file-input" className="file-drop-label">
                    <FileTextIcon width={24} height={24} />
                    <span>
                      {lyricsFileName
                        ? `Selected lyrics: ${lyricsFileName}`
                        : lyricsContent
                        ? "Lyrics attached (click to choose a different file)"
                        : "Upload lyrics file (.lrc, .txt - optional)"}
                    </span>
                  </label>
                </div>

                {lyricsContent && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--sw-text-secondary)", fontWeight: 600 }}>
                        Lyrics content & preview:
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--sw-primary)", fontWeight: 600 }}>
                        {lyricsContent.split("\n").filter((l) => l.trim().length > 0).length} lines
                      </span>
                    </div>
                    <textarea
                      id="track-lyrics-editor"
                      rows={4}
                      value={lyricsContent}
                      onChange={(e) => setLyricsContent(e.target.value)}
                      placeholder="Paste or edit synchronized (.lrc) or plain text lyrics..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--sw-border)",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setTrackModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isSaving}
                  id="btn-save-track"
                >
                  {isSaving ? "Saving..." : modalMode === "create" ? "Save as draft" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (UC-19.4) */}
      {deleteConfirmTrack && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !isSaving && setDeleteConfirmTrack(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ color: "var(--sw-danger)" }}>Delete track</h3>
              <button
                className="icon-button"
                onClick={() => setDeleteConfirmTrack(null)}
                disabled={isSaving}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p style={{ margin: "16px 0", color: "var(--sw-text-secondary)" }}>
              Are you sure you want to permanently delete track &quot;
              <b>{deleteConfirmTrack.title}</b>&quot;? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setDeleteConfirmTrack(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                style={{ background: "var(--sw-danger)", borderColor: "var(--sw-danger)" }}
                onClick={handleDeleteTrack}
                disabled={isSaving}
              >
                {isSaving ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Review Modal (UC-19.5) */}
      {submittingNoteTrack && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !isSaving && setSubmittingNoteTrack(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Submit track for Staff review</h3>
              <button
                className="icon-button"
                onClick={() => setSubmittingNoteTrack(null)}
                disabled={isSaving}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p style={{ margin: "12px 0 8px", color: "var(--sw-text-secondary)" }}>
              You are submitting <b>“{submittingNoteTrack.title}”</b> to the moderation queue.
              Once submitted, editing is locked until staff completes review.
            </p>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label htmlFor="submitter-note">Note for reviewer (optional)</label>
              <textarea
                id="submitter-note"
                rows={3}
                placeholder="Mention master source, licenses, or specific credits..."
                value={submitterNote}
                onChange={(e) => setSubmitterNote(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--sw-border)" }}
              />
            </div>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setSubmittingNoteTrack(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleSubmitReview}
                disabled={isSaving}
              >
                {isSaving ? "Submitting..." : "Confirm submission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Details Modal (UC-20) */}
      {rejectionModalTrack && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setRejectionModalTrack(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Track Rejection Details</h3>
              <button
                className="icon-button"
                onClick={() => setRejectionModalTrack(null)}
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p className="rejection-track-name">
              Track: <b>{rejectionModalTrack.trackTitle}</b>
            </p>
            <div className="rejection-box">
              <b style={{ display: "block", marginBottom: "4px", color: "#b42318" }}>
                Staff rejection reason:
              </b>
              <p className="rejection-text">{rejectionModalTrack.rejectionReason}</p>
              {rejectionModalTrack.reviewerNote && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(180, 35, 24, 0.2)" }}>
                  <b style={{ display: "block", marginBottom: "2px", fontSize: "12px", color: "var(--sw-text-secondary)" }}>
                    Reviewer note:
                  </b>
                  <p style={{ margin: 0, fontSize: "13px" }}>{rejectionModalTrack.reviewerNote}</p>
                </div>
              )}
            </div>
            <p className="rejection-help">
              You can edit the audio file and metadata to address this feedback, then resubmit the track.
            </p>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setRejectionModalTrack(null)}
              >
                Close
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  const targetTrack = trackList.find(
                    (t) => t.id === rejectionModalTrack.trackId
                  );
                  setRejectionModalTrack(null);
                  if (targetTrack) {
                    openEditModal(targetTrack);
                  }
                }}
              >
                Edit track
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
