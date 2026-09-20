import { SoundWaveLogo } from "./SoundWaveHeader";

export function SoundWaveFooter({ hasPlayer }: { hasPlayer: boolean }) {
  return (
    <footer className={`site-footer ${hasPlayer ? "site-footer--player" : ""}`}>
      <div className="container footer-grid">
        <div className="footer-brand"><SoundWaveLogo/><p>Không gian để mọi người khám phá, lắng nghe và chia sẻ âm nhạc.</p><span>SWP391 · SoundWave Team</span></div>
        <div><h3>Khám phá</h3><a href="#/">Bài hát</a><a href="#/?tab=albums">Album</a><a href="#/genres">Thể loại</a></div>
        <div><h3>Tài khoản</h3><a href="#/login">Đăng nhập</a><a href="#/register">Đăng ký</a><a href="#/studio">Đăng tải nhạc</a></div>
        <div><h3>Hỗ trợ</h3><a href="#/terms">Điều khoản</a><a href="#/privacy">Chính sách riêng tư</a><a href="#/contact">Liên hệ</a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 SoundWave. Dự án môn học SWP391.</span><span>Made for music lovers.</span></div>
    </footer>
  );
}
