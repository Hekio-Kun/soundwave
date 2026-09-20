import { CompassIcon, DiscIcon, LibraryIcon, SearchIcon, UploadIcon } from "../icons";

type Props = {
  activeRoute: string;
  onNavigate: (route: string) => void;
};

export function MobileBottomNav({ activeRoute, onNavigate }: Props) {
  const isCurrent = (route: string) => activeRoute === route || (route !== "/" && activeRoute.startsWith(route));

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
      <button
        className={`mobile-nav-item ${activeRoute === "/" || activeRoute === "/home" || isCurrent("/explore") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/")}
      >
        <CompassIcon width={20} height={20} />
        <span>Khám phá</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/genres") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/genres")}
      >
        <DiscIcon width={20} height={20} />
        <span>Thể loại</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/search") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/search")}
      >
        <SearchIcon width={20} height={20} />
        <span>Tìm kiếm</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/favorites") || isCurrent("/playlists") || activeRoute === "/library" ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/library")}
      >
        <LibraryIcon width={20} height={20} />
        <span>Thư viện</span>
      </button>

      <button
        className={`mobile-nav-item ${isCurrent("/studio") ? "mobile-nav-item--active" : ""}`}
        onClick={() => onNavigate("/studio")}
      >
        <UploadIcon width={20} height={20} />
        <span>Studio</span>
      </button>
    </nav>
  );
}
