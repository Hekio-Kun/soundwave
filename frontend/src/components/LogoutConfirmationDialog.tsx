import { useEffect } from "react";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { AlertIcon } from "../icons";

type Props = {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmationDialog({ open, submitting, onCancel, onConfirm }: Props) {
  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onCancel();
      }}
    >
      <section
        className="logout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <div className="logout-dialog-icon"><AlertIcon width={25} height={25} /></div>
        <p className="eyebrow">ACCOUNT SESSION</p>
        <h2 id="logout-dialog-title">Log out of SoundWave?</h2>
        <p id="logout-dialog-description">
          You will need to enter your email and password again to access your personal library.
        </p>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={submitting} autoFocus>
            Cancel
          </button>
          <button className="button logout-dialog-confirm" type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Logging out…" : "Log out"}
          </button>
        </div>
      </section>
    </div>
  );
}
