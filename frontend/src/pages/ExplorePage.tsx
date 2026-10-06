import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { albums, featuredCreators, genres as initialGenres, tracks } from "../data";
import { catalogApi } from "../api/catalog";
import { AlbumCard, CreatorCard, SectionHeader, TrackCard } from "../components/MusicCards";
import { SortDropdown } from "../components/SortDropdown";
import { ArrowIcon, FilterIcon, HeadphonesIcon, PauseIcon, PlayIcon } from "../icons";
import type { Genre, LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack, contextQueue?: LandingTrack[], contextTitle?: string) => void;
  onNavigate: (route: string) => void;
  initialGenre?: string;
  initialSort?: "trending" | "newest" | "title";
};

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function ExplorePage({ currentTrack, playing, onPlayTrack, onNavigate, initialGenre, initialSort }: Props) {
  const [selectedGenre, setSelectedGenre] = useState(initialGenre ?? "all");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "title">(initialSort ?? "trending");
  const [genresList, setGenresList] = useState<Genre[]>(initialGenres);
  const [serverTracks, setServerTracks] = useState<LandingTrack[]>([]);

  useEffect(() => {
    catalogApi.getGenres()
      .then((data) => {
        if (data && data.length > 0) setGenresList(data);
      })
      .catch(() => {});

    catalogApi.getTracks({ size: 100 })
      .then((res) => {
        if (res && res.content) {
          setServerTracks(res.content);
        }
      })
      .catch((err) => {
        console.warn("Could not load tracks from catalog API:", err);
      });
  }, []);

  const approvedTracks = useMemo(() => {
    const isPublic = (t: LandingTrack) =>
      t.publicationStatus === "APPROVED" || t.publicationStatus === "PUBLISHED";
    const serverIds = new Set(serverTracks.map((t) => t.id));
    const fallbackMocks = tracks.filter((t) => !serverIds.has(t.id));
    return [...serverTracks, ...fallbackMocks].filter(isPublic);
  }, [serverTracks]);

  const heroTrack = approvedTracks[0] ?? tracks[0];
  const heroPlaying = currentTrack?.id === heroTrack.id && playing;

  useEffect(() => setSelectedGenre(initialGenre ?? "all"), [initialGenre]);
  useEffect(() => setSortBy(initialSort ?? "trending"), [initialSort]);

  const updateFilters = (newGenre: string, newSort: "trending" | "newest" | "title") => {
    setSelectedGenre(newGenre);
    setSortBy(newSort);
    const params = new URLSearchParams();
    if (newGenre !== "all") params.set("genre", newGenre);
    if (newSort !== "trending") params.set("sort", newSort);
    const qs = params.toString();
    onNavigate(qs ? `/explore?${qs}` : "/explore");
  };

  const handleClearFilters = () => {
    updateFilters("all", "trending");
  };

  const filteredTracks = useMemo(() => {
    const byGenre =
      selectedGenre === "all"
        ? approvedTracks
        : approvedTracks.filter(
            (track) => track.genreSlug?.toLowerCase() === selectedGenre.toLowerCase()
          );

    return [...byGenre].sort((a, b) => {
      if (sortBy === "trending") return b.playCount - a.playCount;
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [approvedTracks, selectedGenre, sortBy]);

  const scrollToCatalog = () => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="discover-page">
      <section className="discover-hero" aria-labelledby="discover-title">
        <div className="discover-hero-copy">
          <span className="discover-kicker"><i /> DISCOVER SOMETHING NEW EVERY DAY</span>
          <h1 id="discover-title">Music for<br /><span>the rhythm of your life.</span></h1>
          <p>Find new tracks, follow Vietnamese creators, and save music for every moment.</p>
          <div className="discover-hero-actions">
            <button className="button button-primary button-large" onClick={() => onPlayTrack(heroTrack, approvedTracks, "Recommended")}>
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
        <button className="discover-feature" onClick={() => onPlayTrack(heroTrack, approvedTracks, "Recommended")} aria-label={`${heroPlaying ? "Pause" : "Play"} ${heroTrack.title}`}>
          <span className="discover-feature-art"><img src={heroTrack.coverUrl ?? undefined} alt="" /></span>
          <span className="discover-feature-info"><small>RECOMMENDED SONGS</small><strong>{heroTrack.title}</strong><em>{heroTrack.creator.displayName} · {heroTrack.album?.title ?? "Single"}</em></span>
          <span className="discover-feature-play">{heroPlaying ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
      </section>

      <section className="sw-section" id="trending">
        <SectionHeader title="Trending tracks" description="The most-played tracks in the SoundWave community this week" actionLabel="View all" onAction={scrollToCatalog} />
        <div className="sw-track-grid">
          {approvedTracks.slice(0, 5).map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              rank={index + 1}
              active={currentTrack?.id === track.id}
              playing={currentTrack?.id === track.id && playing}
              onPlay={(t) => onPlayTrack(t, approvedTracks.slice(0, 5), "Trending tracks")}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      <section className="sw-section sw-section--split">
        <div className="sw-release-panel">
          <SectionHeader title="New releases" description="Recently published on SoundWave" />
          <div className="sw-release-list">
            {approvedTracks.slice(1, 6).map((track, index) => (
              <button
                key={track.id}
                className={`sw-release-row ${currentTrack?.id === track.id ? "is-active" : ""}`}
                onClick={() => onPlayTrack(track, approvedTracks.slice(1, 6), "New releases")}
              >
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
            {genresList.slice(0, 6).map((genre) => (
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
        <SectionHeader
          title="SoundWave catalog"
          description={
            selectedGenre !== "all"
              ? `Result count: ${filteredTracks.length} tracks • Filtered by: ${genresList.find(g => g.slug === selectedGenre)?.name ?? selectedGenre}`
              : `Result count: ${filteredTracks.length} tracks (All genres)`
          }
        />
        <div className="sw-catalog-toolbar">
          <div className="sw-filter-scroll">
            <button
              className={selectedGenre === "all" ? "is-active" : ""}
              onClick={() => updateFilters("all", sortBy)}
            >
              All
            </button>
            {genresList.map((genre) => (
              <button
                key={genre.id}
                className={selectedGenre === genre.slug ? "is-active" : ""}
                onClick={() => updateFilters(genre.slug, sortBy)}
              >
                {genre.name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SortDropdown
              value={sortBy}
              onChange={(newSort) => updateFilters(selectedGenre, newSort)}
              showLabel={false}
            />
            {(selectedGenre !== "all" || sortBy !== "trending") && (
              <button
                className="button button-ghost"
                onClick={handleClearFilters}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  borderRadius: "8px",
                  border: "1px solid var(--sw-border)",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {filteredTracks.length ? (
          <div className="sw-track-grid sw-track-grid--catalog">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                active={currentTrack?.id === track.id}
                playing={currentTrack?.id === track.id && playing}
                onPlay={(t) =>
                  onPlayTrack(
                    t,
                    filteredTracks,
                    selectedGenre !== "all" ? `Genre • ${selectedGenre}` : "Explore catalog"
                  )
                }
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="sw-empty">
            <HeadphonesIcon />
            <strong>No tracks in this genre yet</strong>
            <span>Try selecting another genre or clearing filters.</span>
            <button onClick={handleClearFilters}>Clear filters</button>
          </div>
        )}
      </section>
    </div>
  );
}
