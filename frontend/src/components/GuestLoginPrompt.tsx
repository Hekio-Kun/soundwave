import { useEffect } from "react";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { HeadphonesIcon } from "../icons";

type Props = {
  open: boolean;
  onContinue: () => void;
  onLogin: () => void;
};

export function GuestLoginPrompt({ open, onContinue, onLogin }: Props) {
  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onContinue();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onContinue}>
      <section
        className="guest-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-dialog-title"
        aria-describedby="guest-dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-icon"><HeadphonesIcon width={26} height={26} /></div>
        <p className="eyebrow">TRACK ENDED</p>
        <h2 id="guest-dialog-title">Save your listening journey</h2>
        <p id="guest-dialog-description">Log in to save favorites, playlists, and listening history. You can also continue listening for free.</p>
        <div className="dialog-actions">
          <button className="button button-primary" onClick={onLogin}>Login</button>
          <button className="button button-secondary" onClick={onContinue} autoFocus>Continue listening</button>
        </div>
      </section>
    </div>
  );
}
