import { SoundWaveLogo } from "./SoundWaveHeader";

type Props = {
  hasPlayer: boolean;
  isAuthenticated: boolean;
};

export function SoundWaveFooter({ hasPlayer, isAuthenticated }: Props) {
  return (
    <footer className={`site-footer ${hasPlayer ? "site-footer--player" : ""}`}>
      <div className="container footer-grid">
        <div className="footer-brand"><SoundWaveLogo/><p>A place for everyone to discover, listen to, and share music.</p><span>SWP391 · SoundWave Team</span></div>
        <div><h3>Explore</h3><a href="#/">Tracks</a><a href="#/?tab=albums">Albums</a><a href="#/genres">Genres</a></div>
        <div><h3>Account</h3><a href="#/login">Login</a><a href="#/register">Register</a>{isAuthenticated && <a href="#/studio">Upload music</a>}</div>
        <div><h3>Support</h3><a href="#/terms">Terms</a><a href="#/privacy">Privacy policy</a><a href="#/contact">Contact</a></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 SoundWave. SWP391 course project.</span><span>Made for music lovers.</span></div>
    </footer>
  );
}
