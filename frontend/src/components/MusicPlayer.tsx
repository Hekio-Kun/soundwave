import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationMs / 1000);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [localQueueOpen, setLocalQueueOpen] = useState(false);
  const [audioError, setAudioError] = useState(false);

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
    if (shuffle && queue.length > 1) {
      const candidates = queue.filter((item) => item.id !== track.id);
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return queue[(index + 1 + queue.length) % queue.length];
  };

  useEffect(() => {
    audio.volume = volume;
  }, [audio, volume]);

  const handleEnded = () => {
    if (repeat) {
      audio.currentTime = 0;
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
    onTrackChange(queue[(index - 1 + queue.length) % queue.length], true);
  };

  const seek = (value: number) => {
    audio.currentTime = value;
    setCurrentTime(value);
  };

  useEffect(() => {
    setCurrentTime(0);
    setDuration(track.durationMs / 1000);
    setAudioError(false);
  }, [track.id, track.durationMs]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(audio.currentTime);
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
    <aside className="music-player" aria-label="Trình phát nhạc">
      <div className="player-track">
        <img src={track.coverUrl ?? undefined} alt={`Ảnh bìa ${track.title}`} />
        <div>
          <a href={`#/track/${track.id}`}>{track.title}</a>
          <a href={`#/creator/${track.creator.userId}`}>{track.creator.displayName}</a>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className={`player-icon ${shuffle ? "player-icon--active" : ""}`} onClick={() => setShuffle((value) => !value)} aria-label={shuffle ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên"}><ShuffleIcon /></button>
          <button className="player-icon" onClick={previous} aria-label="Bài trước"><PreviousIcon /></button>
          <button className="player-play" onClick={() => onPlayingChange(!playing)} aria-label={playing ? "Tạm dừng" : "Phát"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player-icon" onClick={() => onTrackChange(nextTrack(), true)} aria-label="Bài tiếp theo"><NextIcon /></button>
          <button className={`player-icon ${repeat ? "player-icon--active" : ""}`} onClick={() => setRepeat((value) => !value)} aria-label={repeat ? "Tắt lặp lại" : "Bật lặp lại"}><RepeatIcon /></button>
        </div>
        <div className="timeline">
          <span>{formatTime(currentTime)}</span>
          <input type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(currentTime, duration)} onChange={(event) => seek(Number(event.target.value))} aria-label="Tiến trình bài hát" style={{ "--range-progress": `${Math.min((currentTime / Math.max(duration, 1)) * 100, 100)}%` } as CSSProperties} />
          <span>{formatTime(duration)}</span>
        </div>
        {audioError && <span className="audio-error">Không thể tải audio mẫu. Hãy kiểm tra kết nối mạng.</span>}
      </div>

      <div className="player-tools">
        <button className={`player-icon ${isQueueActive ? "player-icon--active" : ""}`} onClick={handleQueueClick} aria-label="Danh sách chờ"><QueueIcon /></button>
        <VolumeIcon />
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Âm lượng" style={{ "--range-progress": `${volume * 100}%` } as CSSProperties} />
      </div>

      {!onToggleQueue && localQueueOpen && (
        <div className="queue-popover">
          <div className="queue-heading"><div><span>TIẾP THEO</span><h3>Danh sách chờ</h3></div><button className="text-button" onClick={() => setLocalQueueOpen(false)}>Đóng</button></div>
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
