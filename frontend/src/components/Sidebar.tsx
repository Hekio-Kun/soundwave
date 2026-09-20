import { CompassIcon, DiscIcon, HeartIcon, LibraryIcon, PlusIcon, SearchIcon, UploadIcon } from "../icons";

type Props = {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onCreatePlaylist: () => void;
  isAuthenticated: boolean;
};

export function Sidebar({ activeRoute, onNavigate, onCreatePlaylist, isAuthenticated }: Props) {
  const isCurrent = (route: string) => activeRoute === route || (route !== "/" && activeRoute.startsWith(route));

  return (
    <aside className="app-sidebar" aria-label="Điều hướng chính">
      <div className="sidebar-brand">
        <button className="brand" onClick={() => onNavigate("/")} aria-label="Về trang chủ SoundWave">
          <img className="brand-mark" src="/soundwave-logo.png" alt="SoundWave logo" />
          <span>SoundWave</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <span className="nav-group-title">KHÁM PHÁ</span>
          <button
            className={`nav-item ${activeRoute === "/" || activeRoute === "/home" || isCurrent("/explore") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/")}
          >
            <CompassIcon />
            <span>Khám phá</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/genres") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/genres")}
          >
            <DiscIcon />
            <span>Thể loại</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/search") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/search")}
          >
            <SearchIcon />
            <span>Tìm kiếm</span>
          </button>
        </div>

        <div className="nav-group">
          <span className="nav-group-title">THƯ VIỆN CỦA BẠN</span>
          <button
            className={`nav-item ${activeRoute === "/library" ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/library")}
          >
            <LibraryIcon />
            <span>Tổng quan</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/favorites") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/favorites")}
          >
            <HeartIcon />
            <span>Bài hát yêu thích</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/playlists") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/playlists")}
          >
            <LibraryIcon />
            <span>Danh sách phát</span>
          </button>
          <button
            className={`nav-item ${isCurrent("/studio") ? "nav-item--active" : ""}`}
            onClick={() => onNavigate("/studio")}
          >
            <UploadIcon />
            <span>Content Studio</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-playlist-cta">
        <button className="button button-secondary button-small create-playlist-btn" onClick={onCreatePlaylist}>
          <PlusIcon width={16} height={16} />
          <span>Tạo playlist mới</span>
        </button>
      </div>

      {!isAuthenticated && (
        <div className="sidebar-guest-card">
          <p className="guest-card-title">Tham gia cùng SoundWave</p>
          <p className="guest-card-text">Đăng nhập để tạo playlist và tải lên những bài hát của riêng bạn.</p>
          <button className="button button-primary button-small" onClick={() => onNavigate("/login")}>
            Đăng nhập ngay
          </button>
        </div>
      )}
    </aside>
  );
}
