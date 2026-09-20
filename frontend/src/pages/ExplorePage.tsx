import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { albums, featuredCreators, genres, tracks } from "../data";
import { AlbumCard, CreatorCard, SectionHeader, TrackCard } from "../components/MusicCards";
import { ArrowIcon, FilterIcon, HeadphonesIcon, PauseIcon, PlayIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  initialGenre?: string;
  initialSort?: "trending" | "newest";
};

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function ExplorePage({ currentTrack, playing, onPlayTrack, onNavigate, initialGenre, initialSort }: Props) {
  const [selectedGenre, setSelectedGenre] = useState(initialGenre ?? "all");
  const [sortBy, setSortBy] = useState<"trending" | "newest">(initialSort ?? "trending");
  const approvedTracks = tracks.filter((track) => track.publicationStatus === "APPROVED");
  const heroTrack = approvedTracks[0];
  const heroPlaying = currentTrack?.id === heroTrack.id && playing;

  useEffect(() => setSelectedGenre(initialGenre ?? "all"), [initialGenre]);
  useEffect(() => setSortBy(initialSort ?? "trending"), [initialSort]);

  const filteredTracks = useMemo(() => {
    const byGenre = selectedGenre === "all" ? approvedTracks : approvedTracks.filter((track) => track.genreSlug === selectedGenre);
    return [...byGenre].sort((a, b) => sortBy === "trending" ? b.playCount - a.playCount : b.id - a.id);
  }, [selectedGenre, sortBy]);

  const scrollToCatalog = () => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="discover-page">
      <section className="discover-hero" aria-labelledby="discover-title">
        <div className="discover-hero-copy">
          <span className="discover-kicker"><i /> KHÁM PHÁ MỖI NGÀY</span>
          <h1 id="discover-title">Âm nhạc cho<br /><span>nhịp sống của bạn.</span></h1>
          <p>Tìm bài hát mới, theo dõi creator Việt và lưu lại những giai điệu hợp với từng khoảnh khắc.</p>
          <div className="discover-hero-actions">
            <button className="button button-primary button-large" onClick={() => onPlayTrack(heroTrack)}>
              {heroPlaying ? <PauseIcon /> : <PlayIcon />} {heroPlaying ? "Tạm dừng" : "Nghe ngay"}
            </button>
            <button className="button button-secondary button-large" onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}>
              Xem thịnh hành <ArrowIcon width={17} height={17} />
            </button>
          </div>
          <div className="discover-proof">
            <span><b>1.2K+</b><small>creator Việt</small></span>
            <span><b>24K+</b><small>giai điệu</small></span>
            <span><b>Mỗi ngày</b><small>nhạc mới cập nhật</small></span>
          </div>
        </div>
        <button className="discover-feature" onClick={() => onPlayTrack(heroTrack)} aria-label={`${heroPlaying ? "Tạm dừng" : "Phát"} ${heroTrack.title}`}>
          <span className="discover-feature-art"><img src={heroTrack.coverUrl ?? undefined} alt="" /></span>
          <span className="discover-feature-info"><small>GỢI Ý HÔM NAY</small><strong>{heroTrack.title}</strong><em>{heroTrack.creator.displayName} · {heroTrack.album?.title}</em></span>
          <span className="discover-feature-play">{heroPlaying ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
      </section>

      <section className="sw-section" id="trending">
        <SectionHeader title="Đang thịnh hành" description="Những giai điệu được cộng đồng nghe nhiều nhất tuần này" actionLabel="Xem tất cả" onAction={scrollToCatalog} />
        <div className="sw-track-grid">
          {approvedTracks.slice(0, 5).map((track, index) => <TrackCard key={track.id} track={track} rank={index + 1} active={currentTrack?.id === track.id} playing={currentTrack?.id === track.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}
        </div>
      </section>

      <section className="sw-section sw-section--split">
        <div className="sw-release-panel">
          <SectionHeader title="Mới phát hành" description="Vừa lên sóng trên SoundWave" />
          <div className="sw-release-list">
            {approvedTracks.slice(1, 6).map((track, index) => (
              <button key={track.id} className={`sw-release-row ${currentTrack?.id === track.id ? "is-active" : ""}`} onClick={() => onPlayTrack(track)}>
                <span className="sw-release-index">{String(index + 1).padStart(2, "0")}</span>
                <img src={track.coverUrl ?? undefined} alt="" />
                <span className="sw-release-copy"><strong>{track.title}</strong><small>{track.creator.displayName} · {track.genreSlug}</small></span>
                <span className="sw-release-duration">{formatDuration(track.durationMs)}</span>
                <span className="sw-release-icon">{currentTrack?.id === track.id && playing ? <PauseIcon width={15} height={15} /> : <PlayIcon width={15} height={15} />}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="sw-genre-panel">
          <SectionHeader title="Theo tâm trạng" description="Chọn không gian âm nhạc của riêng bạn" actionLabel="Tất cả" onAction={() => onNavigate("/genres")} />
          <div className="sw-genre-grid">
            {genres.slice(0, 6).map((genre) => (
              <button key={genre.id} style={{ "--genre-color": genre.color, "--genre-accent": genre.accent } as CSSProperties} onClick={() => { setSelectedGenre(genre.slug); scrollToCatalog(); }}>
                <span>{genre.name}</span><small>{genre.description}</small><ArrowIcon width={16} height={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sw-section">
        <SectionHeader title="Album tuyển chọn" description="Những câu chuyện được kể trọn vẹn qua từng album" actionLabel="Mở thư viện" onAction={() => onNavigate("/library")} />
        <div className="sw-album-grid">{albums.map((album) => <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />)}</div>
      </section>

      <section className="sw-section">
        <SectionHeader title="Creator nổi bật" description="Theo dõi những màu sắc âm nhạc đang được yêu thích" />
        <div className="sw-creator-grid">{featuredCreators.map((creator) => <CreatorCard key={creator.userId} creator={creator} onNavigate={onNavigate} />)}</div>
      </section>

      <section className="sw-section sw-catalog" id="catalog">
        <SectionHeader title="Kho nhạc SoundWave" description={`${filteredTracks.length} bài hát phù hợp với lựa chọn của bạn`} />
        <div className="sw-catalog-toolbar">
          <div className="sw-filter-scroll">
            <button className={selectedGenre === "all" ? "is-active" : ""} onClick={() => setSelectedGenre("all")}>Tất cả</button>
            {genres.map((genre) => <button key={genre.id} className={selectedGenre === genre.slug ? "is-active" : ""} onClick={() => setSelectedGenre(genre.slug)}>{genre.name}</button>)}
          </div>
          <label className="sw-sort"><FilterIcon width={15} height={15} /><span className="sr-only">Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as "trending" | "newest")}><option value="trending">Thịnh hành</option><option value="newest">Mới nhất</option></select></label>
        </div>
        {filteredTracks.length ? <div className="sw-track-grid sw-track-grid--catalog">{filteredTracks.map((track) => <TrackCard key={track.id} track={track} active={currentTrack?.id === track.id} playing={currentTrack?.id === track.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}</div> : <div className="sw-empty"><HeadphonesIcon /><strong>Chưa có bài hát ở thể loại này</strong><span>Hãy thử chọn một thể loại khác.</span><button onClick={() => setSelectedGenre("all")}>Xem tất cả bài hát</button></div>}
      </section>
    </div>
  );
}
