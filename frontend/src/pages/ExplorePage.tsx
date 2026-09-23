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
          <span className="discover-kicker"><i /> DISCOVER SOMETHING NEW EVERY DAY</span>
          <h1 id="discover-title">Music for<br /><span>the rhythm of your life.</span></h1>
          <p>Find new tracks, follow Vietnamese creators, and save music for every moment.</p>
          <div className="discover-hero-actions">
            <button className="button button-primary button-large" onClick={() => onPlayTrack(heroTrack)}>
              {heroPlaying ? <PauseIcon /> : <PlayIcon />} {heroPlaying ? "Pause" : "Listen now"}
            </button>
            <button className="button button-secondary button-large" onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}>
              View trending <ArrowIcon width={17} height={17} />
            </button>
          </div>
          <div className="discover-proof">
            <span><b>1.2K+</b><small>Vietnamese creators</small></span>
            <span><b>24K+</b><small>tracks</small></span>
            <span><b>Every day</b><small>new music added</small></span>
          </div>
        </div>
        <button className="discover-feature" onClick={() => onPlayTrack(heroTrack)} aria-label={`${heroPlaying ? "Pause" : "Play"} ${heroTrack.title}`}>
          <span className="discover-feature-art"><img src={heroTrack.coverUrl ?? undefined} alt="" /></span>
          <span className="discover-feature-info"><small>RECOMMENDED SONGS</small><strong>{heroTrack.title}</strong><em>{heroTrack.creator.displayName} · {heroTrack.album?.title}</em></span>
          <span className="discover-feature-play">{heroPlaying ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
      </section>

      <section className="sw-section" id="trending">
        <SectionHeader title="Trending tracks" description="The most-played tracks in the SoundWave community this week" actionLabel="View all" onAction={scrollToCatalog} />
        <div className="sw-track-grid">
          {approvedTracks.slice(0, 5).map((track, index) => <TrackCard key={track.id} track={track} rank={index + 1} active={currentTrack?.id === track.id} playing={currentTrack?.id === track.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}
        </div>
      </section>

      <section className="sw-section sw-section--split">
        <div className="sw-release-panel">
          <SectionHeader title="New releases" description="Recently published on SoundWave" />
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
          <SectionHeader title="Genres" description="Choose music that matches your mood" actionLabel="View all" onAction={() => onNavigate("/genres")} />
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
        <SectionHeader title="Featured albums" description="Complete stories told through every album" actionLabel="Open library" onAction={() => onNavigate("/library")} />
        <div className="sw-album-grid">{albums.map((album) => <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />)}</div>
      </section>

      <section className="sw-section">
        <SectionHeader title="Featured creators" description="Follow the creators shaping today's favorite sounds" />
        <div className="sw-creator-grid">{featuredCreators.map((creator) => <CreatorCard key={creator.userId} creator={creator} onNavigate={onNavigate} />)}</div>
      </section>

      <section className="sw-section sw-catalog" id="catalog">
        <SectionHeader title="SoundWave catalog" description={`${filteredTracks.length} tracks match your selection`} />
        <div className="sw-catalog-toolbar">
          <div className="sw-filter-scroll">
            <button className={selectedGenre === "all" ? "is-active" : ""} onClick={() => setSelectedGenre("all")}>All</button>
            {genres.map((genre) => <button key={genre.id} className={selectedGenre === genre.slug ? "is-active" : ""} onClick={() => setSelectedGenre(genre.slug)}>{genre.name}</button>)}
          </div>
          <label className="sw-sort"><FilterIcon width={15} height={15} /><span className="sr-only">Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as "trending" | "newest")}><option value="trending">Most played</option><option value="newest">Newest</option></select></label>
        </div>
        {filteredTracks.length ? <div className="sw-track-grid sw-track-grid--catalog">{filteredTracks.map((track) => <TrackCard key={track.id} track={track} active={currentTrack?.id === track.id} playing={currentTrack?.id === track.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}</div> : <div className="sw-empty"><HeadphonesIcon /><strong>No tracks in this genre yet</strong><span>Try selecting another genre.</span><button onClick={() => setSelectedGenre("all")}>View all tracks</button></div>}
      </section>
    </div>
  );
}
