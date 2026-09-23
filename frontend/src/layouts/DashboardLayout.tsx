import type { ReactNode } from "react";
import { DashboardIcon, HomeIcon, ShieldIcon } from "../icons";
import type { CurrentUser } from "../types";

type Props = {
  children: ReactNode;
  activeRoute: string;
  user: CurrentUser | null;
  onNavigate: (route: string) => void;
  onLogout: () => void;
};

export function DashboardLayout({ children, activeRoute, user, onNavigate, onLogout }: Props) {
  const isAdminArea = activeRoute.startsWith("/admin");
  const dashboardRoute = user?.role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard";
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : user?.role === "STAFF" ? "Moderation Staff" : "Guest";

  return (
    <div className="ops-shell">
      <aside className="ops-shell-sidebar" aria-label="Dashboard navigation">
        <button className="ops-shell-brand" onClick={() => onNavigate("/")} aria-label="Return to SoundWave">
          <img src="/soundwave-logo.png" alt="" />
          <span>SoundWave</span>
        </button>

        <div className="ops-shell-workspace">
          <small>WORKSPACE</small>
          <strong>{isAdminArea ? "Administration" : "Content Moderation"}</strong>
          <span><i /> {roleLabel}</span>
        </div>

        <nav className="ops-shell-nav">
          <span>OVERVIEW</span>
          <button className="is-active" onClick={() => onNavigate(dashboardRoute)}>
            {isAdminArea ? <ShieldIcon width={18} height={18} /> : <DashboardIcon width={18} height={18} />}
            <span>Dashboard</span>
          </button>
          {user?.role === "ADMIN" ? (
            <button className={!isAdminArea ? "is-active" : ""} onClick={() => onNavigate("/staff/dashboard")}>
              <DashboardIcon width={18} height={18} />
              <span>Content Moderation</span>
            </button>
          ) : null}
        </nav>

        <div className="ops-shell-sidebar-footer">
          <button onClick={() => onNavigate("/")}>
            <HomeIcon width={18} height={18} />
            <span>Back to Explore</span>
          </button>
          <small>SoundWave Operations · 2026</small>
        </div>
      </aside>

      <div className="ops-shell-main">
        <header className="ops-shell-topbar">
          <div className="ops-shell-breadcrumb">
            <span>SoundWave</span>
            <i>/</i>
            <strong>{isAdminArea ? "Administration Dashboard" : "Moderation Dashboard"}</strong>
          </div>

          <div className="ops-shell-actions">
            <button className="ops-shell-home-button" onClick={() => onNavigate("/")}>
              <HomeIcon width={16} height={16} />
              Explore Music
            </button>
            {user ? (
              <div className="ops-shell-user">
                <img src={user.avatarUrl} alt="" />
                <span><b>{user.displayName}</b><small>{roleLabel}</small></span>
              </div>
            ) : null}
            {user ? <button className="ops-shell-logout" onClick={onLogout}>Logout</button> : null}
          </div>
        </header>

        <main className="ops-shell-content">{children}</main>
      </div>
    </div>
  );
}
