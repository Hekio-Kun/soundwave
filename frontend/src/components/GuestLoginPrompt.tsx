import { HeadphonesIcon } from "../icons";

type Props = {
  open: boolean;
  onContinue: () => void;
  onLogin: () => void;
};

export function GuestLoginPrompt({ open, onContinue, onLogin }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="guest-dialog" role="dialog" aria-modal="true" aria-labelledby="guest-dialog-title" aria-describedby="guest-dialog-description">
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
