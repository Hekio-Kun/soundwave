import { useRef, type DragEvent } from "react";
import { CloseIcon, FileTextIcon, UploadIcon } from "../icons";

type Props = {
  id: string;
  label: string;
  helperText: string;
  accept: string;
  file: File | null;
  existingFileLabel?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadField({
  id,
  label,
  helperText,
  accept,
  file,
  existingFileLabel,
  error,
  required = false,
  disabled = false,
  onFileChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasExistingFile = Boolean(existingFileLabel) && !file;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFileChange(droppedFile);
  };

  return (
    <div className="studio-upload-control">
      <div className="studio-field-label-row">
        <label id={`${id}-label`} htmlFor={id}>
          {label} {required && <span aria-hidden="true">*</span>}
        </label>
        <small>{helperText}</small>
      </div>

      <input
        ref={inputRef}
        id={id}
        className="studio-file-input"
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      <div
        className={`studio-upload-field${error ? " studio-upload-field--error" : ""}${file || hasExistingFile ? " studio-upload-field--selected" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="studio-upload-field__icon" aria-hidden="true">
          {file || hasExistingFile ? <FileTextIcon width={22} height={22} /> : <UploadIcon width={22} height={22} />}
        </span>

        <span className="studio-upload-field__copy">
          <strong>{file?.name ?? existingFileLabel ?? "Drop a file here"}</strong>
          <span id={`${id}-help`}>
            {file ? `${formatFileSize(file.size)} · Ready to upload` : hasExistingFile ? "Current file will be kept" : "or choose a file from your device"}
          </span>
        </span>

        <span className="studio-upload-field__actions">
          <button
            id={`${id}-button`}
            type="button"
            className="button button-secondary button-small"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {file || hasExistingFile ? "Replace" : "Choose file"}
          </button>
          {file && (
            <button
              type="button"
              className="icon-button studio-upload-remove"
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
              onClick={() => onFileChange(null)}
            >
              <CloseIcon width={15} height={15} />
            </button>
          )}
        </span>
      </div>

      {error && <small id={`${id}-error`} className="auth-v2-field-error">{error}</small>}
    </div>
  );
}
