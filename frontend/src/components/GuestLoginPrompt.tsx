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
        <p className="eyebrow">BÀI HÁT ĐÃ KẾT THÚC</p>
        <h2 id="guest-dialog-title">Lưu lại hành trình âm nhạc của bạn</h2>
        <p id="guest-dialog-description">Đăng nhập để lưu bài yêu thích, playlist và lịch sử nghe. Bạn vẫn có thể tiếp tục nghe miễn phí.</p>
        <div className="dialog-actions">
          <button className="button button-primary" onClick={onLogin}>Đăng nhập</button>
          <button className="button button-secondary" onClick={onContinue} autoFocus>Tiếp tục nghe</button>
        </div>
      </section>
    </div>
  );
}
