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
  const roleLabel = user?.role === "ADMIN" ? "Quản trị viên" : user?.role === "STAFF" ? "Nhân viên kiểm duyệt" : "Khách";

  return (
    <div className="ops-shell">
      <aside className="ops-shell-sidebar" aria-label="Điều hướng dashboard">
        <button className="ops-shell-brand" onClick={() => onNavigate("/")} aria-label="Về SoundWave">
          <img src="/soundwave-logo.png" alt="" />
          <span>SoundWave</span>
        </button>

        <div className="ops-shell-workspace">
          <small>KHÔNG GIAN LÀM VIỆC</small>
          <strong>{isAdminArea ? "Administration" : "Content Moderation"}</strong>
          <span><i /> {roleLabel}</span>
        </div>

        <nav className="ops-shell-nav">
          <span>TỔNG QUAN</span>
          <button className="is-active" onClick={() => onNavigate(dashboardRoute)}>
            {isAdminArea ? <ShieldIcon width={18} height={18} /> : <DashboardIcon width={18} height={18} />}
            <span>Dashboard</span>
          </button>
          {user?.role === "ADMIN" ? (
            <button className={!isAdminArea ? "is-active" : ""} onClick={() => onNavigate("/staff/dashboard")}>
              <DashboardIcon width={18} height={18} />
              <span>Trung tâm kiểm duyệt</span>
            </button>
          ) : null}
        </nav>

        <div className="ops-shell-sidebar-footer">
          <button onClick={() => onNavigate("/")}>
            <HomeIcon width={18} height={18} />
            <span>Về trang nghe nhạc</span>
          </button>
          <small>SoundWave Operations · 2026</small>
        </div>
      </aside>

      <div className="ops-shell-main">
        <header className="ops-shell-topbar">
          <div className="ops-shell-breadcrumb">
            <span>SoundWave</span>
            <i>/</i>
            <strong>{isAdminArea ? "Dashboard quản trị" : "Dashboard kiểm duyệt"}</strong>
          </div>

          <div className="ops-shell-actions">
            <button className="ops-shell-home-button" onClick={() => onNavigate("/")}>
              <HomeIcon width={16} height={16} />
              Trang nghe nhạc
            </button>
            {user ? (
              <div className="ops-shell-user">
                <img src={user.avatarUrl} alt="" />
                <span><b>{user.displayName}</b><small>{roleLabel}</small></span>
              </div>
            ) : null}
            {user ? <button className="ops-shell-logout" onClick={onLogout}>Đăng xuất</button> : null}
          </div>
        </header>

        <main className="ops-shell-content">{children}</main>
      </div>
    </div>
  );
}
