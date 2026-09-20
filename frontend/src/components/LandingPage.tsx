import { useEffect, useState } from "react";
import { albums, featuredCreators, genres, heroCovers, tracks } from "../data";
import { ArrowIcon, CheckIcon, HeadphonesIcon, MoreIcon, PauseIcon, PlayIcon, UploadIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlay: (track: LandingTrack) => void;
  isAuthenticated: boolean;
};

const go = (path: string) => {
  window.location.hash = path;
};

const formatPlays = (value: number) => new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const formatDuration = (ms: number) => `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, "0")}`;

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: () => void }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <button className="section-link" onClick={action}>Xem tất cả <ArrowIcon /></button>}
    </div>
  );
}

function TrackCard({ track, active, playing, onPlay }: { track: LandingTrack; active: boolean; playing: boolean; onPlay: () => void }) {
  return (
    <article className={`track-card ${active ? "track-card--active" : ""}`}>
      <div className="cover-wrap">
        <img src={track.coverUrl ?? undefined} alt={`Ảnh bìa bài hát ${track.title}`} loading="lazy" />
        <button className="cover-play" onClick={onPlay} aria-label={active && playing ? `Tạm dừng ${track.title}` : `Phát ${track.title}`}>
          {active && playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        {active && playing && <span className="playing-bars" aria-label="Đang phát"><i/><i/><i/></span>}
      </div>
      <a className="track-title" href={`#/track/${track.id}`}>{track.title}</a>
      <a className="track-creator" href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a>
      <span className="track-plays"><HeadphonesIcon /> {formatPlays(track.playCount)} lượt nghe</span>
    </article>
  );
}

function SkeletonHome() {
  return (
    <main className="page-main" aria-busy="true">
      <div className="skeleton skeleton-hero" />
      <section className="page-section"><div className="skeleton skeleton-heading"/><div className="track-grid">{Array.from({ length: 6 }).map((_, index) => <div className="skeleton skeleton-card" key={index}/>)}</div></section>
    </main>
  );
}

export function LandingPage({ currentTrack, playing, onPlay, isAuthenticated }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("state");
    const timer = window.setTimeout(() => {
      if (requested === "error") setStatus("error");
      else if (requested === "empty") setStatus("empty");
      else setStatus("ready");
    }, 550);
    return () => window.clearTimeout(timer);
  }, []);

  if (status === "loading") return <SkeletonHome />;

  if (status === "error") {
    return <main className="state-page"><div className="state-icon">!</div><h1>Chưa thể tải âm nhạc</h1><p>Kết nối đang gián đoạn. Hãy thử tải lại nội dung.</p><button className="button button-primary" onClick={() => setStatus("ready")}>Thử lại</button></main>;
  }

  if (status === "empty") {
    return <main className="state-page"><div className="state-icon"><HeadphonesIcon /></div><h1>SoundWave đang chuẩn bị lên sóng</h1><p>Những bản nhạc đầu tiên sẽ sớm xuất hiện tại đây.</p><button className="button button-primary" onClick={() => go(isAuthenticated ? "/studio" : "/login")}>Đăng tải bài hát đầu tiên</button></main>;
  }

  const approvedTracks = tracks.filter((track) => track.publicationStatus === "APPROVED");

  return (
    <main className="page-main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker"><span><i/><i/><i/><i/></span> Không gian âm nhạc của cộng đồng</div>
          <h1>Âm nhạc cho mọi <span>khoảnh khắc.</span></h1>
          <p>Khám phá, lắng nghe và chia sẻ những giai điệu mới cùng cộng đồng SoundWave.</p>
          <div className="hero-actions">
            <button className="button button-primary button-large" onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}><PlayIcon /> Nghe ngay</button>
            <button className="button button-secondary button-large" onClick={() => go(isAuthenticated ? "/studio" : "/login")}><UploadIcon /> Đăng tải bài hát</button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack">{featuredCreators.slice(0, 3).map((creator) => <img src={creator.avatarUrl} alt="" key={creator.userId}/>)}</div>
            <span><b>Hơn 1.200 creator</b><small>đang chia sẻ âm nhạc mỗi ngày</small></span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Minh họa bộ sưu tập âm nhạc">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          {heroCovers.map((cover, index) => <img className={`hero-cover hero-cover-${index + 1}`} src={cover} alt="Ảnh bìa âm nhạc minh họa" key={cover}/>) }
          <div className="hero-mini-player">
            <div className="mini-now"><span>ĐANG PHÁT</span><i/><i/><i/></div>
            <div className="mini-track">
              <img src={approvedTracks[0].coverUrl ?? undefined} alt=""/>
              <div><b>{approvedTracks[0].title}</b><span>{approvedTracks[0].creator.displayName}</span></div>
              <button onClick={() => onPlay(approvedTracks[0])} aria-label={`Phát ${approvedTracks[0].title}`}><PlayIcon /></button>
            </div>
            <div className="mini-progress"><i /></div>
            <div className="mini-times"><span>1:24</span><span>6:08</span></div>
          </div>
        </div>
      </section>

      <section className="page-section container" id="trending">
        <SectionHeading eyebrow="ĐƯỢC NGHE NHIỀU NHẤT" title="Đang thịnh hành" description="Những giai điệu được cộng đồng SoundWave yêu thích tuần này." action={() => go("/explore?sort=trending")} />
        <div className="track-grid horizontal-on-mobile">
          {approvedTracks.slice(0, 6).map((track) => <TrackCard key={track.id} track={track} active={currentTrack?.id === track.id} playing={playing} onPlay={() => onPlay(track)} />)}
        </div>
      </section>

      <section className="genre-band">
        <div className="page-section container">
          <SectionHeading eyebrow="TÌM ĐÚNG NHỊP CỦA BẠN" title="Khám phá theo thể loại" />
          <div className="genre-grid">
            {genres.map((genre, index) => (
              <button className="genre-card" key={genre.id} onClick={() => go(`/explore?genre=${genre.slug}`)} style={{ background: genre.color, color: genre.accent }}>
                <span className="genre-index">0{index + 1}</span><b>{genre.name}</b><span className="genre-wave"><i/><i/><i/><i/><i/></span><ArrowIcon />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section container releases-section">
        <SectionHeading eyebrow="VỪA LÊN SÓNG" title="Mới phát hành" description="Các bài hát vừa được duyệt và phát hành trên SoundWave." action={() => go("/explore?sort=newest")} />
        <div className="release-list">
          {approvedTracks.slice(2, 8).map((track, index) => (
            <article className={`track-row ${currentTrack?.id === track.id ? "track-row--active" : ""}`} key={track.id}>
              <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
              <button className="row-cover" onClick={() => onPlay(track)} aria-label={currentTrack?.id === track.id && playing ? `Tạm dừng ${track.title}` : `Phát ${track.title}`}>
                <img src={track.coverUrl ?? undefined} alt="" />
                <span>{currentTrack?.id === track.id && playing ? <PauseIcon/> : <PlayIcon/>}</span>
              </button>
              <div className="row-song"><a href={`#/track/${track.id}`}>{track.title}</a><a href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a></div>
              <a className="row-album" href={track.album ? `#/album/${track.album.id}` : "#/explore"}>{track.album?.title ?? "Đĩa đơn"}</a>
              <span className="row-duration">{formatDuration(track.durationMs)}</span>
              <button className="icon-button" aria-label={`Thêm tùy chọn cho ${track.title}`}><MoreIcon /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section container">
        <SectionHeading eyebrow="NGHE TRỌN CÂU CHUYỆN" title="Album nổi bật" action={() => go("/albums")} />
        <div className="album-grid horizontal-on-mobile">
          {albums.map((album) => (
            <a className="album-card" href={`#/album/${album.id}`} key={album.id}>
              <div className="album-art"><img src={album.coverUrl} alt={`Ảnh bìa album ${album.title}`} /><span><PlayIcon /></span></div>
              <b>{album.title}</b><span>{album.creatorName} · {album.releaseYear}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="page-section container creator-section">
        <SectionHeading eyebrow="GƯƠNG MẶT CỘNG ĐỒNG" title="Creator nổi bật" description="Gặp gỡ những người đang tạo nên thanh âm riêng trên SoundWave." />
        <div className="creator-grid">
          {featuredCreators.map((creator) => (
            <article className="creator-card" key={creator.userId}>
              <img src={creator.avatarUrl} alt={`Avatar của ${creator.displayName}`} />
              <div><h3>{creator.displayName}</h3><p>{creator.bio}</p><span>{creator.publishedTracks} bài đã phát hành</span></div>
              <button className="button button-small button-secondary" onClick={() => go(`/creator/${creator.userId}`)}>Xem hồ sơ</button>
            </article>
          ))}
        </div>
      </section>

      <section className="creator-cta container">
        <div className="cta-decoration" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/></div>
        <div className="cta-content">
          <p className="eyebrow">CHIA SẺ ÂM NHẠC CỦA BẠN</p>
          <h2>Bạn có một bài hát muốn được lắng nghe?</h2>
          <p>Mọi thành viên SoundWave đều có thể đăng tải tác phẩm và tìm thấy người nghe của mình.</p>
          <div className="cta-steps"><span><CheckIcon/> Upload</span><i/><span><CheckIcon/> Gửi kiểm duyệt</span><i/><span><CheckIcon/> Phát hành</span></div>
        </div>
        <button className="button button-white button-large" onClick={() => go(isAuthenticated ? "/studio" : "/login")}><UploadIcon/> Đăng tải bài hát</button>
      </section>
    </main>
  );
}
