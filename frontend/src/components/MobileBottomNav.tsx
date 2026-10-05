import { CompassIcon, DashboardIcon, FilterIcon, LibraryIcon, SearchIcon, UploadIcon } from "../icons";
import type { CurrentUser } from "../types";

type Props = {
  activeRoute: string;
  onNavigate: (route: string) => void;
  userRole?: CurrentUser["role"];
};

export function MobileBottomNav({ activeRoute, onNavigate, userRole }: Props) {
  const isCurrent = (route: string) => activeRoute === route || (route !== "/" && activeRoute.startsWith(route));

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <button
        className={`mobile-nav-item ${activeRoute === "/" || activeRoute === "/home" || isCurrent("/explore") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/")}
      >
        <CompassIcon width={20} height={20} />
        <span>Explore</span>
      </button>

      <button
        className={`mobile-nav-item ${activeRoute.startsWith("/browse") || activeRoute.includes("genre") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/browse")}
      >
        <FilterIcon width={20} height={20} />
        <span>Browse</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/search") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/search")}
      >
        <SearchIcon width={20} height={20} />
        <span>Search</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/favorites") || isCurrent("/playlists") || activeRoute === "/library" ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/library")}
      >
        <LibraryIcon width={20} height={20} />
        <span>Library</span>
      </button>

      {userRole === "ADMIN" || userRole === "STAFF" ? (
        <button
          className={`mobile-nav-item ${isCurrent(userRole === "ADMIN" ? "/admin" : "/staff") ? "mobile-nav-item--active" : ""}`}
          onClick={() => onNavigate(userRole === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard")}
        >
          <DashboardIcon width={20} height={20} />
          <span>Dashboard</span>
        </button>
      ) : (
        <button
          className={`mobile-nav-item ${isCurrent("/studio") ? "mobile-nav-item--active" : ""}`}
          onClick={() => onNavigate("/studio")}
        >
          <UploadIcon width={20} height={20} />
          <span>Studio</span>
        </button>
      )}
    </nav>
  );
}
