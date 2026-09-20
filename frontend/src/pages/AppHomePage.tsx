import { useState } from "react";
import { albums, featuredCreators, genres, tracks } from "../data";
import { ArrowIcon, HeadphonesIcon, HeartIcon, MoreIcon, PauseIcon, PlayIcon } from "../icons";
import type { FeaturedAlbum, FeaturedCreator, LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  onToggleFavorite: (trackId: number) => void;
  favoriteIds: number[];
};

const formatPlays = (value: number) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function AppHomePage({
  currentTrack,
  playing,
  onPlayTrack,
  onNavigate,
  onToggleFavorite,
  favoriteIds,
}: Props) {
  const approvedTracks = tracks.filter((t) => t.publicationStatus === "APPROVED");
  const heroTrack = approvedTracks[0];

  return (
    <div className="app-home-page">
      {/* 1. Hero Featured Music Banner */}
      <section className="app-hero-banner">
        <div className="hero-banner-content">
          <span className="hero-banner-tag">GỢI Ý HÔM NAY</span>
          <h1 className="hero-banner-title">{heroTrack.title}</h1>
          <p className="hero-banner-subtitle">
            Sáng tác bởi <b>{heroTrack.creator.displayName}</b> · {heroTrack.album?.title ?? "Đĩa đơn"}
          </p>
          <div className="hero-banner-actions">
            <button
              className="button button-primary button-large"
              onClick={() => onPlayTrack(heroTrack)}
            >
              {currentTrack?.id === heroTrack.id && playing ? <PauseIcon /> : <PlayIcon />}
              <span>{currentTrack?.id === heroTrack.id && playing ? "Tạm dừng" : "Nghe ngay"}</span>
            </button>
            <button
              className="button button-secondary button-large"
              onClick={() => onNavigate(`/track/${heroTrack.id}`)}
            >
              Xem chi tiết
            </button>
          </div>
        </div>
        <div className="hero-banner-art" onClick={() => onPlayTrack(heroTrack)}>
          <img src={heroTrack.coverUrl ?? undefined} alt={heroTrack.title} />
          <div className="hero-banner-play-overlay">
            {currentTrack?.id === heroTrack.id && playing ? <PauseIcon width={32} height={32} /> : <PlayIcon width={32} height={32} />}
          </div>
        </div>
      </section>

      {/* 2. Trending Section */}
      <section className="app-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Đang thịnh hành</h2>
            <p className="section-subtitle">Những giai điệu được nghe nhiều nhất trên SoundWave tuần này</p>
          </div>
          <button className="section-see-all" onClick={() => onNavigate("/explore?sort=trending")}>
            <span>Xem tất cả</span>
            <ArrowIcon width={16} height={16} />
          </button>
        </div>

        <div className="app-track-grid">
          {approvedTracks.slice(0, 5).map((track) => {
            const isPlayingThis = currentTrack?.id === track.id && playing;
            const isCurrent = currentTrack?.id === track.id;
            return (
              <article key={track.id} className={`music-card ${isCurrent ? "music-card--active" : ""}`}>
                <div className="music-card-cover" onClick={() => onPlayTrack(track)}>
                  <img src={track.coverUrl ?? undefined} alt={track.title} loading="lazy" />
                  <button
                    className="music-card-play-btn"
                    aria-label={isPlayingThis ? `Tạm dừng ${track.title}` : `Phát ${track.title}`}
                  >
                    {isPlayingThis ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
                  </button>
                  {isPlayingThis && (
                    <span className="card-playing-wave">
                      <i /><i /><i />
                    </span>
                  )}
                </div>
                <a
                  className="music-card-title"
                  href={`#/track/${track.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/track/${track.id}`);
                  }}
                >
                  {track.title}
                </a>
                <a
                  className="music-card-creator"
                  href={`#/creator/${track.creator.userId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/creator/${track.creator.userId}`);
                  }}
                >
                  {track.creator.displayName}
                </a>
                <span className="music-card-meta">
                  <HeadphonesIcon width={12} height={12} /> {formatPlays(track.playCount)}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. New Releases Section (List layout) */}
      <section className="app-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mới phát hành</h2>
            <p className="section-subtitle">Các sáng tác vừa được kiểm duyệt và đưa lên kệ âm nhạc</p>
          </div>
          <button className="section-see-all" onClick={() => onNavigate("/explore?sort=newest")}>
            <span>Xem tất cả</span>
            <ArrowIcon width={16} height={16} />
          </button>
        </div>

        <div className="new-release-table">
          {approvedTracks.slice(1, 7).map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isPlayingThis = isCurrent && playing;
            const isFavorited = favoriteIds.includes(track.id);

            return (
              <div
                key={track.id}
                className={`table-track-row ${isCurrent ? "table-track-row--active" : ""}`}
              >
                <span className="row-index">{String(idx + 1).padStart(2, "0")}</span>

                <div className="row-thumbnail" onClick={() => onPlayTrack(track)}>
                  <img src={track.coverUrl ?? undefined} alt="" />
                  <button className="row-hover-play" aria-label={`Phát ${track.title}`}>
                    {isPlayingThis ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
                  </button>
                </div>

                <div className="row-main-info">
                  <a
                    className="row-title"
                    href={`#/track/${track.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/track/${track.id}`);
                    }}
                  >
                    {track.title}
                  </a>
                  <a
                    className="row-creator"
                    href={`#/creator/${track.creator.userId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/creator/${track.creator.userId}`);
                    }}
                  >
                    {track.creator.displayName}
                  </a>
                </div>

                <span className="row-album-name">
                  {track.album ? (
                    <a
                      href={`#/album/${track.album.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/album/${track.album!.id}`);
                      }}
                    >
                      {track.album.title}
                    </a>
                  ) : (
                    "Single"
                  )}
                </span>

                <span className="row-duration">{formatDuration(track.durationMs)}</span>

                <div className="row-actions">
                  <button
                    className={`row-icon-btn ${isFavorited ? "row-icon-btn--favorited" : ""}`}
                    onClick={() => onToggleFavorite(track.id)}
                    aria-label={isFavorited ? "Bỏ thích" : "Yêu thích"}
                  >
                    <HeartIcon width={16} height={16} />
                  </button>
                  <button
                    className="row-icon-btn"
                    onClick={() => onNavigate(`/track/${track.id}`)}
                    aria-label="Xem chi tiết"
                  >
                    <MoreIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Featured Albums */}
      <section className="app-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Album & EP nổi bật</h2>
            <p className="section-subtitle">Tuyển tập âm nhạc hoàn chỉnh từ các creator</p>
          </div>
          <button className="section-see-all" onClick={() => onNavigate("/explore?tab=albums")}>
            <span>Tất cả Album</span>
            <ArrowIcon width={16} height={16} />
          </button>
        </div>

        <div className="app-album-grid">
          {albums.map((album) => (
            <div
              key={album.id}
              className="album-item-card"
              onClick={() => onNavigate(`/album/${album.id}`)}
            >
              <div className="album-card-art">
                <img src={album.coverUrl} alt={album.title} loading="lazy" />
                <span className="album-card-play-hover">
                  <PlayIcon width={20} height={20} />
                </span>
              </div>
              <h3 className="album-card-title">{album.title}</h3>
              <p className="album-card-creator">
                {album.creatorName} · {album.releaseYear}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Genres Highlight */}
      <section className="app-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Khám phá theo thể loại</h2>
            <p className="section-subtitle">Giai điệu phù hợp cho từng cảm xúc và gu âm nhạc</p>
          </div>
          <button className="section-see-all" onClick={() => onNavigate("/genres")}>
            <span>Xem tất cả</span>
            <ArrowIcon width={16} height={16} />
          </button>
        </div>

        <div className="app-genre-pill-grid">
          {genres.slice(0, 6).map((genre) => (
            <button
              key={genre.id}
              className="genre-pill-card"
              onClick={() => onNavigate(`/explore?genre=${genre.slug}`)}
              style={{ background: genre.color, color: genre.accent }}
            >
              <span className="genre-pill-name">{genre.name}</span>
              <ArrowIcon width={14} height={14} />
            </button>
          ))}
        </div>
      </section>

      {/* 6. Featured Creators */}
      <section className="app-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Creator tiêu biểu</h2>
            <p className="section-subtitle">Những người mang đến những giai điệu mới mỗi ngày</p>
          </div>
        </div>

        <div className="app-creator-grid">
          {featuredCreators.map((creator) => (
            <div key={creator.userId} className="creator-profile-card">
              <img src={creator.avatarUrl} alt="" className="creator-card-avatar" />
              <h3 className="creator-card-name">{creator.displayName}</h3>
              <p className="creator-card-bio">{creator.bio}</p>
              <span className="creator-card-tracks-count">{creator.publishedTracks} bài hát đã xuất bản</span>
              <button
                className="button button-secondary button-small creator-card-btn"
                onClick={() => onNavigate(`/creator/${creator.userId}`)}
              >
                Xem trang cá nhân
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
