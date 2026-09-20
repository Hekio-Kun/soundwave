import type { FeaturedAlbum, FeaturedCreator, LandingTrack } from "../types";
import { ArrowIcon, HeadphonesIcon, PauseIcon, PlayIcon } from "../icons";

const compactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

type TrackCardProps = {
  track: LandingTrack;
  active: boolean;
  playing: boolean;
  onPlay: (track: LandingTrack) => void;
  onNavigate: (route: string) => void;
  rank?: number;
};

export function TrackCard({ track, active, playing, onPlay, onNavigate, rank }: TrackCardProps) {
  return (
    <article className={`sw-track-card ${active ? "sw-track-card--active" : ""}`}>
      <button className="sw-track-cover" onClick={() => onPlay(track)} aria-label={playing ? `Tạm dừng ${track.title}` : `Phát ${track.title}`}>
        <img src={track.coverUrl ?? undefined} alt="" loading="lazy" />
        {rank ? <span className="sw-track-rank">#{rank}</span> : null}
        <span className="sw-track-play">{playing ? <PauseIcon width={19} height={19} /> : <PlayIcon width={19} height={19} />}</span>
        {playing ? <span className="sw-playing-bars" aria-hidden="true"><i /><i /><i /></span> : null}
      </button>
      <div className="sw-card-copy">
        <a href={`#/track/${track.id}`} className="sw-card-title" onClick={(event) => { event.preventDefault(); onNavigate(`/track/${track.id}`); }}>{track.title}</a>
        <a href={`#/creator/${track.creator.userId}`} className="sw-card-subtitle" onClick={(event) => { event.preventDefault(); onNavigate(`/creator/${track.creator.userId}`); }}>{track.creator.displayName}</a>
        <span className="sw-card-meta"><HeadphonesIcon width={13} height={13} /> {compactNumber(track.playCount)} lượt nghe</span>
      </div>
    </article>
  );
}

export function AlbumCard({ album, onNavigate }: { album: FeaturedAlbum; onNavigate: (route: string) => void }) {
  return (
    <article className="sw-album-card">
      <button className="sw-album-art" onClick={() => onNavigate(`/album/${album.id}`)} aria-label={`Mở album ${album.title}`}>
        <img src={album.coverUrl} alt="" loading="lazy" />
        <span className="sw-track-play"><PlayIcon width={19} height={19} /></span>
      </button>
      <a href={`#/album/${album.id}`} className="sw-card-title" onClick={(event) => { event.preventDefault(); onNavigate(`/album/${album.id}`); }}>{album.title}</a>
      <span className="sw-card-subtitle">{album.creatorName} · {album.releaseYear}</span>
    </article>
  );
}

export function CreatorCard({ creator, onNavigate }: { creator: FeaturedCreator; onNavigate: (route: string) => void }) {
  return (
    <article className="sw-creator-card">
      <button className="sw-creator-avatar" onClick={() => onNavigate(`/creator/${creator.userId}`)} aria-label={`Mở hồ sơ ${creator.displayName}`}><img src={creator.avatarUrl} alt="" loading="lazy" /></button>
      <div>
        <a href={`#/creator/${creator.userId}`} className="sw-card-title" onClick={(event) => { event.preventDefault(); onNavigate(`/creator/${creator.userId}`); }}>{creator.displayName}</a>
        <p>{creator.bio}</p>
        <span>{creator.publishedTracks} bài hát · {compactNumber(creator.followersCount ?? 0)} người theo dõi</span>
      </div>
      <button className="sw-follow-button" onClick={() => onNavigate(`/creator/${creator.userId}`)}>Khám phá</button>
    </article>
  );
}

export function SectionHeader({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="sw-section-heading">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {actionLabel && onAction ? <button onClick={onAction}>{actionLabel}<ArrowIcon width={16} height={16} /></button> : null}
    </div>
  );
}
