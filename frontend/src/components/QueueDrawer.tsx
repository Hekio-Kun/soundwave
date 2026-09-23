import { useState } from "react";
import { CloseIcon, PauseIcon, PlayIcon, TrashIcon } from "../icons";
import type { LandingTrack } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: LandingTrack | null;
  playing: boolean;
  queue: LandingTrack[];
  onPlayTrack: (track: LandingTrack) => void;
  onRemoveFromQueue: (trackId: number) => void;
  onClearQueue: () => void;
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function QueueDrawer({
  isOpen,
  onClose,
  currentTrack,
  playing,
  queue,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
}: Props) {
  const [tab, setTab] = useState<"queue" | "recent">("queue");

  const nextTracks = currentTrack ? queue.filter((t) => t.id !== currentTrack.id) : queue;

  return (
    <aside className={`queue-drawer ${isOpen ? "queue-drawer--open" : ""}`} aria-label="Playback queue">
      <div className="queue-drawer-header">
        <div className="queue-drawer-tabs">
          <button
            className={`queue-tab ${tab === "queue" ? "queue-tab--active" : ""}`}
            onClick={() => setTab("queue")}
          >
            Queue ({queue.length})
          </button>
          <button
            className={`queue-tab ${tab === "recent" ? "queue-tab--active" : ""}`}
            onClick={() => setTab("recent")}
          >
            Recently played
          </button>
        </div>

        <button className="icon-button queue-close-btn" onClick={onClose} aria-label="Close queue">
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <div className="queue-drawer-body">
        {currentTrack && (
          <div className="queue-now-playing">
            <span className="queue-section-label">NOW PLAYING</span>
            <div className="queue-track-card queue-track-card--active">
              <div className="queue-track-cover">
                <img src={currentTrack.coverUrl ?? undefined} alt="" />
                <span className="queue-playing-indicator" aria-label="Now playing">
                  <i /><i /><i />
                </span>
              </div>
              <div className="queue-track-info">
                <p className="queue-track-title">{currentTrack.title}</p>
                <p className="queue-track-artist">{currentTrack.creator.displayName}</p>
              </div>
              <span className="queue-track-duration">{formatDuration(currentTrack.durationMs)}</span>
            </div>
          </div>
        )}

        <div className="queue-next-section">
          <div className="queue-next-header">
            <span className="queue-section-label">NEXT TRACKS</span>
            {nextTracks.length > 0 && (
              <button className="queue-clear-btn" onClick={onClearQueue}>
                Clear queue
              </button>
            )}
          </div>

          {nextTracks.length === 0 ? (
            <div className="queue-empty-state">
              <p>There are no upcoming tracks.</p>
              <small>Add tracks from your Library or Explore.</small>
            </div>
          ) : (
            <div className="queue-track-list">
              {nextTracks.map((item, index) => (
                <div key={`${item.id}-${index}`} className="queue-track-card">
                  <div className="queue-track-cover" onClick={() => onPlayTrack(item)}>
                    <img src={item.coverUrl ?? undefined} alt="" />
                    <button className="queue-play-hover-btn" aria-label={`Play ${item.title}`}>
                      <PlayIcon width={14} height={14} />
                    </button>
                  </div>
                  <div className="queue-track-info" onClick={() => onPlayTrack(item)}>
                    <p className="queue-track-title">{item.title}</p>
                    <p className="queue-track-artist">{item.creator.displayName}</p>
                  </div>
                  <span className="queue-track-duration">{formatDuration(item.durationMs)}</span>
                  <button
                    className="queue-remove-btn"
                    onClick={() => onRemoveFromQueue(item.id)}
                    aria-label={`Remove ${item.title} from queue`}
                  >
                    <TrashIcon width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
