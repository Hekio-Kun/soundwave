import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AuthSession } from "./api/auth";
import { catalogApi } from "./api/catalog";
import { clearAccessToken, setAccessToken } from "./api/client";
import { favoriteApi } from "./api/favorites";
import type { ProfileDetails } from "./api/profile";
import { playlistApi } from "./api/playlists";
import { demoPlaylists, demoUser, initialStudioTracks, tracks } from "./data";
import { GuestLoginPrompt } from "./components/GuestLoginPrompt";
import { LogoutConfirmationDialog } from "./components/LogoutConfirmationDialog";
import { MusicPlayer } from "./components/MusicPlayer";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { MusicAppShell } from "./layouts/MusicAppShell";
import { useMotionReveal } from "./hooks/useMotionReveal";
import { AlbumDetailsPage } from "./pages/AlbumDetailsPage";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "./pages/AuthPages";
import { CreatorProfilePage } from "./pages/CreatorProfilePage";
import { ExplorePage } from "./pages/ExplorePage";
import { FilteredCatalogPage } from "./pages/FilteredCatalogPage";
import { GenresPage } from "./pages/GenresPage";
import { LibraryPage } from "./pages/LibraryPage";
import { PlaylistDetailsPage } from "./pages/PlaylistDetailsPage";
import { PlaylistFormModal } from "./components/PlaylistFormModal";
import { AddTrackToPlaylistModal } from "./components/AddTrackToPlaylistModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { AdminDashboardPage, DashboardAccessDenied, StaffDashboardPage } from "./pages/OperationsDashboardPage";
import { AdminGenreManagementPage } from "./pages/AdminGenreManagementPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { StudioPage } from "./pages/StudioPage";
import { TrackDetailsPage } from "./pages/TrackDetailsPage";
import { UploadTrackPage } from "./pages/UploadTrackPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import type { CurrentUser, LandingTrack, Playlist } from "./types";

export default function App() {
  // 1. Authentication State
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const isAuthenticated = Boolean(user);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");

  useEffect(() => {
    let active = true;
    localStorage.removeItem("soundwave_user");
    localStorage.removeItem("soundwave_access_token");
    sessionStorage.removeItem("soundwave_user");
    sessionStorage.removeItem("soundwave_access_token");

    void authApi.refresh()
      .then((session) => {
        if (active) setUser(session.user);
      })
      .catch(() => {
        clearAccessToken();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!logoutNotice) return;
    const timeoutId = window.setTimeout(() => setLogoutNotice(""), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [logoutNotice]);

  const handleLoginSuccess = (session: AuthSession, _rememberMe: boolean) => {
    const loggedInUser: CurrentUser = {
      ...session.user,
      avatarUrl: session.user.avatarUrl,
    };
    setAccessToken(session.accessToken);
    setUser(loggedInUser);
    localStorage.removeItem("soundwave_user");
    localStorage.removeItem("soundwave_access_token");
    sessionStorage.removeItem("soundwave_user");
    sessionStorage.removeItem("soundwave_access_token");
    window.location.hash = session.user.role === "ADMIN" ? "#/admin/dashboard" : session.user.role === "STAFF" ? "#/staff/dashboard" : "#/";
  };

  const handleProfileUpdated = useCallback((profile: ProfileDetails) => {
    setUser((current) => {
      if (!current) return current;
      const updatedUser: CurrentUser = {
        ...current,
        id: profile.userId,
        userId: profile.userId,
        email: profile.email,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        bio: profile.bio ?? undefined,
        dateOfBirth: profile.dateOfBirth ?? undefined,
        countryCode: profile.countryCode ?? undefined,
      };
      return updatedUser;
    });
  }, []);
  const handleLogout = () => setLogoutDialogOpen(true);

  const confirmLogout = async () => {
    setLogoutSubmitting(true);
    let serverSessionRevoked = true;
    try {
      await authApi.logout();
    } catch {
      serverSessionRevoked = false;
    } finally {
      setUser(null);
      clearAccessToken();
      localStorage.removeItem("soundwave_user");
      localStorage.removeItem("soundwave_access_token");
      sessionStorage.removeItem("soundwave_user");
      sessionStorage.removeItem("soundwave_access_token");
      setLogoutSubmitting(false);
      setLogoutDialogOpen(false);
      setLogoutNotice(serverSessionRevoked
        ? "You have logged out successfully."
        : "You have been logged out from this device.");
      window.location.hash = "#/";
    }
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
  const [favoriteTracks, setFavoriteTracks] = useState<LandingTrack[]>([]);
  const favoriteIds = useMemo(() => favoriteTracks.map((track) => track.id), [favoriteTracks]);

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("soundwave_playlists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { }
    }
    return demoPlaylists;
  });

  // Fetch playlists from backend on mount and auth state change
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        if (user?.role === "LISTENER") {
          const myPlaylists = await playlistApi.getMyPlaylists();
          setPlaylists(myPlaylists ?? []);
        } else if (!isAuthenticated) {
          const publicPlaylists = await playlistApi.getPublicPlaylists();
          setPlaylists(publicPlaylists ?? []);
        } else {
          setPlaylists([]);
        }
      } catch {
        // Fallback to local storage or demo playlists
      }
    };
    loadPlaylists();
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    localStorage.setItem("soundwave_playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    let active = true;
    if (!authReady || user?.role !== "LISTENER") {
      setFavoriteTracks([]);
      return () => { active = false; };
    }

    void favoriteApi.getFavorites()
      .then((items) => {
        if (active) setFavoriteTracks(items);
      })
      .catch(() => {
        if (active) setFavoriteTracks([]);
      });

    return () => { active = false; };
  }, [authReady, user?.id, user?.role]);

  const [playlistFormOpen, setPlaylistFormOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [addTrackPlaylistId, setAddTrackPlaylistId] = useState<number | null>(null);
  const [deletePlaylistId, setDeletePlaylistId] = useState<number | null>(null);

  const toggleFavorite = async (trackId: number) => {
    if (user?.role !== "LISTENER") {
      throw new Error("Log in with a Listener account to manage favorites.");
    }

    if (favoriteIds.includes(trackId)) {
      await favoriteApi.removeFavorite(trackId);
      setFavoriteTracks((previous) => previous.filter((track) => track.id !== trackId));
      return;
    }

    await favoriteApi.addFavorite(trackId);
    const favoriteTrack = await catalogApi.getTrackById(trackId);
    setFavoriteTracks((previous) => [favoriteTrack, ...previous.filter((track) => track.id !== trackId)]);
  };

  const handleOpenCreatePlaylist = () => {
    setEditingPlaylist(null);
    setPlaylistFormOpen(true);
  };

  const handleOpenEditPlaylist = (pl: Playlist) => {
    setEditingPlaylist(pl);
    setPlaylistFormOpen(true);
  };

  const handleSavePlaylist = async (data: {
    title: string;
    description: string;
    isPrivate: boolean;
    coverUrl: string;
  }) => {
    if (editingPlaylist) {
      try {
        const updated = await playlistApi.updatePlaylist(editingPlaylist.id, data);
        setPlaylists((prev) =>
          prev.map((p) => (p.id === editingPlaylist.id ? updated : p))
        );
      } catch {
        // Fallback local
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === editingPlaylist.id
              ? {
                ...p,
                title: data.title,
                description: data.description,
                isPrivate: data.isPrivate,
                coverUrl: data.coverUrl,
              }
              : p
          )
        );
      }
      setEditingPlaylist(null);
    } else {
      try {
        const created = await playlistApi.createPlaylist(data);
        setPlaylists((prev) => [created, ...prev]);
      } catch {
        // Fallback local
        const newPl: Playlist = {
          id: Date.now(),
          title: data.title,
          description: data.description,
          isPrivate: data.isPrivate,
          coverUrl: data.coverUrl,
          trackCount: 0,
          ownerId: user?.id ?? 1,
          ownerName: user?.displayName || "You",
          creatorName: user?.displayName || "You",
          createdAt: "Just now",
          trackIds: [],
        };
        setPlaylists((prev) => [newPl, ...prev]);
      }
    }
  };

  const handleConfirmDeletePlaylist = async () => {
    if (!deletePlaylistId) return;
    const targetId = deletePlaylistId;
    try {
      await playlistApi.deletePlaylist(targetId);
    } catch {
      // Local fallback
    }
    setPlaylists((prev) => prev.filter((pl) => pl.id !== targetId));
    setDeletePlaylistId(null);
    if (window.location.hash.includes(`/playlist/${targetId}`)) {
      window.location.hash = "#/playlists";
    }
  };

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    const updated = await playlistApi.addTrackToPlaylist(playlistId, trackId);
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === playlistId ? updated : pl))
    );
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: number, trackId: number) => {
    try {
      const updated = await playlistApi.removeTrackFromPlaylist(playlistId, trackId);
      setPlaylists((prev) =>
        prev.map((pl) => (pl.id === playlistId ? updated : pl))
      );
    } catch (err) {
      // Fallback local
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            const nextTracks = pl.trackIds.filter((id) => id !== trackId);
            return {
              ...pl,
              trackIds: nextTracks,
              tracks: pl.tracks ? pl.tracks.filter((t) => t.id !== trackId) : undefined,
              trackCount: nextTracks.length,
            };
          }
          return pl;
        })
      );
      throw err;
    }
  };

  const handleReorderPlaylistTracks = async (
    playlistId: number,
    trackId: number,
    direction: "up" | "down"
  ) => {
    try {
      const updated = await playlistApi.reorderPlaylistTracks(playlistId, {
        trackId,
        direction,
      });
      setPlaylists((prev) =>
        prev.map((pl) => (pl.id === playlistId ? updated : pl))
      );
    } catch (err) {
      // Fallback local
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id === playlistId) {
            const idx = pl.trackIds.indexOf(trackId);
            if (idx === -1) return pl;
            const targetIdx = direction === "up" ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= pl.trackIds.length) return pl;
            const copy = [...pl.trackIds];
            const [moved] = copy.splice(idx, 1);
            copy.splice(targetIdx, 0, moved);

            let nextTracks = pl.tracks ? [...pl.tracks] : undefined;
            if (nextTracks && nextTracks.length === pl.trackIds.length) {
              const [movedTrack] = nextTracks.splice(idx, 1);
              nextTracks.splice(targetIdx, 0, movedTrack);
            }

            return { ...pl, trackIds: copy, tracks: nextTracks };
          }
          return pl;
        })
      );
      throw err;
    }
  };

  const handlePlayAllTracks = (tracksToPlay: LandingTrack[]) => {
    if (!tracksToPlay.length) return;
    setQueue(tracksToPlay);
    playTrack(tracksToPlay[0], true);
  };

  // 4. Routing State
  const [route, setRoute] = useState(() => window.location.hash || "#/");

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

  useMotionReveal(pathname);

  // Determine layout type
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isDashboardRoute = pathname.startsWith("/admin") || pathname.startsWith("/staff");
  const isMusicRoute = !isAuthRoute && !isDashboardRoute;
  const isExploreRoute =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/home" ||
    pathname === "/explore" ||
    pathname === "/landing";

  useEffect(() => {
    if (isDashboardRoute) {
      audio.pause();
      setPlaying(false);
    }
  }, [audio, isDashboardRoute]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated && pathname.startsWith("/studio")) {
      window.location.hash = "#/login";
      return;
    }
    if (user?.role === "STAFF") {
      if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/" ||
        pathname === "" ||
        pathname.startsWith("/admin")
      ) {
        window.location.hash = "#/staff/dashboard";
      }
    } else if (user?.role === "ADMIN") {
      if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/staff")
      ) {
        window.location.hash = "#/admin/dashboard";
      }
    }
  }, [authReady, isAuthenticated, user, pathname]);

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
      return (
        <VerifyEmailPage
          email={queryParams.get("email") || "you@example.com"}
          onNavigate={navigate}
        />
      );
    }
    if (pathname === "/forgot-password") {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    if (pathname === "/reset-password") {
      return <ResetPasswordPage email={queryParams.get("email") || ""} onNavigate={navigate} />;
    }

    // App Routes
    if (isExploreRoute) {
      return (
        <ExplorePage
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/browse" || pathname === "/catalog" || pathname === "/filter") {
      const initialGenre = queryParams.get("genre") || undefined;
      const sort = queryParams.get("sort");
      const initialSort = sort === "newest" ? "newest" : sort === "trending" ? "trending" : sort === "title" ? "title" : undefined;
      return (
        <FilteredCatalogPage
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

    if (pathname.startsWith("/track/") || pathname.startsWith("/tracks/")) {
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
          canManageLibrary={user?.role === "LISTENER"}
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
      return user
        ? <ProfilePage onProfileUpdated={handleProfileUpdated} />
        : (
          <div className="state-page">
            <span className="state-icon">!</span>
            <h1>Log in to manage your profile</h1>
            <p>Your profile settings are available after authentication.</p>
            <button className="button button-primary" onClick={() => navigate("/login")}>Go to login</button>
          </div>
        );
    }

    if (pathname.startsWith("/playlist/")) {
      const playlistId = Number(pathname.split("/")[2]) || 1;
      return (
        <PlaylistDetailsPage
          playlistId={playlistId}
          playlists={playlists}
          currentTrack={currentTrack}
          playing={playing}
          onPlayTrack={playTrack}
          onPlayAll={handlePlayAllTracks}
          onNavigate={navigate}
          onEditPlaylist={handleOpenEditPlaylist}
          onDeletePlaylist={(id) => setDeletePlaylistId(id)}
          onRemoveTrack={handleRemoveTrackFromPlaylist}
          onReorderTracks={handleReorderPlaylistTracks}
          onOpenAddTrackModal={() => setAddTrackPlaylistId(playlistId)}
          currentUser={user}
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
          favoriteTracks={favoriteTracks}
          onToggleFavorite={toggleFavorite}
          playlists={playlists}
          onCreatePlaylist={handleOpenCreatePlaylist}
          onEditPlaylist={handleOpenEditPlaylist}
          onDeletePlaylist={(id) => setDeletePlaylistId(id)}
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
          favoriteTracks={favoriteTracks}
          onToggleFavorite={toggleFavorite}
          playlists={playlists}
          onCreatePlaylist={handleOpenCreatePlaylist}
          onEditPlaylist={handleOpenEditPlaylist}
          onDeletePlaylist={(id) => setDeletePlaylistId(id)}
          initialTab="playlists"
        />
      );
    }

    if (pathname === "/studio/upload") {
      if (!authReady || !isAuthenticated) return null;
      return (
        <UploadTrackPage
          isAuthenticated={isAuthenticated}
          canUpload={user?.role === "LISTENER"}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/studio") {
      if (!authReady || !isAuthenticated) return null;
      return (
        <StudioPage
          tracks={initialStudioTracks}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === "/admin/genres") {
      return user?.role === "ADMIN"
        ? <AdminGenreManagementPage />
        : <DashboardAccessDenied onNavigate={navigate} requiredRole="Administrator" />;
    }

    if (pathname === "/admin" || pathname === "/admin/dashboard") {
      return user?.role === "ADMIN"
        ? <AdminDashboardPage onNavigate={navigate} />
        : <DashboardAccessDenied onNavigate={navigate} requiredRole="Administrator" />;
    }

    if (
      pathname === "/staff" ||
      pathname === "/staff/dashboard" ||
      pathname.startsWith("/staff/submissions/") ||
      pathname.startsWith("/staff/moderation/")
    ) {
      const parts = pathname.split("/");
      const submissionId =
        pathname.startsWith("/staff/submissions/") || pathname.startsWith("/staff/moderation/")
          ? Number(parts[3]) || null
          : null;
      return user?.role === "STAFF" || user?.role === "ADMIN"
        ? <StaffDashboardPage onNavigate={navigate} initialSubmissionId={submissionId} />
        : <DashboardAccessDenied onNavigate={navigate} requiredRole="Moderation Staff" />;
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
        <div key={pathname} className="app-route-stage app-route-stage--auth">
          {renderContent()}
        </div>
      ) : isDashboardRoute ? (
        <DashboardLayout
          activeRoute={pathname}
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
        >
          <div key={pathname} className="app-route-stage app-route-stage--dashboard">
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
          onCreatePlaylist={handleOpenCreatePlaylist}
          queueOpen={queueOpen}
          onCloseQueue={() => setQueueOpen(false)}
          currentTrack={currentTrack}
          playing={playing}
          queue={queue}
          onPlayTrack={playTrack}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClearQueue={handleClearQueue}
          hasPlayer
          showFooter={isExploreRoute}
        >
          <div key={pathname} className="app-route-stage app-route-stage--music">
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

      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        submitting={logoutSubmitting}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
      />

      {logoutNotice ? <div className="app-toast" role="status">{logoutNotice}</div> : null}

      {/* Playlist Create / Edit Modal (UC-15.1, UC-15.3) */}
      <PlaylistFormModal
        open={playlistFormOpen}
        onClose={() => {
          setPlaylistFormOpen(false);
          setEditingPlaylist(null);
        }}
        playlist={editingPlaylist}
        onSave={handleSavePlaylist}
      />

      {/* Add Track to Playlist Modal */}
      <AddTrackToPlaylistModal
        open={Boolean(addTrackPlaylistId)}
        onClose={() => setAddTrackPlaylistId(null)}
        playlistTitle={playlists.find((p) => p.id === addTrackPlaylistId)?.title ?? "Playlist"}
        currentTrackIds={playlists.find((p) => p.id === addTrackPlaylistId)?.trackIds ?? []}
        onAddTrack={(trackId) => {
          if (addTrackPlaylistId) {
            handleAddToPlaylist(addTrackPlaylistId, trackId);
          }
        }}
      />

      {/* Delete Playlist Confirmation Modal (UC-15.4) */}
      <DeleteConfirmationModal
        open={Boolean(deletePlaylistId)}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This will remove the playlist permanently, but tracks will remain in the catalog."
        confirmLabel="Delete Playlist"
        onConfirm={handleConfirmDeletePlaylist}
        onCancel={() => setDeletePlaylistId(null)}
      />
    </div>
  );
}
