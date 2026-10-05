import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { AlertIcon, CloseIcon } from "../icons";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
};

export function DeleteConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  submitting = false,
}: Props) {
  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1200 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px", width: "100%", padding: "24px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "grid",
              placeItems: "center",
              color: "#DC2626",
            }}
          >
            <AlertIcon width={22} height={22} />
          </div>
          <button
            className="icon-button"
            onClick={onCancel}
            aria-label="Close"
            style={{ width: "32px", height: "32px", border: "none", background: "#f2f4f7", borderRadius: "50%", cursor: "pointer" }}
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px", color: "var(--sw-text)" }}>
          {title}
        </h3>
        <p style={{ fontSize: "13px", color: "var(--sw-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
          {message}
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={onCancel}
            disabled={submitting}
            style={{ height: "40px", padding: "0 18px", borderRadius: "10px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button"
            onClick={onConfirm}
            disabled={submitting}
            style={{
              height: "40px",
              padding: "0 20px",
              borderRadius: "10px",
              background: "#DC2626",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
