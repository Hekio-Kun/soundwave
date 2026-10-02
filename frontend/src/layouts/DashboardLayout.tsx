import type { ReactNode } from "react";
import {
  ClockIcon,
  DashboardIcon,
  HomeIcon,
  LogoutIcon,
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

  return (
    <div className="ops-shell">
      {/* Sleek Modern Left Sidebar */}
      <aside className="ops-shell-sidebar" aria-label="Dashboard navigation">
        <div className="ops-sidebar-header">
          <button
            className="ops-shell-brand"
            onClick={() => onNavigate("/")}
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
        <nav className="ops-shell-nav">
          <span className="ops-nav-heading">
            {isStaff ? "WORKFLOW QUEUE" : "OPERATIONS"}
          </span>

          {isStaff ? (
            <>
              <button
                className={activeRoute.startsWith("/staff") ? "is-active" : ""}
                onClick={() => onNavigate("/staff/dashboard")}
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
                className={activeRoute.startsWith("/admin") ? "is-active" : ""}
                onClick={() => onNavigate("/admin/dashboard")}
              >
                <ShieldIcon width={17} height={17} />
                <span>System Dashboard</span>
              </button>
              <button
                className={activeRoute.startsWith("/staff") ? "is-active" : ""}
                onClick={() => onNavigate("/staff/dashboard")}
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
            onClick={() => onNavigate("/")}
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
      </aside>

      {/* Main Content Area */}
      <div className="ops-shell-main">
        {/* Topbar */}
        <header className="ops-shell-topbar">
          <div className="ops-shell-breadcrumb">
            <span className="ops-breadcrumb-root">SoundWave</span>
            <span className="ops-breadcrumb-sep">/</span>
            <span className="ops-breadcrumb-section">Operations</span>
            <span className="ops-breadcrumb-sep">/</span>
            <strong className="ops-breadcrumb-current">
              {isAdmin ? "System Dashboard" : "Staff Moderation Workspace"}
            </strong>
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
