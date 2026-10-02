import { useEffect, type ReactNode } from "react";
import { AppTopBar } from "../components/AppTopBar";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { QueueDrawer } from "../components/QueueDrawer";
import { Sidebar } from "../components/Sidebar";
import { SoundWaveFooter } from "../components/SoundWaveFooter";
import type { CurrentUser, LandingTrack } from "../types";

type Props = {
  children: ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  onLogout: () => void;
  onCreatePlaylist: () => void;
  // Queue state
  queueOpen: boolean;
  onCloseQueue: () => void;
  currentTrack: LandingTrack | null;
  playing: boolean;
  queue: LandingTrack[];
  onPlayTrack: (track: LandingTrack) => void;
  onRemoveFromQueue: (trackId: number) => void;
  onClearQueue: () => void;
  hasPlayer: boolean;
};

export function MusicAppShell({
  children,
  activeRoute,
  onNavigate,
  user,
  isAuthenticated,
  onLogout,
  onCreatePlaylist,
  queueOpen,
  onCloseQueue,
  currentTrack,
  playing,
  queue,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  hasPlayer,
}: Props) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.getElementById("app-scroll-region")?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeRoute]);

  return (
    <div className={`music-app-shell ${hasPlayer ? "music-app-shell--with-player" : ""} ${queueOpen ? "music-app-shell--queue-open" : ""}`}>
      {/* 1. Left Sidebar */}
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onCreatePlaylist={onCreatePlaylist}
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
      />

      {/* 2. Main Workspace (Top bar + Dynamic Content) */}
      <div className="app-main-viewport">
        <AppTopBar
          user={user}
          isAuthenticated={isAuthenticated}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <div className="app-scroll-region" id="app-scroll-region">
          <main className="app-content-body" id="app-content-body">
            {children}
          </main>
          <div className="app-shell-footer">
            <SoundWaveFooter hasPlayer={false} />
          </div>
        </div>
      </div>

      {/* 3. Right Queue Drawer (Optional / Toggleable) */}
      <QueueDrawer
        isOpen={queueOpen}
        onClose={onCloseQueue}
        currentTrack={currentTrack}
        playing={playing}
        queue={queue}
        onPlayTrack={onPlayTrack}
        onRemoveFromQueue={onRemoveFromQueue}
        onClearQueue={onClearQueue}
      />

      {/* 4. Mobile Bottom Navigation */}
      <MobileBottomNav activeRoute={activeRoute} onNavigate={onNavigate} userRole={user?.role} />
    </div>
  );
}
