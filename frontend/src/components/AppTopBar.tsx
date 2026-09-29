import { useState, type FormEvent } from "react";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, DashboardIcon, SearchIcon, ShieldIcon, UploadIcon, UserIcon } from "../icons";
import type { CurrentUser } from "../types";

type Props = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  unreadNotifications?: number;
};

export function AppTopBar({ user, isAuthenticated, onNavigate, onLogout, unreadNotifications = 2 }: Props) {
  const [query, setQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      onNavigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  const hasDashboardAccess = user?.role === "ADMIN" || user?.role === "STAFF";
  const workspaceRoute = user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "STAFF" ? "/staff/dashboard" : "/studio";
  const workspaceLabel = hasDashboardAccess ? "Open dashboard" : "Upload music";

  return (
    <header className="app-topbar">
      <div className="topbar-nav-controls">
        <button className="topbar-nav-btn" onClick={handleBack} aria-label="Back">
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <button className="topbar-nav-btn" onClick={handleForward} aria-label="Forward">
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>

      <form className="topbar-search" onSubmit={handleSearch} role="search">
        <SearchIcon width={18} height={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks, albums, creators..."
          aria-label="Search music"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setQuery("")}
            aria-label="Clear search keyword"
          >
            <CloseIcon width={14} height={14} />
          </button>
        )}
      </form>

      <div className="topbar-actions">
        <button
          className="button button-ghost button-small topbar-upload-btn"
          onClick={() => onNavigate(workspaceRoute)}
          aria-label={workspaceLabel}
        >
          {user?.role === "ADMIN" ? <ShieldIcon width={16} height={16} /> : user?.role === "STAFF" ? <DashboardIcon width={16} height={16} /> : <UploadIcon width={16} height={16} />}
          <span>{workspaceLabel}</span>
        </button>

        {isAuthenticated && (
          <div className="topbar-notification-wrapper">
            <button
              className="topbar-icon-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="System notifications"
            >
              <BellIcon width={20} height={20} />
              {unreadNotifications > 0 && <span className="notif-badge">{unreadNotifications}</span>}
            </button>

            {notifOpen && (
              <div className="notif-popover">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  <button className="text-button" onClick={() => setNotifOpen(false)}>Close</button>
                </div>
                <div className="notif-list">
                  <div className="notif-item">
                    <p className="notif-title">Track approved</p>
                    <p className="notif-msg">Your track "Sớm Mai Dịu Dàng" was approved by Staff and published.</p>
                    <span className="notif-time">2 hours ago</span>
                  </div>
                  <div className="notif-item notif-item--warning">
                    <p className="notif-title">Track revision requested</p>
                    <p className="notif-msg">"Vũ Điệu Đêm Hè" was rejected because of its audio quality. View details in Content Studio.</p>
                    <span className="notif-time">Yesterday</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && user ? (
          <div className="topbar-user-wrapper">
            <button
              className="topbar-user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="Account menu"
              aria-expanded={userMenuOpen}
            >
              <img src={user.avatarUrl} alt="" className="topbar-avatar" />
              <span className="topbar-username">{user.displayName}</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-info">
                  <p className="dropdown-name">{user.displayName}</p>
                  <p className="dropdown-email">{user.email}</p>
                  <span className="user-role-tag">Role: {user.role}</span>
                </div>
                <hr className="dropdown-divider" />
                {user.role === "ADMIN" || user.role === "STAFF" ? (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate(user.role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard");
                    }}
                  >
                    <DashboardIcon width={16} height={16} />
                    <span>{user.role === "ADMIN" ? "Administration dashboard" : "Moderation dashboard"}</span>
                  </button>
                ) : null}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate("/profile");
                  }}
                >
                  <UserIcon width={16} height={16} />
                  <span>My profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate("/studio");
                  }}
                >
                  <UploadIcon width={16} height={16} />
                  <span>Content Studio</span>
                </button>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item--danger"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth-buttons">
            <button className="button button-ghost button-small" onClick={() => onNavigate("/login")}>
              Login
            </button>
            <button className="button button-primary button-small" onClick={() => onNavigate("/register")}>
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
