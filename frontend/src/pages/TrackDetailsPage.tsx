import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useModalScrollLock } from "../hooks/useModalScrollLock";
import { TrackCard, SectionHeader } from "../components/MusicCards";
import { tracks } from "../data";
import { catalogApi } from "../api/catalog";
import { CheckIcon, FileTextIcon, HeadphonesIcon, HeartFillIcon, HeartIcon, PauseIcon, PlayIcon, PlusIcon, UserIcon } from "../icons";
import type { LandingTrack, Playlist } from "../types";

type Props = {
  trackId: number;
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  onToggleFavorite: (trackId: number) => void;
  isFavorited: boolean;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: number, trackId: number) => void;
};

const formatPlays = (value: number) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function TrackDetailsPage({
  trackId,
  currentTrack,
  playing,
  onPlayTrack,
  onNavigate,
  onToggleFavorite,
  isFavorited,
  playlists,
  onAddToPlaylist,
}: Props) {
  const staticTrack = tracks.find((item) => item.id === trackId);
  const [track, setTrack] = useState<LandingTrack>(staticTrack ?? tracks[0]);

  useEffect(() => {
    if (staticTrack) {
      setTrack(staticTrack);
    }
    catalogApi.getTrackById(trackId)
      .then((data) => {
        if (data) setTrack(data);
      })
      .catch((err) => {
        console.warn("Could not fetch track by id:", err);
      });
  }, [trackId, staticTrack]);
  const isPlayingThis = currentTrack?.id === track.id && playing;
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportCategory, setReportCategory] = useState("copyright");
  const [reportDesc, setReportDesc] = useState("");

  // Rule 4.7: Modal background scroll lock
  useModalScrollLock(Boolean(playlistModalOpen || reportModalOpen));

  // Rule 4.7: Escape key handler
  useEffect(() => {
    if (!playlistModalOpen && !reportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlaylistModalOpen(false);
        setReportModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playlistModalOpen, reportModalOpen]);

  const recommendations = useMemo(() => {
    const sameCreator = tracks.filter((item) => item.id !== track.id && item.creator.userId === track.creator.userId);
    const otherTracks = tracks.filter((item) => item.id !== track.id && item.creator.userId !== track.creator.userId);
    return [...sameCreator, ...otherTracks].slice(0, 5);
  }, [track.creator.userId, track.id]);

  const handleReportSubmit = () => {
    if (reportDesc.trim().length < 10) return;
    setReportSubmitted(true);
    window.setTimeout(() => {
      setReportSubmitted(false);
      setReportModalOpen(false);
      setReportDesc("");
    }, 1800);
  };

  return (
    <div className="track-page-v2">
      <nav className="track-breadcrumb" aria-label="Đường dẫn">
        <button onClick={() => onNavigate("/")}>Khám phá</button><span>/</span><button onClick={() => onNavigate(`/creator/${track.creator.userId}`)}>{track.creator.displayName}</button><span>/</span><b>{track.title}</b>
      </nav>

      <section className="track-showcase">
        <div className="track-showcase-glow" style={{ backgroundImage: `url(${track.coverUrl ?? ""})` }} aria-hidden="true" />
        <div className="track-showcase-visual">
          <button className="track-cover-button" onClick={() => onPlayTrack(track)} aria-label={isPlayingThis ? `Tạm dừng ${track.title}` : `Phát ${track.title}`}>
            <img src={track.coverUrl ?? undefined} alt={`Ảnh bìa ${track.title}`} />
            <span>{isPlayingThis ? <PauseIcon width={28} height={28} /> : <PlayIcon width={28} height={28} />}</span>
          </button>
        </div>

        <div className="track-showcase-content">
          <div className="track-labels"><span>BÀI HÁT</span><span>{track.genreSlug ?? "SoundWave"}</span><span className="is-approved"><CheckIcon width={12} height={12} /> Đã kiểm duyệt</span></div>
          <h1>{track.title}</h1>
          <p className="track-intro">Một sáng tác giàu cảm xúc từ cộng đồng SoundWave, phù hợp cho những khoảnh khắc bạn muốn chậm lại và lắng nghe.</p>

          <button className="track-creator-chip" onClick={() => onNavigate(`/creator/${track.creator.userId}`)}>
            <img src={track.creator.avatarUrl ?? undefined} alt="" />
            <span><small>Được đăng bởi</small><strong>{track.creator.displayName}</strong></span>
          </button>

          <div className="track-stat-row">
            <span><HeadphonesIcon width={16} height={16} /><b>{formatPlays(track.playCount)}</b><small>lượt nghe</small></span>
            <i />
            <span><b>{formatDuration(track.durationMs)}</b><small>thời lượng</small></span>
            <i />
            <span><b>{track.album?.title ?? "Đĩa đơn"}</b><small>phát hành</small></span>
          </div>

          <div className="track-primary-actions">
            <button className="button button-primary button-large" onClick={() => onPlayTrack(track)}>{isPlayingThis ? <PauseIcon /> : <PlayIcon />}<span>{isPlayingThis ? "Tạm dừng" : "Phát bài hát"}</span></button>
            <button className={`track-round-action ${isFavorited ? "is-favorite" : ""}`} onClick={() => onToggleFavorite(track.id)} aria-label={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}>{isFavorited ? <HeartFillIcon /> : <HeartIcon />}</button>
            <button className="track-round-action" onClick={() => setPlaylistModalOpen(true)} aria-label="Thêm vào playlist"><PlusIcon /></button>
          </div>
        </div>
      </section>

      <div className="track-content-grid">
        <section className="track-lyrics-panel">
          <header>
            <div><span className="track-section-icon"><FileTextIcon width={19} height={19} /></span><span><small>LỜI BÀI HÁT</small><h2>{track.title}</h2></span></div>
            <span className="official-lyrics-badge"><CheckIcon width={13} height={13} /> Bản chính thức</span>
          </header>
          {track.lyrics ? <pre>{track.lyrics}</pre> : <div className="track-lyrics-empty"><FileTextIcon /><strong>Chưa có lời bài hát</strong><span>Nội dung sẽ được cập nhật sau khi Staff kiểm duyệt.</span></div>}
          <footer>Lời bài hát được hiển thị ở định dạng văn bản thuần và đã qua kiểm duyệt nội dung.</footer>
        </section>

        <aside className="track-context-column">
          <section className="track-context-card">
            <span className="context-eyebrow">THÔNG TIN PHÁT HÀNH</span>
            <dl>
              <div><dt>Album</dt><dd>{track.album ? <button onClick={() => onNavigate(`/album/${track.album!.id}`)}>{track.album.title}</button> : "Đĩa đơn"}</dd></div>
              <div><dt>Thể loại</dt><dd className="is-capitalized">{track.genreSlug ?? "Chưa phân loại"}</dd></div>
              <div><dt>Trạng thái</dt><dd><span className="context-status"><CheckIcon width={12} height={12} /> Công khai</span></dd></div>
            </dl>
          </section>

          <section className="track-author-card">
            <img src={track.creator.avatarUrl ?? undefined} alt="" />
            <span className="track-section-icon"><UserIcon width={18} height={18} /></span>
            <small>CREATOR</small>
            <h3>{track.creator.displayName}</h3>
            <p>Khám phá thêm những giai điệu và album mới nhất từ creator này.</p>
            <button onClick={() => onNavigate(`/creator/${track.creator.userId}`)}>Xem trang cá nhân</button>
          </section>

          <button className="track-report-button" onClick={() => setReportModalOpen(true)}>Báo cáo nội dung không phù hợp</button>
        </aside>
      </div>

      <section className="track-recommendations">
        <SectionHeader title="Có thể bạn cũng thích" description="Những bài hát tiếp theo dành cho bạn" actionLabel="Khám phá thêm" onAction={() => onNavigate("/")} />
        <div className="sw-track-grid">
          {recommendations.map((item) => <TrackCard key={item.id} track={item} active={currentTrack?.id === item.id} playing={currentTrack?.id === item.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}
        </div>
      </section>

      {playlistModalOpen ? createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setPlaylistModalOpen(false)}>
          <section className="track-dialog" role="dialog" aria-modal="true" aria-labelledby="playlist-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="track-dialog-heading"><span><PlusIcon /></span><div><small>THƯ VIỆN CỦA BẠN</small><h2 id="playlist-dialog-title">Thêm vào playlist</h2></div></div>
            <p>Chọn danh sách bạn muốn thêm “{track.title}”.</p>
            <div className="track-dialog-list">
              {playlists.map((playlist) => <button key={playlist.id} onClick={() => { onAddToPlaylist(playlist.id, track.id); setPlaylistModalOpen(false); }}><img src={playlist.coverUrl} alt="" /><span><b>{playlist.title}</b><small>{playlist.trackCount} bài hát · {playlist.isPrivate ? "Riêng tư" : "Công khai"}</small></span><PlusIcon width={17} height={17} /></button>)}
            </div>
            <button className="button button-secondary" onClick={() => setPlaylistModalOpen(false)}>Đóng</button>
          </section>
        </div>,
        document.body
      ) : null}

      {reportModalOpen ? createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setReportModalOpen(false)}>
          <section className="track-dialog" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onClick={(event) => event.stopPropagation()}>
            {reportSubmitted ? <div className="track-dialog-success"><span><CheckIcon width={27} height={27} /></span><h2>Đã gửi báo cáo</h2><p>Đội ngũ kiểm duyệt sẽ xem xét nội dung này.</p></div> : <>
              <div className="track-dialog-heading"><span>!</span><div><small>HỖ TRỢ CỘNG ĐỒNG</small><h2 id="report-dialog-title">Báo cáo bài hát</h2></div></div>
              <p>Bài hát: <b>{track.title}</b> · {track.creator.displayName}</p>
              <div className="form-group"><label htmlFor="report-category">Lý do</label><select id="report-category" value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option value="copyright">Vi phạm bản quyền</option><option value="inappropriate">Nội dung không phù hợp</option><option value="quality">Chất lượng âm thanh kém</option></select></div>
              <div className="form-group"><label htmlFor="report-description">Mô tả chi tiết</label><textarea id="report-description" rows={4} value={reportDesc} onChange={(event) => setReportDesc(event.target.value)} placeholder="Cung cấp ít nhất 10 ký tự để Staff có đủ thông tin xử lý..." /></div>
              <div className="track-dialog-actions"><button className="button button-secondary" onClick={() => setReportModalOpen(false)}>Hủy</button><button className="button button-primary" disabled={reportDesc.trim().length < 10} onClick={handleReportSubmit}>Gửi báo cáo</button></div>
            </>}
          </section>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
