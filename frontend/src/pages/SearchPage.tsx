import { useEffect, useMemo, useState } from "react";
import { AlbumCard, CreatorCard, TrackCard } from "../components/MusicCards";
import { albums, featuredCreators, tracks } from "../data";
import { catalogApi } from "../api/catalog";
import { CloseIcon, CompassIcon, SearchIcon, TrendingUpIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  initialQuery?: string;
};

export function SearchPage({ currentTrack, playing, onPlayTrack, onNavigate, initialQuery = "" }: Props) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<"all" | "tracks" | "albums" | "creators">("all");
  const [serverTracks, setServerTracks] = useState<LandingTrack[]>([]);

  useEffect(() => {
    catalogApi.getTracks({ size: 100 })
      .then((res) => {
        if (res?.content) setServerTracks(res.content);
      })
      .catch(() => {});
  }, []);

  const allSearchableTracks = useMemo(() => {
    const isPublic = (t: LandingTrack) =>
      t.publicationStatus === "APPROVED" || t.publicationStatus === "PUBLISHED";
    const serverIds = new Set(serverTracks.map((t) => t.id));
    const fallbackMocks = tracks.filter((t) => !serverIds.has(t.id));
    return [...serverTracks, ...fallbackMocks].filter(isPublic);
  }, [serverTracks]);

  const query = searchTerm.trim().toLowerCase();

  useEffect(() => setActiveFilter("all"), [query]);

  const matchedTracks = useMemo(() => {
    if (!query) return [];
    return allSearchableTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.slug && t.slug.toLowerCase().includes(query)) ||
        t.creator.displayName.toLowerCase().includes(query) ||
        (t.genreSlug?.toLowerCase().includes(query) ?? false) ||
        (t.album?.title?.toLowerCase().includes(query) ?? false)
    );
  }, [allSearchableTracks, query]);

  const matchedAlbums = useMemo(() => {
    if (!query) return [];
    return albums.filter(
      (a) => a.title.toLowerCase().includes(query) || a.creatorName.toLowerCase().includes(query)
    );
  }, [query]);

  const matchedCreators = useMemo(() => {
    if (!query) return [];
    return featuredCreators.filter(
      (c) => c.displayName.toLowerCase().includes(query) || c.bio.toLowerCase().includes(query)
    );
  }, [query]);

  const hasResults = matchedTracks.length > 0 || matchedAlbums.length > 0 || matchedCreators.length > 0;
  const resultCount = matchedTracks.length + matchedAlbums.length + matchedCreators.length;
  const quickSearches = ["Minh An", "Mưa", "Biển", "Acoustic"];

  return (
    <div className="search-page">
      <section className="search-hero">
        <div className="search-hero-copy">
          <span className="search-kicker"><CompassIcon width={15} height={15} /> DISCOVER THE CATALOG</span>
          <h1>Find your next <span>favorite sound.</span></h1>
          <p>Search public tracks, albums and Vietnamese creators in one place.</p>
        </div>
        <div className="search-input-panel">
          <label htmlFor="catalog-search">What do you want to listen to?</label>
          <div className="search-big-bar">
            <SearchIcon width={21} height={21} />
            <input
              id="catalog-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Track, album or creator..."
              autoFocus
              autoComplete="off"
            />
            {searchTerm ? <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search"><CloseIcon width={16} height={16} /></button> : null}
          </div>
          <div className="search-quick-row">
            <span>Try</span>
            {quickSearches.map((keyword) => <button key={keyword} onClick={() => setSearchTerm(keyword)}>{keyword}</button>)}
          </div>
        </div>
      </section>

      {query && (
        <div className="search-toolbar">
          <div className="search-result-summary"><strong>{resultCount}</strong><span>results for “{searchTerm.trim()}”</span></div>
          <div className="search-tabs" role="tablist" aria-label="Search result types">
          <button
            className={`search-tab-pill ${activeFilter === "all" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("all")}
            role="tab"
            aria-selected={activeFilter === "all"}
          >
            All <span>{resultCount}</span>
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "tracks" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("tracks")}
            role="tab"
            aria-selected={activeFilter === "tracks"}
          >
            Tracks <span>{matchedTracks.length}</span>
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "albums" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("albums")}
            role="tab"
            aria-selected={activeFilter === "albums"}
          >
            Albums <span>{matchedAlbums.length}</span>
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "creators" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("creators")}
            role="tab"
            aria-selected={activeFilter === "creators"}
          >
            Creators <span>{matchedCreators.length}</span>
          </button>
          </div>
        </div>
      )}

      {!query ? (
        <div className="search-prompt-state">
          <span className="search-prompt-icon"><TrendingUpIcon width={25} height={25} /></span>
          <div><span className="search-prompt-label">TRENDING SEARCH</span><h2>Start with what listeners love today</h2><p>Use a title, creator name or album to explore the public catalog.</p></div>
          <button onClick={() => setSearchTerm("Minh An")}>Explore Minh An</button>
        </div>
      ) : !hasResults ? (
        <div className="state-empty-box">
          <span className="search-empty-icon"><SearchIcon width={26} height={26} /></span>
          <p className="empty-title">No results found for "{searchTerm}"</p>
          <p className="empty-desc">Check the spelling or try a shorter keyword.</p>
          <button className="button button-secondary" onClick={() => setSearchTerm("")}>Clear search</button>
        </div>
      ) : (
        <div className="search-results-container">
          {(activeFilter === "all" || activeFilter === "tracks") && matchedTracks.length > 0 && (
            <section className="search-result-section">
              <div className="search-section-heading"><div><span>SONGS</span><h2>Matching tracks</h2></div><small>{matchedTracks.length} found</small></div>
              <div className="sw-track-grid sw-track-grid--catalog">
                {matchedTracks.map((track) => <TrackCard key={track.id} track={track} active={currentTrack?.id === track.id} playing={currentTrack?.id === track.id && playing} onPlay={onPlayTrack} onNavigate={onNavigate} />)}
              </div>
            </section>
          )}

          {(activeFilter === "all" || activeFilter === "albums") && matchedAlbums.length > 0 && (
            <section className="search-result-section">
              <div className="search-section-heading"><div><span>COLLECTIONS</span><h2>Matching albums</h2></div><small>{matchedAlbums.length} found</small></div>
              <div className="sw-album-grid">
                {matchedAlbums.map((album) => <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />)}
              </div>
            </section>
          )}

          {(activeFilter === "all" || activeFilter === "creators") && matchedCreators.length > 0 && (
            <section className="search-result-section">
              <div className="search-section-heading"><div><span>PEOPLE</span><h2>Matching creators</h2></div><small>{matchedCreators.length} found</small></div>
              <div className="sw-creator-grid">
                {matchedCreators.map((creator) => <CreatorCard key={creator.userId} creator={creator} onNavigate={onNavigate} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
