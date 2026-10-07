import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../api/client";
import type { AdminGenre, GenreInput } from "../api/adminGenres";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { AlertIcon, CloseIcon } from "../icons";

type Props = {
  open: boolean;
  genre: AdminGenre | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: GenreInput) => Promise<void>;
};

type FieldErrors = Partial<Record<keyof GenreInput, string>>;

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GenreFormModal({ open, genre, submitting, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setName(genre?.name ?? "");
    setSlug(genre?.slug ?? "");
    setDescription(genre?.description ?? "");
    setFieldErrors({});
    setFormError("");
  }, [open, genre]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const clearFieldError = (field: keyof GenreInput) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    setFormError("");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    clearFieldError("name");
    if (!genre) {
      setSlug(createSlug(value));
      clearFieldError("slug");
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Please enter a genre name.";
    else if (name.trim().length > 100) errors.name = "Genre name must not exceed 100 characters.";
    if (!slug.trim()) errors.slug = "Please enter a genre slug.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errors.slug = "Use lowercase letters, numbers, and single hyphens only.";
    } else if (slug.trim().length > 100) errors.slug = "Genre slug must not exceed 100 characters.";
    if (description.trim().length > 1000) errors.description = "Description must not exceed 1000 characters.";
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please review the highlighted fields.");
      const firstField = Object.keys(errors)[0];
      window.setTimeout(() => document.getElementById(`genre-${firstField}`)?.focus(), 0);
      return;
    }

    try {
      await onSubmit({ name: name.trim(), slug: slug.trim(), description: description.trim() });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors ?? {});
        setFormError(error.message);
      } else {
        setFormError("Unable to save this genre. Please try again.");
      }
    }
  };

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={() => !submitting && onClose()}>
      <section
        className="modal-card genre-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="genre-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">GENRE MANAGEMENT</span>
            <h2 id="genre-form-title">{genre ? "Edit genre" : "Create genre"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={submitting} aria-label="Close genre form">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <form className="modal-form" noValidate onSubmit={handleSubmit}>
          {formError ? <div className="genre-form-alert" role="alert"><AlertIcon width={16} height={16} /><span>{formError}</span></div> : null}

          <div className="form-group">
            <label htmlFor="genre-name">Genre name <span aria-hidden="true">*</span></label>
            <input id="genre-name" value={name} onChange={(event) => handleNameChange(event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "genre-name-error" : undefined} disabled={submitting} autoFocus />
            {fieldErrors.name ? <small id="genre-name-error" className="auth-v2-field-error">{fieldErrors.name}</small> : null}
          </div>

          <div className="form-group">
            <label htmlFor="genre-slug">Slug <span aria-hidden="true">*</span></label>
            <input id="genre-slug" value={slug} onChange={(event) => { setSlug(createSlug(event.target.value)); clearFieldError("slug"); }} aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "genre-slug-error genre-slug-help" : "genre-slug-help"} disabled={submitting} />
            <small id="genre-slug-help" className="genre-field-help">Used in public catalog URLs and filters.</small>
            {fieldErrors.slug ? <small id="genre-slug-error" className="auth-v2-field-error">{fieldErrors.slug}</small> : null}
          </div>

          <div className="form-group">
            <div className="form-label-row"><label htmlFor="genre-description">Description</label><small>{description.length}/1000</small></div>
            <textarea id="genre-description" value={description} onChange={(event) => { setDescription(event.target.value); clearFieldError("description"); }} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "genre-description-error" : undefined} disabled={submitting} rows={5} />
            {fieldErrors.description ? <small id="genre-description-error" className="auth-v2-field-error">{fieldErrors.description}</small> : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={submitting}>{submitting ? "Saving..." : genre ? "Save changes" : "Create genre"}</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
