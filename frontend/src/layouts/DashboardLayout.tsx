import { useEffect, useState, type ReactNode } from "react";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import {
  CloseIcon,
  DashboardIcon,
  DiscIcon,
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

  // Lock scroll across all containers when mobile drawer is open
  useModalScrollLock(mobileDrawerOpen);

  const handleNavClick = (route: string) => {
    setMobileDrawerOpen(false);
    onNavigate(route);
  };

  const renderSidebarContent = () => (
    <>
      <div className="ops-sidebar-header">
        <div
          className="ops-shell-brand"
          aria-label={isAdmin ? "SoundWave administration workspace" : "SoundWave moderation workspace"}
        >
          <div className="ops-brand-logo-wrap">
            <img src="/soundwave-logo.png" alt="SoundWave" />
          </div>
          <div className="ops-brand-info">
            <span className="ops-brand-name">SoundWave</span>
            <span className="ops-brand-badge">{isAdmin ? "ADMINISTRATION" : "MODERATION"}</span>
          </div>
        </div>

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
            {isAdmin ? "ADMIN" : "MODERATION"}
          </span>
          <span className="ops-workspace-live-dot" title="Active session">
            <i /> Live
          </span>
        </div>
        <strong className="ops-workspace-title">
          {isAdmin ? "Platform Admin" : "Track Moderation"}
        </strong>
      </div>

      {/* Navigation Menu */}
      <nav className="ops-shell-nav" aria-label="Operations Navigation">
        <span className="ops-nav-heading">MENU</span>

        {isStaff ? (
          <>
            <button
              type="button"
              className={activeRoute.startsWith("/staff") ? "is-active" : ""}
              onClick={() => handleNavClick("/staff/dashboard")}
              title="Pending track submissions"
            >
              <DashboardIcon width={17} height={17} />
              <span>Pending Tracks</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={activeRoute === "/admin" || activeRoute === "/admin/dashboard" ? "is-active" : ""}
              onClick={() => handleNavClick("/admin/dashboard")}
            >
              <ShieldIcon width={17} height={17} />
              <span>System Dashboard</span>
            </button>
            <button
              type="button"
              className={activeRoute === "/admin/genres" ? "is-active" : ""}
              onClick={() => handleNavClick("/admin/genres")}
            >
              <DiscIcon width={17} height={17} />
              <span>Genre Management</span>
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
              <strong className="ops-breadcrumb-current">
                {isAdmin ? "Admin" : "Moderation"}
              </strong>
            </div>
          </div>

          <div className="ops-shell-actions">
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
