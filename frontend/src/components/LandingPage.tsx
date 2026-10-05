import { useEffect, useState } from "react";
import { albums, featuredCreators, genres, heroCovers, tracks } from "../data";
import { ArrowIcon, CheckIcon, HeadphonesIcon, MoreIcon, PauseIcon, PlayIcon, UploadIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  currentTrack: LandingTrack | null;
  playing: boolean;
  onPlay: (track: LandingTrack) => void;
  isAuthenticated: boolean;
};

const go = (path: string) => {
  window.location.hash = path;
};

const formatPlays = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const formatDuration = (ms: number) => `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, "0")}`;

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: () => void }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <button className="section-link" onClick={action}>View all <ArrowIcon /></button>}
    </div>
  );
}

function TrackCard({ track, active, playing, onPlay }: { track: LandingTrack; active: boolean; playing: boolean; onPlay: () => void }) {
  return (
    <article className={`track-card ${active ? "track-card--active" : ""}`}>
      <div className="cover-wrap">
        <img src={track.coverUrl ?? undefined} alt={`${track.title} cover`} loading="lazy" />
        <button className="cover-play" onClick={onPlay} aria-label={active && playing ? `Pause ${track.title}` : `Play ${track.title}`}>
          {active && playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        {active && playing && <span className="playing-bars" aria-label="Now playing"><i/><i/><i/></span>}
      </div>
      <a className="track-title" href={`#/track/${track.id}`}>{track.title}</a>
      <a className="track-creator" href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a>
      <span className="track-plays"><HeadphonesIcon /> {formatPlays(track.playCount)} plays</span>
    </article>
  );
}

function SkeletonHome() {
  return (
    <main className="page-main" aria-busy="true">
      <div className="skeleton skeleton-hero" />
      <section className="page-section"><div className="skeleton skeleton-heading"/><div className="track-grid">{Array.from({ length: 6 }).map((_, index) => <div className="skeleton skeleton-card" key={index}/>)}</div></section>
    </main>
  );
}

export function LandingPage({ currentTrack, playing, onPlay, isAuthenticated }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("state");
    const timer = window.setTimeout(() => {
      if (requested === "error") setStatus("error");
      else if (requested === "empty") setStatus("empty");
      else setStatus("ready");
    }, 550);
    return () => window.clearTimeout(timer);
  }, []);

  if (status === "loading") return <SkeletonHome />;

  if (status === "error") {
    return <main className="state-page"><div className="state-icon">!</div><h1>Music could not be loaded</h1><p>The connection was interrupted. Try loading the content again.</p><button className="button button-primary" onClick={() => setStatus("ready")}>Try again</button></main>;
  }

  if (status === "empty") {
    return <main className="state-page"><div className="state-icon"><HeadphonesIcon /></div><h1>SoundWave is getting ready</h1><p>The first tracks will appear here soon.</p><button className="button button-primary" onClick={() => go(isAuthenticated ? "/studio/upload" : "/login")}>Upload the first track</button></main>;
  }

  const approvedTracks = tracks.filter((track) => track.publicationStatus === "APPROVED");

  return (
    <main className="page-main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker"><span><i/><i/><i/><i/></span> Music from the community</div>
          <h1>Music for every <span>moment.</span></h1>
          <p>Discover, listen to, and share new music with the SoundWave community.</p>
          <div className="hero-actions">
            <button className="button button-primary button-large" onClick={() => document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" })}><PlayIcon /> Listen now</button>
            <button className="button button-secondary button-large" onClick={() => go(isAuthenticated ? "/studio/upload" : "/login")}><UploadIcon /> Upload track</button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack">{featuredCreators.slice(0, 3).map((creator) => <img src={creator.avatarUrl} alt="" key={creator.userId}/>)}</div>
            <span><b>More than 1,200 creators</b><small>share music every day</small></span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Music collection illustration">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          {heroCovers.map((cover, index) => <img className={`hero-cover hero-cover-${index + 1}`} src={cover} alt="Illustrative music cover" key={cover}/>) }
          <div className="hero-mini-player">
            <div className="mini-now"><span>NOW PLAYING</span><i/><i/><i/></div>
            <div className="mini-track">
              <img src={approvedTracks[0].coverUrl ?? undefined} alt=""/>
              <div><b>{approvedTracks[0].title}</b><span>{approvedTracks[0].creator.displayName}</span></div>
              <button onClick={() => onPlay(approvedTracks[0])} aria-label={`Play ${approvedTracks[0].title}`}><PlayIcon /></button>
            </div>
            <div className="mini-progress"><i /></div>
            <div className="mini-times"><span>1:24</span><span>6:08</span></div>
          </div>
        </div>
      </section>

      <section className="page-section container" id="trending">
        <SectionHeading eyebrow="MOST PLAYED" title="Trending tracks" description="The tracks most loved by the SoundWave community this week." action={() => go("/explore?sort=trending")} />
        <div className="track-grid horizontal-on-mobile">
          {approvedTracks.slice(0, 6).map((track) => <TrackCard key={track.id} track={track} active={currentTrack?.id === track.id} playing={playing} onPlay={() => onPlay(track)} />)}
        </div>
      </section>

      <section className="genre-band">
        <div className="page-section container">
          <SectionHeading eyebrow="FIND YOUR SOUND" title="Genres" />
          <div className="genre-grid">
            {genres.map((genre, index) => (
              <button className="genre-card" key={genre.id} onClick={() => go(`/explore?genre=${genre.slug}`)} style={{ background: genre.color, color: genre.accent }}>
                <span className="genre-index">0{index + 1}</span><b>{genre.name}</b><span className="genre-wave"><i/><i/><i/><i/><i/></span><ArrowIcon />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section container releases-section">
        <SectionHeading eyebrow="JUST PUBLISHED" title="New releases" description="Tracks recently approved and published on SoundWave." action={() => go("/explore?sort=newest")} />
        <div className="release-list">
          {approvedTracks.slice(2, 8).map((track, index) => (
            <article className={`track-row ${currentTrack?.id === track.id ? "track-row--active" : ""}`} key={track.id}>
              <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
              <button className="row-cover" onClick={() => onPlay(track)} aria-label={currentTrack?.id === track.id && playing ? `Pause ${track.title}` : `Play ${track.title}`}>
                <img src={track.coverUrl ?? undefined} alt="" />
                <span>{currentTrack?.id === track.id && playing ? <PauseIcon/> : <PlayIcon/>}</span>
              </button>
              <div className="row-song"><a href={`#/track/${track.id}`}>{track.title}</a><a href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a></div>
              <a className="row-album" href={track.album ? `#/album/${track.album.id}` : "#/explore"}>{track.album?.title ?? "Single"}</a>
              <span className="row-duration">{formatDuration(track.durationMs)}</span>
              <button className="icon-button" aria-label={`More options for ${track.title}`}><MoreIcon /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section container">
        <SectionHeading eyebrow="HEAR THE WHOLE STORY" title="Featured albums" action={() => go("/albums")} />
        <div className="album-grid horizontal-on-mobile">
          {albums.map((album) => (
            <a className="album-card" href={`#/album/${album.id}`} key={album.id}>
              <div className="album-art"><img src={album.coverUrl} alt={`${album.title} album cover`} /><span><PlayIcon /></span></div>
              <b>{album.title}</b><span>{album.creatorName} · {album.releaseYear}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="page-section container creator-section">
        <SectionHeading eyebrow="COMMUNITY VOICES" title="Featured creators" description="Meet the people creating their own sound on SoundWave." />
        <div className="creator-grid">
          {featuredCreators.map((creator) => (
            <article className="creator-card" key={creator.userId}>
              <img src={creator.avatarUrl} alt={`${creator.displayName} avatar`} />
              <div><h3>{creator.displayName}</h3><p>{creator.bio}</p><span>{creator.publishedTracks} published tracks</span></div>
              <button className="button button-small button-secondary" onClick={() => go(`/creator/${creator.userId}`)}>View profile</button>
            </article>
          ))}
        </div>
      </section>

      <section className="creator-cta container">
        <div className="cta-decoration" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/></div>
        <div className="cta-content">
          <p className="eyebrow">SHARE YOUR MUSIC</p>
          <h2>Do you have a track ready to be heard?</h2>
          <p>Every SoundWave member can upload music and find an audience.</p>
          <div className="cta-steps"><span><CheckIcon/> Upload</span><i/><span><CheckIcon/> Submit for review</span><i/><span><CheckIcon/> Publish</span></div>
        </div>
        <button className="button button-white button-large" onClick={() => go(isAuthenticated ? "/studio/upload" : "/login")}><UploadIcon/> Upload track</button>
      </section>
    </main>
  );
}
