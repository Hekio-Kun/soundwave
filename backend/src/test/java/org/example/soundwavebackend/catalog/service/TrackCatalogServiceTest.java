package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
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

    private CatalogMapper mapper;
    private TrackCatalogService trackCatalogService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        trackCatalogService = new TrackCatalogService(trackRepository, userAccountPublicService, mapper);
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
        when(trackRepository.findByIdAndPublicationStatus(999L, org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED))
                .thenReturn(Optional.empty());
        when(trackRepository.findBySlugIgnoreCaseAndPublicationStatus("999", org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                trackCatalogService.getTrackByIdOrSlug("999"));
    }
}
