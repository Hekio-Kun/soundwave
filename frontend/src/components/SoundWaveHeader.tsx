import { useState, type FormEvent } from "react";
import { CloseIcon, MenuIcon, SearchIcon } from "../icons";

type Props = {
  isAuthenticated: boolean;
  hasPlayer: boolean;
};

const go = (path: string) => {
  window.location.hash = path;
};

export function SoundWaveLogo() {
  return (
    <button className="brand" onClick={() => go("/")} aria-label="Go to SoundWave home">
      <img className="brand-mark" src="/soundwave-logo.png" alt="SoundWave" />
      <span>SoundWave</span>
    </button>
  );
}

export function SoundWaveHeader({ isAuthenticated, hasPlayer }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [query, setQuery] = useState("");
  const activePath = (window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash).split("?")[0];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) go(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <header className={`site-header ${hasPlayer ? "site-header--player" : ""}`}>
      <div className="header-inner">
        <SoundWaveLogo />

        <nav className={`main-nav ${menuOpen ? "main-nav--open" : ""}`} aria-label="Main navigation">
          <a href="#/" className="nav-active" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#/library" onClick={() => setMenuOpen(false)}>Library</a>
          <a href="#/genres" onClick={() => setMenuOpen(false)}>Genres</a>
        </nav>

        <form className={`header-search ${mobileSearch ? "header-search--open" : ""}`} onSubmit={submitSearch} role="search">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tracks, albums, or creators"
            aria-label="Search music"
          />
          {mobileSearch && (
            <button type="button" className="icon-button search-close" onClick={() => setMobileSearch(false)} aria-label="Close search">
              <CloseIcon />
            </button>
          )}
        </form>

        <div className="header-actions">
          <button className="mobile-search-button icon-button" onClick={() => setMobileSearch(true)} aria-label="Open search">
            <SearchIcon />
          </button>
          {isAuthenticated ? (
            <button className="profile-button" onClick={() => go("/profile")} aria-label="Open your profile">
              <span>LA</span>
              <b>Lê An</b>
            </button>
          ) : (
            <>
              <button className={`button button-ghost login-button ${activePath === "/login" ? "auth-header-active" : ""}`} aria-current={activePath === "/login" ? "page" : undefined} onClick={() => go("/login")}>Login</button>
              <button className={`button button-primary signup-button ${activePath === "/register" ? "auth-header-active" : ""}`} aria-current={activePath === "/register" ? "page" : undefined} onClick={() => go("/register")}>Register</button>
            </>
          )}
          <button className="mobile-menu-button icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
