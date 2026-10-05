import { useEffect, useMemo, useState } from "react";
import { genres as staticGenres, tracks as staticTracks } from "../data";
import { catalogApi } from "../api/catalog";
import { SectionHeader, TrackCard } from "../components/MusicCards";
import { SortDropdown } from "../components/SortDropdown";
import { ArrowIcon, FilterIcon, HeadphonesIcon } from "../icons";
import type { Genre, LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  initialGenre?: string;
  initialSort?: "newest" | "trending" | "title";
};

export function FilteredCatalogPage({
  currentTrack,
  playing,
  onPlayTrack,
  onNavigate,
  initialGenre,
  initialSort,
}: Props) {
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre ?? "all");
  const [sortBy, setSortBy] = useState<"newest" | "trending" | "title">(initialSort ?? "newest");
  const [genresList, setGenresList] = useState<Genre[]>(staticGenres);
  const [serverTracks, setServerTracks] = useState<LandingTrack[] | null>(null);

  // Keep state in sync with URL query params
  useEffect(() => {
    setSelectedGenre(initialGenre ?? "all");
  }, [initialGenre]);

  useEffect(() => {
    setSortBy(initialSort ?? "newest");
  }, [initialSort]);

  // Load genres from backend
  useEffect(() => {
    catalogApi.getGenres()
      .then((data) => {
        if (data && data.length > 0) setGenresList(data);
      })
      .catch(() => {});
  }, []);

  // Load filtered tracks from backend
  useEffect(() => {
    catalogApi.getTracks({
      genre: selectedGenre !== "all" ? selectedGenre : undefined,
      sort: sortBy,
    })
      .then((res) => {
        if (res && res.content) {
          setServerTracks(res.content);
        }
      })
      .catch(() => {
        setServerTracks(null);
      });
  }, [selectedGenre, sortBy]);

  const approvedTracks = useMemo(
    () => staticTracks.filter((track) => track.publicationStatus === "APPROVED"),
    []
  );

  const activeGenreObj = useMemo(
    () => genresList.find((g) => g.slug.toLowerCase() === selectedGenre.toLowerCase()),
    [genresList, selectedGenre]
  );

  const updateFilters = (newGenre: string, newSort: "newest" | "trending" | "title") => {
    setSelectedGenre(newGenre);
    setSortBy(newSort);
    const params = new URLSearchParams();
    if (newGenre && newGenre !== "all") params.set("genre", newGenre);
    if (newSort && newSort !== "newest") params.set("sort", newSort);
    const qs = params.toString();
    onNavigate(qs ? `/browse?${qs}` : "/browse");
  };

  const handleClearFilters = () => {
    updateFilters("all", "newest");
  };

  const filteredTracks = useMemo(() => {
    if (serverTracks !== null) {
      return serverTracks;
    }

    let result =
      selectedGenre === "all"
        ? approvedTracks
        : approvedTracks.filter(
            (track) => track.genreSlug?.toLowerCase() === selectedGenre.toLowerCase()
          );

    return [...result].sort((a, b) => {
      if (sortBy === "trending") return b.playCount - a.playCount;
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [approvedTracks, serverTracks, selectedGenre, sortBy]);

  return (
    <div className="catalog-browse-page" style={{ padding: "0 0 60px 0" }}>
      {/* Page Title & Breadcrumb Banner */}
      <div className="page-title-banner" style={{ marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="eyebrow">PUBLIC CATALOG</span>
          </div>
          <h1 className="page-heading">Browse Tracks</h1>
        </div>
      </div>

      {/* Filter Toolbar: Sort dropdown, Clear filters, Result summary */}
      <div
        className="sw-catalog-toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          padding: "14px 18px",
          background: "#fff",
          border: "1px solid var(--sw-border)",
          borderRadius: "16px",
          marginBottom: "16px",
          boxShadow: "0 4px 18px rgba(16, 24, 40, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Custom Modern Sort Dropdown */}
          <SortDropdown
            value={sortBy}
            onChange={(newSort) => updateFilters(selectedGenre, newSort)}
            showLabel={true}
          />

          {/* Clear filters Button */}
          {(selectedGenre !== "all" || sortBy !== "newest") && (
            <button
              className="button button-ghost"
              onClick={handleClearFilters}
              style={{
                height: "38px",
                padding: "0 14px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "10px",
                border: "1px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#DC2626",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Result summary */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              background: "#F1F5F9",
              color: "#475467",
              fontSize: "11.5px",
              fontWeight: 700,
            }}
          >
            Result count: <b>{filteredTracks.length}</b> tracks
          </span>
          {activeGenreObj && (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                background: "var(--sw-cyan-light, #ECFEFF)",
                color: "var(--sw-primary-dark, #0E7490)",
                fontSize: "11.5px",
                fontWeight: 800,
                border: "1px solid #BAE6FD",
              }}
            >
              Filtered by: {activeGenreObj.name}
            </span>
          )}
        </div>
      </div>

      {/* Quick genre pills scrollbar */}
      <div
        className="sw-filter-scroll"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          marginBottom: "22px",
          paddingBottom: "4px",
        }}
      >
        <button
          className={selectedGenre === "all" ? "is-active" : ""}
          onClick={() => updateFilters("all", sortBy)}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 700,
            border: selectedGenre === "all" ? "none" : "1px solid var(--sw-border)",
            background: selectedGenre === "all" ? "var(--sw-primary)" : "#fff",
            color: selectedGenre === "all" ? "#fff" : "var(--sw-muted)",
            cursor: "pointer",
          }}
        >
          All Genres
        </button>
        {genresList.map((g) => {
          const isSelected = selectedGenre.toLowerCase() === g.slug.toLowerCase();
          return (
            <button
              key={g.id}
              className={isSelected ? "is-active" : ""}
              onClick={() => updateFilters(g.slug, sortBy)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                border: isSelected ? "none" : "1px solid var(--sw-border)",
                background: isSelected ? "var(--sw-primary)" : "#fff",
                color: isSelected ? "#fff" : "var(--sw-muted)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: isSelected ? "0 4px 12px rgba(8, 145, 178, 0.25)" : "none",
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Track Cards Results or Empty State */}
      {filteredTracks.length > 0 ? (
        <div className="sw-track-grid sw-track-grid--catalog">
          {filteredTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              active={currentTrack?.id === track.id}
              playing={currentTrack?.id === track.id && playing}
              onPlay={onPlayTrack}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        <div
          className="sw-empty"
          style={{
            minHeight: "320px",
            padding: "40px 20px",
            background: "#fff",
            border: "1px dashed var(--sw-border)",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#F0FDFF",
              display: "grid",
              placeItems: "center",
              color: "var(--sw-primary)",
            }}
          >
            <HeadphonesIcon width={28} height={28} />
          </div>
          <strong style={{ fontSize: "16px", color: "var(--sw-text)" }}>
            No tracks found in {activeGenreObj ? `"${activeGenreObj.name}"` : "this genre"}
          </strong>
          <span style={{ fontSize: "13px", color: "var(--sw-muted)" }}>
            There are currently no approved published tracks in this category.
          </span>
          <button
            className="button button-primary"
            onClick={handleClearFilters}
            style={{ marginTop: "10px" }}
          >
            Clear filters and view all tracks
          </button>
        </div>
      )}
    </div>
  );
}
