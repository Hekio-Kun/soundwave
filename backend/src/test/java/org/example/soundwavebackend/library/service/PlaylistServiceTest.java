package org.example.soundwavebackend.library.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.service.CatalogPublicService;
import org.example.soundwavebackend.exception.ConflictOperationException;
import org.example.soundwavebackend.exception.ForbiddenOperationException;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.dto.request.AddTrackToPlaylistRequest;
import org.example.soundwavebackend.library.dto.request.CreatePlaylistRequest;
import org.example.soundwavebackend.library.dto.response.PlaylistResponse;
import org.example.soundwavebackend.library.entity.Playlist;
import org.example.soundwavebackend.library.mapper.PlaylistMapper;
import org.example.soundwavebackend.library.repository.PlaylistRepository;
import org.example.soundwavebackend.library.repository.PlaylistTrackRepository;
import org.example.soundwavebackend.media.service.CloudMediaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlistRepository;
    @Mock
    private PlaylistTrackRepository playlistTrackRepository;
    @Mock
    private CatalogPublicService catalogPublicService;
    @Mock
    private UserAccountPublicService userAccountPublicService;
    @Mock
    private CloudMediaService cloudMediaService;

    private PlaylistMapper mapper;
    private PlaylistService playlistService;

    @BeforeEach
    void setUp() {
        mapper = new PlaylistMapper();
        playlistService = new PlaylistService(
                playlistRepository,
                playlistTrackRepository,
                catalogPublicService,
                userAccountPublicService,
                mapper,
                cloudMediaService
        );
    }

    @Test
    void createPlaylist_ShouldSucceed() {
        String email = "test@soundwave.com";
        UserProfileSummary user = new UserProfileSummary(10L, email, "Test User", null, "LISTENER");
        when(userAccountPublicService.getUserSummaryByEmail(email)).thenReturn(user);

        CreatePlaylistRequest request = new CreatePlaylistRequest("My Playlist", "Nice songs", true, "https://cover.png");
        Playlist saved = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(saved, "id", 100L);
        when(playlistRepository.save(any(Playlist.class))).thenReturn(saved);

        PlaylistResponse response = playlistService.createPlaylist(request, email);

        assertNotNull(response);
        assertEquals("My Playlist", response.title());
        assertEquals(10L, response.ownerId());
        assertEquals("Test User", response.ownerName());
    }

    @Test
    void getPlaylistById_WhenPrivateAndNotOwner_ShouldThrowForbidden() {
        Playlist playlist = new Playlist(10L, "Secret Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("other@soundwave.com")).thenReturn(20L);

        assertThrows(ForbiddenOperationException.class, () ->
                playlistService.getPlaylistById(100L, "other@soundwave.com"));
    }

    @Test
    void addTrackToPlaylist_WhenTrackNotFoundInCatalog_ShouldThrowNotFound() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("test@soundwave.com")).thenReturn(10L);
        when(catalogPublicService.trackExists(999L)).thenReturn(false);

        AddTrackToPlaylistRequest request = new AddTrackToPlaylistRequest(999L);
        assertThrows(ResourceNotFoundException.class, () ->
                playlistService.addTrackToPlaylist(100L, request, "test@soundwave.com"));
    }

    @Test
    void addTrackToPlaylist_WhenAlreadyAdded_ShouldThrowConflict() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("test@soundwave.com")).thenReturn(10L);
        when(catalogPublicService.trackExists(5L)).thenReturn(true);
        when(playlistTrackRepository.existsByPlaylistIdAndTrackId(100L, 5L)).thenReturn(true);

        AddTrackToPlaylistRequest request = new AddTrackToPlaylistRequest(5L);
        assertThrows(ConflictOperationException.class, () ->
                playlistService.addTrackToPlaylist(100L, request, "test@soundwave.com"));
    }

    @Test
    void deletePlaylist_WhenNotOwner_ShouldThrowForbidden() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("hacker@soundwave.com")).thenReturn(999L);

        assertThrows(ForbiddenOperationException.class, () ->
                playlistService.deletePlaylist(100L, "hacker@soundwave.com"));
    }

    @Test
    void deletePlaylist_WhenOwner_ShouldSucceed() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("owner@soundwave.com")).thenReturn(10L);

        playlistService.deletePlaylist(100L, "owner@soundwave.com");

        verify(playlistTrackRepository).deleteByPlaylistId(100L);
        verify(playlistRepository).delete(playlist);
    }

    @Test
    void removeTrackFromPlaylist_WhenNotOwner_ShouldThrowForbidden() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("stranger@soundwave.com")).thenReturn(999L);

        assertThrows(ForbiddenOperationException.class, () ->
                playlistService.removeTrackFromPlaylist(100L, 5L, "stranger@soundwave.com"));
    }

    @Test
    void removeTrackFromPlaylist_WhenOwner_ShouldDeleteAndReindex() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("owner@soundwave.com")).thenReturn(10L);

        org.example.soundwavebackend.library.entity.PlaylistTrack track1 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 1L, 10L, 1);
        org.example.soundwavebackend.library.entity.PlaylistTrack track2 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 2L, 10L, 2);

        when(playlistTrackRepository.findByPlaylistIdAndTrackId(100L, 1L)).thenReturn(Optional.of(track1));
        when(playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(100L)).thenReturn(new java.util.ArrayList<>(java.util.List.of(track2)));

        PlaylistResponse response = playlistService.removeTrackFromPlaylist(100L, 1L, "owner@soundwave.com");

        assertNotNull(response);
        verify(playlistTrackRepository).delete(track1);
        verify(playlistTrackRepository).flush();
        verify(playlistTrackRepository, atLeastOnce()).saveAll(any());
        assertEquals(1, track2.getPosition());
    }

    @Test
    void reorderPlaylistTracks_WhenOwnerSwapUp_ShouldSwapPositions() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("owner@soundwave.com")).thenReturn(10L);

        org.example.soundwavebackend.library.entity.PlaylistTrack pt1 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 1L, 10L, 1);
        org.example.soundwavebackend.library.entity.PlaylistTrack pt2 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 2L, 10L, 2);

        when(playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(100L))
                .thenReturn(new java.util.ArrayList<>(java.util.List.of(pt1, pt2)));

        org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest req =
                new org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest(2L, "UP", null);

        PlaylistResponse response = playlistService.reorderPlaylistTracks(100L, req, "owner@soundwave.com");

        assertNotNull(response);
        assertEquals(2, pt1.getPosition());
        assertEquals(1, pt2.getPosition());
    }

    @Test
    void reorderPlaylistTracks_WhenOwnerWithList_ShouldReorderCorrectly() {
        Playlist playlist = new Playlist(10L, "My Playlist");
        ReflectionTestUtils.setField(playlist, "id", 100L);
        when(playlistRepository.findById(100L)).thenReturn(Optional.of(playlist));
        when(userAccountPublicService.getUserIdByEmail("owner@soundwave.com")).thenReturn(10L);

        org.example.soundwavebackend.library.entity.PlaylistTrack pt1 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 1L, 10L, 1);
        org.example.soundwavebackend.library.entity.PlaylistTrack pt2 =
                new org.example.soundwavebackend.library.entity.PlaylistTrack(100L, 2L, 10L, 2);

        when(playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(100L))
                .thenReturn(new java.util.ArrayList<>(java.util.List.of(pt1, pt2)));

        org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest req =
                new org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest(null, null, java.util.List.of(2L, 1L));

        PlaylistResponse response = playlistService.reorderPlaylistTracks(100L, req, "owner@soundwave.com");

        assertNotNull(response);
        assertEquals(1, pt2.getPosition());
        assertEquals(2, pt1.getPosition());
    }
}
