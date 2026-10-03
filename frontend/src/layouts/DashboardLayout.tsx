import { useEffect, useState, type ReactNode } from "react";
import {
  ClockIcon,
  CloseIcon,
  DashboardIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
} from "../icons";
import type { CurrentUser } from "../types";

type Props = {
  children: ReactNode;
  activeRoute: string;
  user: CurrentUser | null;
  onNavigate: (route: string) => void;
  onLogout: () => void;
};

export function DashboardLayout({ children, activeRoute, user, onNavigate, onLogout }: Props) {
  const isStaff = user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN";
  const roleLabel = isAdmin ? "Administrator" : isStaff ? "Content Moderator" : "Staff";

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileDrawerOpen]);

  const handleNavClick = (route: string) => {
    setMobileDrawerOpen(false);
    onNavigate(route);
  };

  const renderSidebarContent = () => (
    <>
      <div className="ops-sidebar-header">
        <button
          type="button"
          className="ops-shell-brand"
          onClick={() => handleNavClick("/")}
          aria-label="Return to SoundWave Explore"
          title="Return to SoundWave"
        >
          <div className="ops-brand-logo-wrap">
            <img src="/soundwave-logo.png" alt="SoundWave" />
          </div>
          <div className="ops-brand-info">
            <span className="ops-brand-name">SoundWave</span>
            <span className="ops-brand-badge">OPS WORKSPACE</span>
          </div>
        </button>

        {mobileDrawerOpen ? (
          <button
            type="button"
            className="icon-button ops-mobile-close-btn"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            <CloseIcon width={18} height={18} />
          </button>
        ) : null}
      </div>

      {/* Staff Workspace Status Box */}
      <div className="ops-shell-workspace">
        <div className="ops-workspace-top">
          <span className="ops-workspace-eyebrow">
            {isAdmin ? "ADMIN CONTROL" : "MODERATION SHIFT"}
          </span>
          <span className="ops-workspace-live-dot" title="Active session">
            <i /> Live
          </span>
        </div>
        <strong className="ops-workspace-title">
          {isAdmin ? "Platform Administration" : "Track Quality Control"}
        </strong>
        <div className="ops-workspace-role-pill">
          <ShieldIcon width={13} height={13} />
          <span>{roleLabel}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="ops-shell-nav" aria-label="Operations Navigation">
        <span className="ops-nav-heading">
          {isStaff ? "WORKFLOW QUEUE" : "OPERATIONS"}
        </span>

        {isStaff ? (
          <>
            <button
              type="button"
              className={activeRoute.startsWith("/staff") ? "is-active" : ""}
              onClick={() => handleNavClick("/staff/dashboard")}
              title="Moderate pending track submissions"
            >
              <DashboardIcon width={17} height={17} />
              <span>Moderate Pending Tracks</span>
              <span className="ops-nav-badge-fifo">FIFO</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={activeRoute.startsWith("/admin") ? "is-active" : ""}
              onClick={() => handleNavClick("/admin/dashboard")}
            >
              <ShieldIcon width={17} height={17} />
              <span>System Dashboard</span>
            </button>
            <button
              type="button"
              className={activeRoute.startsWith("/staff") ? "is-active" : ""}
              onClick={() => handleNavClick("/staff/dashboard")}
            >
              <DashboardIcon width={17} height={17} />
              <span>Staff Moderation Queue</span>
            </button>
          </>
        )}

        <span className="ops-nav-heading" style={{ marginTop: "16px" }}>
          QUICK ACCESS
        </span>
        <button
          type="button"
          className="ops-nav-subitem"
          onClick={() => handleNavClick("/")}
        >
          <HomeIcon width={16} height={16} />
          <span>Explore SoundWave</span>
        </button>
      </nav>

      {/* Sidebar Footer User Card & Logout */}
      <div className="ops-shell-sidebar-footer">
        {user ? (
          <div className="ops-sidebar-user-card">
            <div className="ops-sidebar-user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <UserIcon width={16} height={16} />
              )}
            </div>
            <div className="ops-sidebar-user-meta">
              <span className="ops-sidebar-user-name" title={user.displayName}>
                {user.displayName}
              </span>
              <span className="ops-sidebar-user-email" title={user.email}>
                {user.email}
              </span>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="ops-sidebar-logout-btn"
          onClick={onLogout}
          title="Log out of SoundWave"
        >
          <LogoutIcon width={15} height={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="ops-shell">
      {/* Desktop Left Sidebar */}
      <aside className="ops-shell-sidebar" aria-label="Desktop navigation">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileDrawerOpen ? (
        <div
          className="ops-drawer-overlay"
          role="presentation"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <aside
            className="ops-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent()}
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="ops-shell-main">
        {/* Topbar */}
        <header className="ops-shell-topbar">
          <div className="ops-topbar-left">
            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="icon-button ops-mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              <MenuIcon width={20} height={20} />
            </button>

            <div className="ops-shell-breadcrumb">
              <span className="ops-breadcrumb-root">SoundWave</span>
              <span className="ops-breadcrumb-sep">/</span>
              <span className="ops-breadcrumb-section">Operations</span>
              <span className="ops-breadcrumb-sep">/</span>
              <strong className="ops-breadcrumb-current">
                {isAdmin ? "System Dashboard" : "Staff Moderation Workspace"}
              </strong>
            </div>
          </div>

          <div className="ops-shell-actions">
            {/* Active Shift Indicator */}
            <div className="ops-topbar-shift-badge">
              <span className="ops-shift-pulse-ring" />
              <ClockIcon width={13} height={13} />
              <span>Shift Active · FIFO Queue</span>
            </div>

            <button
              type="button"
              className="ops-topbar-home-btn"
              onClick={() => onNavigate("/")}
              title="Return to music streaming"
            >
              <HomeIcon width={15} height={15} />
              <span>Public App</span>
            </button>

            {user ? (
              <div className="ops-topbar-user-pill">
                <div className="ops-topbar-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" />
                  ) : (
                    <UserIcon width={14} height={14} />
                  )}
                </div>
                <div className="ops-topbar-user-text">
                  <b>{user.displayName}</b>
                  <small>{roleLabel}</small>
                </div>
                <button
                  type="button"
                  className="ops-topbar-logout-btn"
                  onClick={onLogout}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogoutIcon width={14} height={14} />
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="ops-shell-content">{children}</main>
      </div>
    </div>
  );
}
