import { useEffect, useState } from "react";
import { genres as initialGenres } from "../data";
import { catalogApi } from "../api/catalog";
import { ArrowIcon } from "../icons";
import type { Genre } from "../types";

type Props = {
  onNavigate: (route: string) => void;
};

export function GenresPage({ onNavigate }: Props) {
  const [genresList, setGenresList] = useState<Genre[]>(initialGenres);

  useEffect(() => {
    catalogApi.getGenres()
      .then((data) => {
        if (data && data.length > 0) setGenresList(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="genres-page">
      <div className="page-title-banner">
        <div>
          <span className="eyebrow">GENRES</span>
          <h1 className="page-heading">Explore by genre</h1>
          <p className="page-subtext">Choose a genre to discover music that matches your mood.</p>
        </div>
      </div>

      <div className="genres-full-grid">
        {genresList.map((genre, idx) => (
          <div
            key={genre.id}
            className="genre-big-card"
            style={{ backgroundColor: genre.color, color: genre.accent }}
            onClick={() => onNavigate(`/browse?genre=${genre.slug}`)}
          >
            <div className="genre-big-header">
              <span className="genre-big-num">{String(idx + 1).padStart(2, "0")}</span>
              <span className="genre-big-arrow"><ArrowIcon width={20} height={20} /></span>
            </div>
            <div className="genre-big-footer">
              <h2 className="genre-big-title">{genre.name}</h2>
              <p className="genre-big-desc">{genre.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
