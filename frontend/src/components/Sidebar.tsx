import { CompassIcon, DashboardIcon, DiscIcon, FilterIcon, HeartIcon, LibraryIcon, PlusIcon, SearchIcon, ShieldIcon, UploadIcon } from "../icons";
import type { CurrentUser } from "../types";

type Props = {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onCreatePlaylist: () => void;
  isAuthenticated: boolean;
  userRole?: CurrentUser["role"];
};

export function Sidebar({ activeRoute, onNavigate, onCreatePlaylist, isAuthenticated, userRole }: Props) {
  const isCurrent = (route: string) => activeRoute === route || (route !== "/" && activeRoute.startsWith(route));

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <button className="brand" onClick={() => onNavigate("/")} aria-label="Go to SoundWave home">
          <img className="brand-mark" src="/soundwave-logo.png" alt="SoundWave logo" />
          <span>SoundWave</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {userRole === "ADMIN" ? (
          <div className="nav-group">
            <span className="nav-group-title">SYSTEM ADMINISTRATION</span>
            <button
              className={`nav-item ${isCurrent("/admin") ? "nav-item--active" : ""}`}
              onClick={() => onNavigate("/admin/dashboard")}
            >
              <ShieldIcon />
              <span>Administration overview</span>
              <small className="sidebar-badge">ADMIN</small>
            </button>
            <button
              className={`nav-item ${isCurrent("/staff") ? "nav-item--active" : ""}`}
              onClick={() => onNavigate("/staff/dashboard")}
            >
              <DashboardIcon />
              <span>Content moderation</span>
            </button>
          </div>
        ) : userRole === "STAFF" ? (
          <div className="nav-group">
            <span className="nav-group-title">STAFF WORKSPACE</span>
            <button
              className={`nav-item ${isCurrent("/staff") ? "nav-item--active" : ""}`}
              onClick={() => onNavigate("/staff/dashboard")}
            >
              <DashboardIcon />
              <span>Moderation dashboard</span>
              <small className="sidebar-badge">STAFF</small>
            </button>
          </div>
        ) : null}

        <div className="nav-group">
          <span className="nav-group-title">DISCOVER</span>
          <button
            className={`nav-item ${activeRoute === "/" || activeRoute === "/home" || (activeRoute.startsWith("/explore") && !activeRoute.includes("genre")) ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/")}
          >
            <CompassIcon />
            <span>Explore</span>
          </button>
          <button
            className={`nav-item ${activeRoute.startsWith("/browse") || activeRoute.includes("genre") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/browse")}
          >
            <FilterIcon width={18} height={18} />
            <span>Browse Catalog</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/search") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/search")}
          >
            <SearchIcon />
            <span>Search</span>
          </button>
        </div>

        <div className="nav-group">
          <span className="nav-group-title">YOUR LIBRARY</span>
          <button
            className={`nav-item ${activeRoute === "/library" ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/library")}
          >
            <LibraryIcon />
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/favorites") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/favorites")}
          >
            <HeartIcon />
            <span>Favorite tracks</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/playlists") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/playlists")}
          >
            <LibraryIcon />
            <span>Playlists</span>
          </button>
          {isAuthenticated && (
            <button
              className={`nav-item ${isCurrent("/studio") ? "nav-item--active" : ""}`}
              onClick={() => onNavigate("/studio")}
            >
              <UploadIcon />
              <span>Content Studio</span>
            </button>
          )}
        </div>
      </nav>

      <div className="sidebar-playlist-cta">
        <button className="button button-secondary button-small create-playlist-btn" onClick={onCreatePlaylist}>
          <PlusIcon width={16} height={16} />
          <span>Create playlist</span>
        </button>
      </div>

      {!isAuthenticated && (
        <div className="sidebar-guest-card">
          <p className="guest-card-title">Join SoundWave</p>
          <p className="guest-card-text">Log in to create playlists and upload your own tracks.</p>
          <button className="button button-primary button-small" onClick={() => onNavigate("/login")}>
            Login now
          </button>
        </div>
      )}
    </aside>
  );
}
