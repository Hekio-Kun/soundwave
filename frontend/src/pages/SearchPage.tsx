import { useMemo, useState } from "react";
import { albums, featuredCreators, tracks } from "../data";
import { HeadphonesIcon, PauseIcon, PlayIcon, SearchIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  initialQuery?: string;
};

const formatPlays = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function SearchPage({ currentTrack, playing, onPlayTrack, onNavigate, initialQuery = "" }: Props) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<"all" | "tracks" | "albums" | "creators">("all");

  const query = searchTerm.trim().toLowerCase();

  const matchedTracks = useMemo(() => {
    if (!query) return [];
    return tracks.filter(
      (t) =>
        t.publicationStatus === "APPROVED" &&
        (t.title.toLowerCase().includes(query) ||
          t.creator.displayName.toLowerCase().includes(query) ||
          (t.album?.title.toLowerCase().includes(query) ?? false))
    );
  }, [query]);

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

  return (
    <div className="search-page">
      <div className="search-header-box">
        <h1 className="page-heading">Search Public Catalog</h1>
        <div className="search-big-bar">
          <SearchIcon width={22} height={22} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracks, albums, or creators..."
            autoFocus
            aria-label="Keyword"
          />
        </div>
      </div>

      {query && (
        <div className="search-tabs">
          <button
            className={`search-tab-pill ${activeFilter === "all" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All ({matchedTracks.length + matchedAlbums.length + matchedCreators.length})
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "tracks" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("tracks")}
          >
            Tracks ({matchedTracks.length})
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "albums" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("albums")}
          >
            Album ({matchedAlbums.length})
          </button>
          <button
            className={`search-tab-pill ${activeFilter === "creators" ? "search-tab-pill--active" : ""}`}
            onClick={() => setActiveFilter("creators")}
          >
            Creators ({matchedCreators.length})
          </button>
        </div>
      )}

      {!query ? (
        <div className="search-prompt-state">
          <SearchIcon width={48} height={48} />
          <p>Enter a keyword to explore the SoundWave catalog.</p>
          <div className="quick-keywords">
            <span>Suggestions:</span>
            <button className="text-tag" onClick={() => setSearchTerm("Mưa")}>Thành Phố Sau Mưa</button>
            <button className="text-tag" onClick={() => setSearchTerm("Minh An")}>Minh An</button>
            <button className="text-tag" onClick={() => setSearchTerm("Biển")}>Phía Bên Kia Biển</button>
          </div>
        </div>
      ) : !hasResults ? (
        <div className="state-empty-box">
          <p className="empty-title">No results found for "{searchTerm}"</p>
          <p className="empty-desc">Check the spelling or try a shorter keyword.</p>
        </div>
      ) : (
        <div className="search-results-container">
          {/* Tracks section */}
          {(activeFilter === "all" || activeFilter === "tracks") && matchedTracks.length > 0 && (
            <section className="search-result-section">
              <h2 className="section-title">Tracks</h2>
              <div className="app-track-grid">
                {matchedTracks.map((track) => {
                  const isPlayingThis = currentTrack?.id === track.id && playing;
                  const isCurrent = currentTrack?.id === track.id;

                  return (
                    <article key={track.id} className={`music-card ${isCurrent ? "music-card--active" : ""}`}>
                      <div className="music-card-cover" onClick={() => onPlayTrack(track)}>
                        <img src={track.coverUrl ?? undefined} alt={track.title} />
                        <button className="music-card-play-btn" aria-label={`Play ${track.title}`}>
                          {isPlayingThis ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
                        </button>
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
          )}

          {/* Albums section */}
          {(activeFilter === "all" || activeFilter === "albums") && matchedAlbums.length > 0 && (
            <section className="search-result-section">
              <h2 className="section-title">Album</h2>
              <div className="app-album-grid">
                {matchedAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="album-item-card"
                    onClick={() => onNavigate(`/album/${album.id}`)}
                  >
                    <div className="album-card-art">
                      <img src={album.coverUrl} alt={album.title} />
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
          )}

          {/* Creators section */}
          {(activeFilter === "all" || activeFilter === "creators") && matchedCreators.length > 0 && (
            <section className="search-result-section">
              <h2 className="section-title">Creators</h2>
              <div className="app-creator-grid">
                {matchedCreators.map((creator) => (
                  <div key={creator.userId} className="creator-profile-card">
                    <img src={creator.avatarUrl} alt="" className="creator-card-avatar" />
                    <h3 className="creator-card-name">{creator.displayName}</h3>
                    <p className="creator-card-bio">{creator.bio}</p>
                    <button
                      className="button button-secondary button-small"
                      onClick={() => onNavigate(`/creator/${creator.userId}`)}
                    >
                      View profile
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
