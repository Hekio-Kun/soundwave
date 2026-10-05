package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.service.LibraryPublicService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackCatalogServiceTest {

    @Mock
    private TrackRepository trackRepository;
    @Mock
    private UserAccountPublicService userAccountPublicService;
    @Mock
    private LibraryPublicService libraryPublicService;

    private CatalogMapper mapper;
    private TrackCatalogService trackCatalogService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        trackCatalogService = new TrackCatalogService(trackRepository, userAccountPublicService, libraryPublicService, mapper);
    }

    @Test
    void getPublishedTracks_ShouldFilterAndResolveCreator() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(
                50L,
                popGenre,
                "Hit Song",
                "hit-song",
                "audio_pub_1",
                "/audio/song.mp3",
                "audio/mpeg",
                210000
        );
        ReflectionTestUtils.setField(track, "id", 1L);

        Page<Track> page = new PageImpl<>(List.of(track));
        when(trackRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        UserProfileSummary userProfileSummary = new UserProfileSummary(
                50L,
                "creator@soundwave.com",
                "Super Artist",
                null,
                "LISTENER"
        );
        when(userAccountPublicService.getUserSummariesByIds(any())).thenReturn(java.util.Map.of(50L, userProfileSummary));

        Page<TrackResponse> result = trackCatalogService.getPublishedTracks("pop", null, "newest", 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        TrackResponse response = result.getContent().get(0);
        assertEquals("Hit Song", response.title());
        assertEquals("pop", response.genreSlug());
        assertEquals("Super Artist", response.creator().displayName());
    }

    @Test
    void getTrackByIdOrSlug_WhenNotFound_ShouldThrowException() {
        when(trackRepository.findById(999L)).thenReturn(Optional.empty());
        when(trackRepository.findBySlugIgnoreCase("999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                trackCatalogService.getTrackByIdOrSlug("999"));
    }

    @Test
    void recordTrackPlay_AsGuest_ShouldIncrementPlayCountWithoutRecordingHistory() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(
                50L,
                popGenre,
                "Hit Song",
                "hit-song",
                "audio_pub_1",
                "/audio/song.mp3",
                "audio/mpeg",
                210000
        );
        ReflectionTestUtils.setField(track, "id", 1L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED);
        ReflectionTestUtils.setField(track, "playCount", 10L);

        when(trackRepository.findById(1L)).thenReturn(Optional.of(track));

        org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest request =
                new org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest(35000, true);

        var response = trackCatalogService.recordTrackPlay(1L, request, null);

        assertEquals(1L, response.trackId());
        assertEquals(11L, response.playCount());
        assertFalse(response.recordedHistory());
        verify(trackRepository).save(track);
        verifyNoInteractions(libraryPublicService);
    }

    @Test
    void recordTrackPlay_AsAuthenticatedUser_ShouldIncrementPlayCountAndRecordHistory() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(
                50L,
                popGenre,
                "Hit Song",
                "hit-song",
                "audio_pub_1",
                "/audio/song.mp3",
                "audio/mpeg",
                210000
        );
        ReflectionTestUtils.setField(track, "id", 2L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED);
        ReflectionTestUtils.setField(track, "playCount", 5L);

        when(trackRepository.findById(2L)).thenReturn(Optional.of(track));
        when(userAccountPublicService.findUserIdByEmail("listener@example.com")).thenReturn(Optional.of(77L));

        org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest request =
                new org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest(45000, false);

        var response = trackCatalogService.recordTrackPlay(2L, request, "listener@example.com");

        assertEquals(2L, response.trackId());
        assertEquals(6L, response.playCount());
        assertTrue(response.recordedHistory());
        verify(trackRepository).save(track);
        verify(libraryPublicService).recordListeningHistory(77L, 2L, 45000, false);
    }

    @Test
    void streamTrackAudio_WhenTrackNotFound_ShouldThrowException() {
        when(trackRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                trackCatalogService.streamTrackAudio(404L, null));
    }

    @Test
    void streamTrackAudio_WhenTrackNotPublished_ShouldThrowException() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(50L, popGenre, "Draft", "draft", "pub", "/audio/test.mp3", "audio/mpeg", 1000);
        ReflectionTestUtils.setField(track, "id", 10L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.DRAFT);

        when(trackRepository.findById(10L)).thenReturn(Optional.of(track));

        assertThrows(ResourceNotFoundException.class, () ->
                trackCatalogService.streamTrackAudio(10L, null));
    }

    @Test
    void streamTrackAudio_WhenAudioSourceMissing_ShouldThrowException() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(50L, popGenre, "No Audio", "no-audio", "pub", "", "audio/mpeg", 1000);
        ReflectionTestUtils.setField(track, "id", 11L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED);

        when(trackRepository.findById(11L)).thenReturn(Optional.of(track));

        assertThrows(ResourceNotFoundException.class, () ->
                trackCatalogService.streamTrackAudio(11L, null));
    }

    @Test
    void streamTrackAudio_WhenLocalFileExists_ShouldReturn206ForRange() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(50L, popGenre, "Demo", "demo", "pub", "audio/soundwave-demo.wav", "audio/wav", 60000);
        ReflectionTestUtils.setField(track, "id", 12L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED);

        when(trackRepository.findById(12L)).thenReturn(Optional.of(track));

        var streamInfo = trackCatalogService.streamTrackAudio(12L, "bytes=0-1023");

        assertNotNull(streamInfo);
        assertEquals(206, streamInfo.statusCode());
        assertEquals("audio/wav", streamInfo.contentType());
        assertNotNull(streamInfo.contentRange());
        assertTrue(streamInfo.contentRange().startsWith("bytes 0-1023/"));
        assertEquals(1024L, streamInfo.contentLength());
        assertNotNull(streamInfo.body());
    }

    @Test
    void streamTrackAudio_WhenLocalFileExists_ShouldReturn200WithoutRange() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        Track track = new Track(50L, popGenre, "Demo", "demo", "pub", "audio/soundwave-demo.wav", "audio/wav", 60000);
        ReflectionTestUtils.setField(track, "id", 13L);
        ReflectionTestUtils.setField(track, "publicationStatus", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED);

        when(trackRepository.findById(13L)).thenReturn(Optional.of(track));

        var streamInfo = trackCatalogService.streamTrackAudio(13L, null);

        assertNotNull(streamInfo);
        assertEquals(200, streamInfo.statusCode());
        assertEquals("audio/wav", streamInfo.contentType());
        assertNull(streamInfo.contentRange());
        assertTrue(streamInfo.contentLength() > 0);
        assertNotNull(streamInfo.body());
    }
}
