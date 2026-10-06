package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.lyrics.service.OfficialLyricService;
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
    private OfficialLyricService officialLyricService;

    private CatalogMapper mapper;
    private TrackCatalogService trackCatalogService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        trackCatalogService = new TrackCatalogService(trackRepository, userAccountPublicService, mapper, officialLyricService);
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

    @Test
    void getRecommendations_ShouldPrioritizeGenreAndRemoveDuplicates() {
        Genre popGenre = new Genre("Pop", "pop", "Pop songs", 1L);
        ReflectionTestUtils.setField(popGenre, "id", 3L);
        Track source = createTrack(1L, 50L, popGenre, "Source");
        Track sameGenre = createTrack(2L, 60L, popGenre, "Genre Match");
        Track sameCreator = createTrack(3L, 50L, popGenre, "Creator Match");

        when(trackRepository.findByIdAndPublicationStatus(1L,
                org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED))
                .thenReturn(Optional.of(source));
        when(trackRepository.findByGenre_IdAndPublicationStatusAndIdNotOrderByPlayCountDesc(
                eq(3L), any(), eq(1L), any(Pageable.class)))
                .thenReturn(List.of(sameGenre));
        when(trackRepository.findByUploaderUserIdAndPublicationStatusAndIdNotOrderByPlayCountDesc(
                eq(50L), any(), eq(1L), any(Pageable.class)))
                .thenReturn(List.of(sameGenre, sameCreator));
        when(trackRepository.findByPublicationStatusAndIdNotOrderByPlayCountDesc(
                any(), eq(1L), any(Pageable.class)))
                .thenReturn(List.of(sameCreator));
        when(userAccountPublicService.getUserSummariesByIds(any())).thenReturn(java.util.Map.of(
                50L, new UserProfileSummary(50L, "one@soundwave.com", "One", null, "LISTENER"),
                60L, new UserProfileSummary(60L, "two@soundwave.com", "Two", null, "LISTENER")
        ));

        List<TrackResponse> result = trackCatalogService.getRecommendations("1", 5);

        assertEquals(List.of(2L, 3L), result.stream().map(TrackResponse::id).toList());
    }

    private Track createTrack(Long id, Long uploaderId, Genre genre, String title) {
        Track track = new Track(
                uploaderId,
                genre,
                title,
                title.toLowerCase().replace(" ", "-"),
                "audio-" + id,
                "/audio/" + id + ".mp3",
                "audio/mpeg",
                180000
        );
        ReflectionTestUtils.setField(track, "id", id);
        return track;
    }
}
