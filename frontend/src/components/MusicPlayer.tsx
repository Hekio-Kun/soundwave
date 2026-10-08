import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon, QueueIcon, RepeatIcon, ShuffleIcon, VolumeIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  track: LandingTrack;
  queue: LandingTrack[];
  audio: HTMLAudioElement;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onTrackChange: (track: LandingTrack, autoplay?: boolean) => void;
  onGuestTrackEnded: (next: LandingTrack) => void;
  isAuthenticated: boolean;
  onToggleQueue?: () => void;
  isQueueOpen?: boolean;
  onRecordPlay?: (trackId: number, listenedDurationMs: number, completed: boolean) => void;
  playbackContext?: string | null;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
};

export function MusicPlayer({
  track,
  queue,
  audio,
  playing,
  onPlayingChange,
  onTrackChange,
  onGuestTrackEnded,
  isAuthenticated,
  onToggleQueue,
  isQueueOpen,
  onRecordPlay,
  playbackContext,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationMs / 1000);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [localQueueOpen, setLocalQueueOpen] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const recordedRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);

  const isQueueActive = isQueueOpen !== undefined ? isQueueOpen : localQueueOpen;
  const handleQueueClick = () => {
    if (onToggleQueue) {
      onToggleQueue();
    } else {
      setLocalQueueOpen((prev) => !prev);
    }
  };

  const index = useMemo(() => queue.findIndex((item) => item.id === track.id), [queue, track.id]);
  const nextTrack = () => {
    if (!queue.length) return track;
    if (shuffle && queue.length > 1) {
      const candidates = queue.filter((item) => item.id !== track.id);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    const curIdx = index >= 0 ? index : 0;
    return queue[(curIdx + 1) % queue.length];
  };

  useEffect(() => {
    audio.volume = volume;
  }, [audio, volume]);

  const handleEnded = () => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      onRecordPlay?.(track.id, Math.round(audio.currentTime * 1000), true);
    }
    if (repeat) {
      audio.currentTime = 0;
      recordedRef.current = false;
      void audio.play();
      return;
    }
    const next = nextTrack();
    onPlayingChange(false);
    if (isAuthenticated) onTrackChange(next, true);
    else onGuestTrackEnded(next);
  };

  const previous = () => {
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    if (!queue.length) return;
    const curIdx = index >= 0 ? index : 0;
    onTrackChange(queue[(curIdx - 1 + queue.length) % queue.length], true);
  };

  const seek = (value: number) => {
    audio.currentTime = value;
    setCurrentTime(value);
  };

  useEffect(() => {
    setCurrentTime(0);
    setDuration(track.durationMs / 1000);
    setAudioError(false);
    recordedRef.current = false;
    lastTimeRef.current = null;
  }, [track.id, track.durationMs]);

  useEffect(() => {
    const updateTime = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // BR-08: Listening event is counted when valid-play condition is met (>= 30s or >= 50% duration)
      if (!recordedRef.current && playing && cur > 0) {
        const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.durationMs / 1000;
        const threshold = Math.min(30, dur * 0.5);
        if (cur >= threshold) {
          recordedRef.current = true;
          onRecordPlay?.(track.id, Math.round(cur * 1000), false);
        }
      }
    };

    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : track.durationMs / 1000);
    const reportError = () => setAudioError(true);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", reportError);
    if (audio.readyState >= 1) updateDuration();
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", reportError);
    };
  });

  return (
    <aside className={`music-player ${playing ? "music-player--playing" : ""}`} aria-label="Music player">
      <div className="player-track">
        <img src={track.coverUrl ?? undefined} alt={`${track.title} cover`} />
        <div>
          <a href={`#/track/${track.id}`}>{track.title}</a>
          <a href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a>
          {playbackContext && (
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--brand, #0891b2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
                lineHeight: 1.3,
                marginTop: "2px",
              }}
              title={playbackContext}
            >
              {playbackContext}
            </span>
          )}
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className={`player-icon ${shuffle ? "player-icon--active" : ""}`} onClick={() => setShuffle((value) => !value)} aria-label={shuffle ? "Turn shuffle off" : "Turn shuffle on"}><ShuffleIcon /></button>
          <button className="player-icon" onClick={previous} aria-label="Previous"><PreviousIcon /></button>
          <button className="player-play" onClick={() => onPlayingChange(!playing)} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player-icon" onClick={() => onTrackChange(nextTrack(), true)} aria-label="Next"><NextIcon /></button>
          <button className={`player-icon ${repeat ? "player-icon--active" : ""}`} onClick={() => setRepeat((value) => !value)} aria-label={repeat ? "Turn repeat off" : "Turn repeat on"}><RepeatIcon /></button>
        </div>
        <div className="timeline">
          <span>{formatTime(currentTime)}</span>
          <input type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(currentTime, duration)} onChange={(event) => seek(Number(event.target.value))} aria-label="Progress" style={{ "--range-progress": `${Math.min((currentTime / Math.max(duration, 1)) * 100, 100)}%` } as CSSProperties} />
          <span>{formatTime(duration)}</span>
        </div>
        {audioError && <span className="audio-error">The audio could not be loaded. Check your network connection.</span>}
      </div>

      <div className="player-tools">
        <button className={`player-icon ${isQueueActive ? "player-icon--active" : ""}`} onClick={handleQueueClick} aria-label="Queue"><QueueIcon /></button>
        <VolumeIcon />
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" style={{ "--range-progress": `${volume * 100}%` } as CSSProperties} />
      </div>

      {!onToggleQueue && localQueueOpen && (
        <div className="queue-popover">
          <div className="queue-heading">
            <div>
              <span>PLAYING FROM</span>
              <h3>{playbackContext || "Queue"}</h3>
            </div>
            <button className="text-button" onClick={() => setLocalQueueOpen(false)}>Close</button>
          </div>
          <div className="queue-list">
            {queue.map((item) => (
              <button key={item.id} className={item.id === track.id ? "queue-item queue-item--active" : "queue-item"} onClick={() => onTrackChange(item, true)}>
                <img src={item.coverUrl ?? undefined} alt="" />
                <span><b>{item.title}</b><small>{item.creator.displayName}</small></span>
                <small>{formatTime(item.durationMs / 1000)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
