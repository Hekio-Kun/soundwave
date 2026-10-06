import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import {
  studioApi,
  TrackApiError,
  type AlbumOption,
  type GenreOption,
} from "../api/track";
import { MediaUploadField } from "../components/MediaUploadField";
import {
  AlertIcon,
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  FileTextIcon,
  UploadIcon,
} from "../icons";
import {
  readAudioDuration,
  readLyricsFile,
  validateAudioFile,
  validateCoverFile,
  validateLyricsFile,
} from "../utils/trackUpload";

type Props = {
  isAuthenticated: boolean;
  canUpload: boolean;
  onNavigate: (route: string) => void;
};

type FormErrors = Record<string, string>;

export function UploadTrackPage({ isAuthenticated, canUpload, onNavigate }: Props) {
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  const [title, setTitle] = useState("");
  const [genreId, setGenreId] = useState<number>(0);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [trackNumber, setTrackNumber] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadedTrackTitle, setUploadedTrackTitle] = useState("");
  const [uploadedStatus, setUploadedStatus] = useState<"DRAFT" | "PENDING">("DRAFT");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [submitterNote, setSubmitterNote] = useState("");

  useModalScrollLock(confirmModalOpen);

  useEffect(() => {
    if (!confirmModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setConfirmModalOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [confirmModalOpen, submitting]);

  const loadOptions = async () => {
    if (!isAuthenticated || !canUpload) return;
    setLoadingOptions(true);
    setOptionsError("");
    try {
      const [fetchedGenres, fetchedAlbums] = await Promise.all([
        studioApi.getGenres(),
        studioApi.getMyAlbums(),
      ]);
      setGenres(fetchedGenres);
      setAlbums(fetchedAlbums);
      setGenreId((current) => current || fetchedGenres[0]?.id || 0);
    } catch (error: unknown) {
      setOptionsError(error instanceof Error
        ? error.message
        : "Upload options could not be loaded. Please try again.");
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, [isAuthenticated, canUpload]);

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const handleAudioChange = async (file: File | null) => {
    setAudioFile(null);
    setDurationMs(undefined);
    if (!file) {
      clearError("audio");
      return;
    }

    const error = validateAudioFile(file);
    if (error) {
      setFormErrors((current) => ({ ...current, audio: error }));
      return;
    }

    setAudioFile(file);
    clearError("audio");
    setDurationMs(await readAudioDuration(file));
  };

  const handleCoverChange = (file: File | null) => {
    setCoverFile(null);
    if (!file) {
      clearError("cover");
      return;
    }

    const error = validateCoverFile(file);
    if (error) {
      setFormErrors((current) => ({ ...current, cover: error }));
      return;
    }

    setCoverFile(file);
    clearError("cover");
  };

  const handleLyricsChange = async (file: File | null) => {
    setLyricsFile(null);
    setLyrics("");
    if (!file) {
      clearError("lyrics");
      return;
    }

    const validationError = validateLyricsFile(file);
    if (validationError) {
      setFormErrors((current) => ({ ...current, lyrics: validationError }));
      return;
    }

    try {
      setLyrics(await readLyricsFile(file));
      setLyricsFile(file);
      clearError("lyrics");
    } catch (error: unknown) {
      setFormErrors((current) => ({
        ...current,
        lyrics: error instanceof Error ? error.message : "Lyrics file could not be read.",
      }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!title.trim()) errors.title = "Please enter the track title.";
    else if (title.trim().length > 200) errors.title = "Track title cannot exceed 200 characters.";
    if (!genreId) errors.genre = "Please select a music genre.";
    if (!audioFile) errors.audio = "Please select an MP3, WAV or FLAC audio file.";
    else {
      const audioError = validateAudioFile(audioFile);
      if (audioError) errors.audio = audioError;
    }
    if (coverFile) {
      const coverError = validateCoverFile(coverFile);
      if (coverError) errors.cover = coverError;
    }
    if (lyricsFile) {
      const lyricsError = validateLyricsFile(lyricsFile);
      if (lyricsError) errors.lyrics = lyricsError;
    }
    if (description.trim().length > 2000) {
      errors.description = "Description cannot exceed 2000 characters.";
    }
    if (trackNumber !== "" && (!Number.isInteger(trackNumber) || trackNumber < 1 || trackNumber > 32767)) {
      errors.trackNumber = "Track number must be a whole number from 1 to 32767.";
    }
    return errors;
  };

  const focusFirstError = (errors: FormErrors) => {
    const firstField = Object.keys(errors)[0];
    const targetId = firstField === "audio" || firstField === "cover" || firstField === "lyrics"
      ? `${firstField}-upload-button`
      : `upload-track-${firstField}`;
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
  };

  const processUpload = async (submitForReview: boolean, note?: string) => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      focusFirstError(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await studioApi.createDraft({
        title: title.trim(),
        genreId,
        albumId: albumId === "" ? undefined : Number(albumId),
        trackNumber: trackNumber === "" ? undefined : Number(trackNumber),
        description: description.trim() || undefined,
        durationMs,
        lyrics: lyrics.trim() || undefined,
      }, audioFile!, coverFile ?? undefined);

      if (submitForReview && created && created.id) {
        await studioApi.submitForReview(created.id, note);
        setUploadedStatus("PENDING");
      } else {
        setUploadedStatus("DRAFT");
      }
      setUploadedTrackTitle(title.trim());
      document.getElementById("app-scroll-region")?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      if (error instanceof TrackApiError && Object.keys(error.fieldErrors).length > 0) {
        const errors = { ...error.fieldErrors };
        if (errors.media && !errors.audio) errors.audio = errors.media;
        setFormErrors((current) => ({ ...current, ...errors }));
        focusFirstError(errors);
      }
      setSubmitError(error instanceof Error ? error.message : "The track could not be uploaded.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    await processUpload(false);
  };

  const handleStartSubmitReview = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      focusFirstError(errors);
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmSubmitReview = async () => {
    setConfirmModalOpen(false);
    await processUpload(true, submitterNote.trim() || undefined);
  };

  const resetForm = () => {
    setTitle("");
    setGenreId(genres[0]?.id ?? 0);
    setAlbumId("");
    setTrackNumber("");
    setDescription("");
    setAudioFile(null);
    setCoverFile(null);
    setLyricsFile(null);
    setLyrics("");
    setDurationMs(undefined);
    setFormErrors({});
    setSubmitError("");
    setUploadedTrackTitle("");
    setUploadedStatus("DRAFT");
    setConfirmModalOpen(false);
    setCopyrightAgreed(false);
    setSubmitterNote("");
  };

  if (!isAuthenticated || !canUpload) {
    return (
      <div className="upload-track-page">
        <button className="upload-track-back" type="button" onClick={() => onNavigate("/studio")}>
          <ChevronLeftIcon width={17} height={17} /> Back to Content Studio
        </button>
        <section className="upload-track-access-card">
          <span className="upload-track-access-card__icon"><UploadIcon width={28} height={28} /></span>
          <h1>{isAuthenticated ? "Listener access required" : "Log in to upload music"}</h1>
          <p>{isAuthenticated
            ? "Track uploads are available to listener accounts. Staff and administrators can use their dashboards."
            : "Your account is required to save drafts and submit tracks for review."}</p>
          <button className="button button-primary" onClick={() => onNavigate(isAuthenticated ? "/" : "/login")}>
            {isAuthenticated ? "Return to Explore" : "Go to login"}
          </button>
        </section>
      </div>
    );
  }

  if (uploadedTrackTitle) {
    return (
      <div className="upload-track-page">
        <section className="upload-track-success" role="status">
          <span className="upload-track-success__icon"><CheckIcon width={34} height={34} /></span>
          <span className="eyebrow">{uploadedStatus === "PENDING" ? "SUBMITTED FOR REVIEW" : "UPLOAD COMPLETE"}</span>
          <h1>{uploadedStatus === "PENDING" ? "Track queued for staff review" : "Your draft is ready"}</h1>
          <p>
            {uploadedStatus === "PENDING" ? (
              <><strong>{uploadedTrackTitle}</strong> has been submitted to the moderation queue. Staff will examine the audio and metadata before making it publicly accessible.</>
            ) : (
              <><strong>{uploadedTrackTitle}</strong> has been uploaded and saved as a private draft. Review it in Content Studio before submitting it to staff.</>
            )}
          </p>
          <div className="upload-track-success__actions">
            <button className="button button-primary" onClick={() => onNavigate("/studio")}>Open Content Studio</button>
            <button className="button button-secondary" onClick={resetForm}>Upload another track</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="upload-track-page">
      <button className="upload-track-back" type="button" onClick={() => onNavigate("/studio")}>
        <ChevronLeftIcon width={17} height={17} /> Back to Content Studio
      </button>

      <header className="upload-track-hero">
        <span className="upload-track-hero__icon"><UploadIcon width={24} height={24} /></span>
        <div>
          <span className="eyebrow">CONTENT STUDIO</span>
          <h1>Upload a new track</h1>
          <p>Add the audio and track information now. The track stays private as a draft until you submit it for review.</p>
        </div>
      </header>

      {optionsError && (
        <div className="auth-v2-error upload-track-alert" role="alert">
          <span><AlertIcon width={17} height={17} /></span>
          <div><b>Upload form is not ready</b><small>{optionsError}</small></div>
          <button className="button button-secondary button-small" type="button" onClick={() => void loadOptions()}>Try again</button>
        </div>
      )}

      {submitError && (
        <div className="auth-v2-error upload-track-alert" role="alert">
          <span><AlertIcon width={17} height={17} /></span>
          <div><b>Unable to upload this track</b><small>{submitError}</small></div>
        </div>
      )}

      <div className="upload-track-layout">
        <form className="upload-track-form-card" onSubmit={handleSaveDraft} noValidate>
          <div className="upload-track-card-heading">
            <div><span>01</span><h2>Track information</h2></div>
            <small><b>*</b> Required fields</small>
          </div>

          <div className="form-group">
            <label htmlFor="upload-track-title">Track title <span aria-hidden="true">*</span></label>
            <input
              id="upload-track-title"
              value={title}
              maxLength={201}
              autoFocus
              disabled={submitting}
              aria-invalid={Boolean(formErrors.title)}
              aria-describedby={formErrors.title ? "upload-track-title-error" : undefined}
              placeholder="For example: Sunset Memories"
              onChange={(event) => { setTitle(event.target.value); clearError("title"); }}
            />
            {formErrors.title && <small id="upload-track-title-error" className="auth-v2-field-error"><AlertIcon width={12} height={12} />{formErrors.title}</small>}
          </div>

          <div className="studio-form-grid studio-form-grid--equal">
            <div className="form-group">
              <label htmlFor="upload-track-genre">Genre <span aria-hidden="true">*</span></label>
              <select
                id="upload-track-genre"
                value={genreId}
                disabled={submitting || loadingOptions || genres.length === 0}
                aria-invalid={Boolean(formErrors.genre)}
                onChange={(event) => { setGenreId(Number(event.target.value)); clearError("genre"); }}
              >
                {genres.length === 0 && <option value={0}>{loadingOptions ? "Loading genres..." : "Genres unavailable"}</option>}
                {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
              </select>
              {formErrors.genre && <small className="auth-v2-field-error"><AlertIcon width={12} height={12} />{formErrors.genre}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="upload-track-album">Album <span>(optional)</span></label>
              <select id="upload-track-album" value={albumId} disabled={submitting || loadingOptions} onChange={(event) => setAlbumId(event.target.value ? Number(event.target.value) : "")}>
                <option value="">None (single track)</option>
                {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
              </select>
            </div>
          </div>

          <div className="studio-form-grid studio-form-grid--details">
            <div className="form-group">
              <label htmlFor="upload-track-trackNumber">Track number <span>(optional)</span></label>
              <input
                id="upload-track-trackNumber"
                type="number"
                min={1}
                max={32767}
                step={1}
                value={trackNumber}
                disabled={submitting}
                aria-invalid={Boolean(formErrors.trackNumber)}
                placeholder="1"
                onChange={(event) => { setTrackNumber(event.target.value ? Number(event.target.value) : ""); clearError("trackNumber"); }}
              />
              {formErrors.trackNumber && <small className="auth-v2-field-error"><AlertIcon width={12} height={12} />{formErrors.trackNumber}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="upload-track-description">Description <span>(optional)</span></label>
              <textarea
                id="upload-track-description"
                rows={3}
                maxLength={2001}
                value={description}
                disabled={submitting}
                aria-invalid={Boolean(formErrors.description)}
                placeholder="Describe the mood or story behind this track"
                onChange={(event) => { setDescription(event.target.value); clearError("description"); }}
              />
              <div className="upload-track-character-count"><span>{formErrors.description || ""}</span><small>{description.length}/2000</small></div>
            </div>
          </div>

          <div className="upload-track-card-heading upload-track-card-heading--section">
            <div><span>02</span><h2>Media files</h2></div>
          </div>
          <div className="studio-media-grid">
            <MediaUploadField
              id="audio-upload"
              label="Audio file"
              helperText="MP3, WAV or FLAC · Max 30MB"
              accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
              file={audioFile}
              error={formErrors.audio}
              required
              disabled={submitting}
              onFileChange={(file) => void handleAudioChange(file)}
            />
            <MediaUploadField
              id="cover-upload"
              label="Cover artwork"
              helperText="JPG or PNG · Max 5MB"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              file={coverFile}
              error={formErrors.cover}
              disabled={submitting}
              onFileChange={handleCoverChange}
            />
          </div>

          <div className="upload-track-lyrics-field">
            <MediaUploadField
              id="lyrics-upload"
              label="Lyrics file"
              helperText="LRC or TXT · Max 1MB · Optional"
              accept=".lrc,.txt,text/plain"
              file={lyricsFile}
              error={formErrors.lyrics}
              disabled={submitting}
              onFileChange={(file) => void handleLyricsChange(file)}
            />
            {lyrics && (
              <div className="upload-track-lyrics-preview">
                <div><FileTextIcon width={16} height={16} /><b>Lyrics preview</b><span>{lyrics.split("\n").filter((line) => line.trim()).length} lines</span></div>
                <textarea value={lyrics} rows={5} disabled={submitting} onChange={(event) => setLyrics(event.target.value)} aria-label="Lyrics content" />
              </div>
            )}
          </div>

          {submitting && (
            <div className="studio-upload-progress" role="status" aria-live="polite">
              <span className="studio-upload-progress__bar" />
              <div><b>Uploading your track</b><small>Please keep this page open while media is being processed.</small></div>
            </div>
          )}

          <div className="upload-track-actions">
            <button className="button button-secondary" type="button" disabled={submitting} onClick={() => onNavigate("/studio")}>Cancel</button>
            <button
              className="button button-secondary"
              type="submit"
              disabled={submitting || loadingOptions || Boolean(optionsError)}
              id="btn-upload-save-draft"
            >
              Save draft
            </button>
            <button
              className="button button-primary"
              type="button"
              disabled={submitting || loadingOptions || Boolean(optionsError)}
              onClick={handleStartSubmitReview}
              id="btn-upload-submit-review"
            >
              <UploadIcon width={17} height={17} /> {submitting ? "Uploading..." : "Submit for review"}
            </button>
          </div>
        </form>

        <aside className="upload-track-sidebar" aria-label="Upload guidance">
          <section>
            <span className="eyebrow">BEFORE YOU UPLOAD</span>
            <h2>Quick checklist</h2>
            <ul>
              <li><CheckIcon width={16} height={16} /><span>You own the audio or have permission to publish it.</span></li>
              <li><CheckIcon width={16} height={16} /><span>The audio is MP3, WAV or FLAC and no larger than 30MB.</span></li>
              <li><CheckIcon width={16} height={16} /><span>The title, genre and optional album details are accurate.</span></li>
            </ul>
          </section>
          <section className="upload-track-sidebar__note">
            <FileTextIcon width={20} height={20} />
            <div><b>Saved as a private draft or submit for review</b><p>You can keep your track as a private draft for further edits, or submit directly to staff for moderation review.</p></div>
          </section>
        </aside>
      </div>

      {confirmModalOpen && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => !submitting && setConfirmModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit track for Staff review</h3>
              <button className="icon-button" onClick={() => setConfirmModalOpen(false)} disabled={submitting}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <p style={{ margin: "12px 0 8px", color: "var(--sw-text-secondary)" }}>
              You are submitting <b>“{title}”</b> to the moderation queue. Once submitted, editing is locked until staff completes review.
            </p>
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label htmlFor="upload-submitter-note">Note for reviewer (optional)</label>
              <textarea
                id="upload-submitter-note"
                rows={3}
                placeholder="Mention master source, licenses, or specific credits..."
                value={submitterNote}
                onChange={(e) => setSubmitterNote(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--sw-border)" }}
              />
            </div>
            <div style={{ marginTop: "14px", padding: "12px", background: "var(--sw-surface-alt, #f8fafc)", borderRadius: "8px", border: "1px solid var(--sw-border)" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--sw-text-primary)" }}>
                <input
                  type="checkbox"
                  id="chk-copyright-agree"
                  checked={copyrightAgreed}
                  onChange={(e) => setCopyrightAgreed(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <span>
                  I confirm that I own all rights to this audio and artwork, or hold legal authorization to publish it, and agree to SoundWave Community Guidelines.
                </span>
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: "18px" }}>
              <button className="button button-secondary" onClick={() => setConfirmModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={!copyrightAgreed || submitting}
                onClick={() => void handleConfirmSubmitReview()}
                id="btn-confirm-agree-submit"
              >
                {submitting ? "Submitting..." : "Agree & Submit"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
