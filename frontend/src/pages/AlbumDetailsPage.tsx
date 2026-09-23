import { albums, tracks } from "../data";
import { HeadphonesIcon, PauseIcon, PlayIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  albumId: number;
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlayTrack: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
};

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export function AlbumDetailsPage({ albumId, currentTrack, playing, onPlayTrack, onNavigate }: Props) {
  const album = albums.find((a) => a.id === albumId) ?? albums[0];
  const albumTracks = tracks.filter((t) => t.album?.id === album.id && t.publicationStatus === "APPROVED");

  const totalDurationMs = albumTracks.reduce((acc, t) => acc + t.durationMs, 0);
  const totalMin = Math.round(totalDurationMs / 60000);

  return (
    <div className="album-details-page">
      <section className="album-header-banner">
        <img src={album.coverUrl} alt={album.title} className="album-large-cover" />
        <div className="album-header-meta">
          <span className="eyebrow">FEATURED ALBUM</span>
          <h1 className="album-title">{album.title}</h1>
          <p className="album-subtitle">
            Creator: <b>{album.creatorName}</b> · Released: {album.releaseYear} · {albumTracks.length} tracks ({totalMin} minutes)
          </p>
          {album.description && <p className="album-desc">{album.description}</p>}

          <div className="album-actions">
            <button
              className="button button-primary button-large"
              onClick={() => albumTracks.length > 0 && onPlayTrack(albumTracks[0])}
            >
              <PlayIcon />
              <span>Play all</span>
            </button>
          </div>
        </div>
      </section>

      <section className="album-tracklist-section">
        <h2 className="section-title">Track list</h2>
        <div className="album-tracks-table">
          {albumTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isPlayingThis = isCurrent && playing;

            return (
              <div
                key={track.id}
                className={`table-track-row ${isCurrent ? "table-track-row--active" : ""}`}
              >
                <span className="row-index">{String(idx + 1).padStart(2, "0")}</span>

                <div className="row-thumbnail" onClick={() => onPlayTrack(track)}>
                  <img src={track.coverUrl ?? undefined} alt="" />
                  <button className="row-hover-play" aria-label={`Play ${track.title}`}>
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
                  <span className="row-creator">{track.creator.displayName}</span>
                </div>

                <span className="row-plays">
                  <HeadphonesIcon width={12} height={12} /> {track.playCount.toLocaleString()}
                </span>

                <span className="row-duration">{formatDuration(track.durationMs)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
