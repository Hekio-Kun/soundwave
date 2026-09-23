import { useEffect, useMemo, useState } from "react";
import { demoPlaylists, demoUser, initialStudioTracks, tracks } from "./data";
import { GuestLoginPrompt } from "./components/GuestLoginPrompt";
import { MusicPlayer } from "./components/MusicPlayer";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { MusicAppShell } from "./layouts/MusicAppShell";
import { useMotionReveal } from "./hooks/useMotionReveal";
import { AlbumDetailsPage } from "./pages/AlbumDetailsPage";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "./pages/AuthPages";
import { CreatorProfilePage } from "./pages/CreatorProfilePage";
import { ExplorePage } from "./pages/ExplorePage";
import { GenresPage } from "./pages/GenresPage";
import { LibraryPage } from "./pages/LibraryPage";
import { AdminDashboardPage, DashboardAccessDenied, StaffDashboardPage } from "./pages/OperationsDashboardPage";
import { SearchPage } from "./pages/SearchPage";
import { StudioPage } from "./pages/StudioPage";
import { TrackDetailsPage } from "./pages/TrackDetailsPage";
import { VerifyEmailPage, type EmailVerificationStatus } from "./pages/VerifyEmailPage";
import type { CurrentUser, LandingTrack, Playlist, StudioTrack } from "./types";

export default function App() {
  // 1. Authentication State
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem("soundwave_user");
    if (saved) {
      try {
        return JSON.parse(saved) as CurrentUser;
      } catch {
        // ignore parse error
      }
    }
    if (localStorage.getItem("soundwave_demo_user") === "authenticated") {
      return demoUser;
    }
    return null;
  });

  const isAuthenticated = Boolean(user);

  const handleLoginSuccess = ({ email }: { email: string; password: string }) => {
    // Tạm mô phỏng vai trò do backend trả về sau khi xác thực tài khoản.
    const normalizedEmail = email.toLowerCase();
    const role: CurrentUser["role"] = normalizedEmail.startsWith("admin")
      ? "ADMIN"
      : normalizedEmail.startsWith("staff")
        ? "STAFF"
        : "USER";
    const loggedInUser: CurrentUser = {
      ...demoUser,
      email: normalizedEmail,
      displayName: role === "ADMIN" ? "Admin SoundWave" : role === "STAFF" ? "Staff SoundWave" : demoUser.displayName,
      role,
    };
    setUser(loggedInUser);
    localStorage.setItem("soundwave_user", JSON.stringify(loggedInUser));
    localStorage.setItem("soundwave_demo_user", "authenticated");
    window.location.hash = role === "ADMIN" ? "#/admin/dashboard" : role === "STAFF" ? "#/staff/dashboard" : "#/";
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("soundwave_user");
    localStorage.removeItem("soundwave_demo_user");
    window.location.hash = "#/";
  };

  // 2. Audio & Player State
  const audio = useMemo(() => new Audio(tracks[0].audioUrl), []);
  const [currentTrack, setCurrentTrack] = useState<LandingTrack | null>(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [queue, setQueue] = useState<LandingTrack[]>(tracks);
  const [queueOpen, setQueueOpen] = useState(false);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<LandingTrack | null>(null);

  useEffect(() => () => audio.pause(), [audio]);

  const setAudioPlaying = (shouldPlay: boolean) => {
    if (shouldPlay) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const playTrack = (track: LandingTrack, autoplay = true) => {
    if (currentTrack?.id === track.id) {
      setAudioPlaying(!playing);
      return;
    }
    setCurrentTrack(track);
    // Ensure track is in queue
    if (!queue.some((item) => item.id === track.id)) {
      setQueue((prev) => [track, ...prev]);
    }
    audio.src = track.audioUrl;
    audio.load();
    if (autoplay) setAudioPlaying(true);
    else setPlaying(false);
  };

  const handleGuestTrackEnded = (next: LandingTrack) => {
    setPendingTrack(next);
    setGuestPromptOpen(true);
  };

  const continueListening = () => {
    setGuestPromptOpen(false);
    if (pendingTrack) {
      playTrack(pendingTrack, true);
    }
    setPendingTrack(null);
  };

  // Queue manipulation
  const handleRemoveFromQueue = (trackId: number) => {
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleClearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
  };

  // 3. Library & Favorites & Playlists State
  const [favoriteIds, setFavoriteIds] = useState<number[]>([1, 2]);
  const [playlists, setPlaylists] = useState<Playlist[]>(demoPlaylists);
  const [isNewPlaylistModalOpen, setIsNewPlaylistModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  const toggleFavorite = (trackId: number) => {
    setFavoriteIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleCreatePlaylist = (title: string, description?: string) => {
    const newPl: Playlist = {
      id: Date.now(),
      title,
      description: description || "Custom playlist",
      coverUrl: "/pics/album.png",
      trackCount: 0,
      isPrivate: false,
      ownerId: user?.id ?? 1,
      ownerName: user?.displayName || "You",
      creatorName: user?.displayName || "You",
      createdAt: "Just now",
      trackIds: [],
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  const handleAddToPlaylist = (playlistId: number, trackId: number) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
          return { ...pl, trackIds: [...pl.trackIds, trackId] };
        }
        return pl;
      })
    );
  };

  const handleDeletePlaylist = (playlistId: number) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  };

  // 4. Studio Tracks State
  const [studioTracks, setStudioTracks] = useState<StudioTrack[]>(initialStudioTracks);

  const handleUploadTrack = (newTrackData: Omit<StudioTrack, "id" | "createdAt">) => {
    const newTrack: StudioTrack = {
      ...newTrackData,
      id: Date.now(),
      createdAt: "Today",
    };
    setStudioTracks((prev) => [newTrack, ...prev]);
  };

  const handleSubmitForReview = (trackId: number) => {
    setStudioTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, status: "PENDING" as const } : t))
    );
  };

  // 5. Routing State
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  useMotionReveal(route);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    const target = path.startsWith("#") ? path : `#${path.startsWith("/") ? path : `/${path}`}`;
    window.location.hash = target;
  };

  // Parse path & query params
  const cleanRoute = route.startsWith("#") ? route.slice(1) : route;
  const [pathname, queryString] = cleanRoute.split("?");
  const queryParams = useMemo(() => new URLSearchParams(queryString || ""), [queryString]);

  // Determine layout type
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isDashboardRoute = pathname.startsWith("/admin") || pathname.startsWith("/staff");
  const isMusicRoute = !isAuthRoute && !isDashboardRoute;

  useEffect(() => {
    if (isDashboardRoute) {
      audio.pause();
      setPlaying(false);
    }
  }, [audio, isDashboardRoute]);

  // Render Page Content
  const renderContent = () => {
    // Marketing Routes
    if (pathname === "/login") {
      return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    }
    if (pathname === "/register") {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (pathname === "/verify-email") {
      const statusParam = queryParams.get("status");
      const status: EmailVerificationStatus =
        statusParam === "verifying" || statusParam === "expired" || statusParam === "invalid"
          ? statusParam
          : "success";
      return (
        <VerifyEmailPage
          email={queryParams.get("email") || "you@example.com"}
          status={status}
          onNavigate={navigate}
        />
      );
    }
    if (pathname === "/forgot-password") {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    if (pathname === "/reset-password") {
      return <ResetPasswordPage onNavigate={navigate} />;
    }

    // App Routes
    if (pathname === "/" || pathname === "" || pathname === "/home" || pathname === "/explore" || pathname === "/landing") {
      const initialGenre = queryParams.get("genre") || undefined;
      const sort = queryParams.get("sort");
      const initialSort = sort === "newest" ? "newest" : sort === "trending" ? "trending" : undefined;
      return (
        <ExplorePage
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
          initialGenre={initialGenre}
          initialSort={initialSort}
        />
      );
    }

    if (pathname === "/search") {
      const query = queryParams.get("q") || "";
      return (
        <SearchPage
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
          initialQuery={query}
        />
      );
    }

    if (pathname === "/genres") {
      return <GenresPage onNavigate={navigate} />;
    }

    if (pathname.startsWith("/track/")) {
      const trackId = Number(pathname.split("/")[2]) || 1;
      return (
        <TrackDetailsPage
          trackId={trackId}
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
          onToggleFavorite={toggleFavorite}
          isFavorited={favoriteIds.includes(trackId)}
          playlists={playlists}
          onAddToPlaylist={handleAddToPlaylist}
        />
      );
    }

    if (pathname.startsWith("/album/")) {
      const albumId = Number(pathname.split("/")[2]) || 1;
      return (
        <AlbumDetailsPage
          albumId={albumId}
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
        />
      );
    }

    if (pathname.startsWith("/creator/")) {
      const creatorId = Number(pathname.split("/")[2]) || 101;
      return (
        <CreatorProfilePage
          creatorId={creatorId}
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/profile") {
      return (
        <CreatorProfilePage
          creatorId={user?.userId ?? 101}
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/library" || pathname === "/favorites") {
      return (
        <LibraryPage
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          playlists={playlists}
          onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
          onDeletePlaylist={handleDeletePlaylist}
          initialTab="favorites"
        />
      );
    }

    if (pathname === "/playlists") {
      return (
        <LibraryPage
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          playlists={playlists}
          onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
          onDeletePlaylist={handleDeletePlaylist}
          initialTab="playlists"
        />
      );
    }

    if (pathname === "/studio") {
      return (
        <StudioPage
          tracks={studioTracks}
          onUploadTrack={handleUploadTrack}
          onSubmitForReview={handleSubmitForReview}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/admin" || pathname === "/admin/dashboard") {
      return user?.role === "ADMIN"
        ? <AdminDashboardPage onNavigate={navigate} />
        : <DashboardAccessDenied onNavigate={navigate} />;
    }

    if (pathname === "/staff" || pathname === "/staff/dashboard") {
      return user?.role === "STAFF" || user?.role === "ADMIN"
        ? <StaffDashboardPage onNavigate={navigate} />
        : <DashboardAccessDenied onNavigate={navigate} />;
    }

    // Default fallback to Explore
    return (
      <ExplorePage
        currentTrack={currentTrack}
        playing={playing}
        onPlayTrack={playTrack}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className={isMusicRoute ? "app-root app-root--has-player" : "app-root"}>
      {isAuthRoute ? (
        <div key={route} className="app-route-stage app-route-stage--auth">
          {renderContent()}
        </div>
      ) : isDashboardRoute ? (
        <DashboardLayout
          activeRoute={pathname}
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
        >
          <div key={route} className="app-route-stage app-route-stage--dashboard">
            {renderContent()}
          </div>
        </DashboardLayout>
      ) : (
        <MusicAppShell
          activeRoute={pathname}
          onNavigate={navigate}
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
          queueOpen={queueOpen}
          onCloseQueue={() => setQueueOpen(false)}
          currentTrack={currentTrack}
          playing={playing}
          queue={queue}
          onPlayTrack={playTrack}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClearQueue={handleClearQueue}
          hasPlayer
        >
          <div key={route} className="app-route-stage app-route-stage--music">
            {renderContent()}
          </div>
        </MusicAppShell>
      )}

      {/* Global Music Player fixed at bottom */}
      {isMusicRoute && currentTrack && (
        <MusicPlayer
          track={currentTrack}
          queue={queue}
          audio={audio}
          playing={playing}
          onPlayingChange={(shouldPlay) => setAudioPlaying(shouldPlay)}
          onTrackChange={playTrack}
          onGuestTrackEnded={handleGuestTrackEnded}
          isAuthenticated={isAuthenticated}
          onToggleQueue={() => setQueueOpen((prev) => !prev)}
          isQueueOpen={queueOpen}
        />
      )}

      {/* Guest Login Prompt Modal */}
      <GuestLoginPrompt
        open={guestPromptOpen}
        onContinue={continueListening}
        onLogin={() => {
          setGuestPromptOpen(false);
          navigate("/login");
        }}
      />

      {/* Global Create Playlist Modal */}
      {isNewPlaylistModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewPlaylistModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create playlist</h2>
              <button
                className="icon-button"
                onClick={() => setIsNewPlaylistModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlaylistTitle.trim()) return;
                handleCreatePlaylist(newPlaylistTitle.trim(), newPlaylistDesc.trim());
                setNewPlaylistTitle("");
                setNewPlaylistDesc("");
                setIsNewPlaylistModalOpen(false);
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label htmlFor="playlist-title">Name</label>
                <input
                  id="playlist-title"
                  type="text"
                  required
                  placeholder="For example: Weekend relaxation"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="playlist-desc">Description (optional)</label>
                <input
                  id="playlist-desc"
                  type="text"
                  placeholder="Add a description for your playlist"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setIsNewPlaylistModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
