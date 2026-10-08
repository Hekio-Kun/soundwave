package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogPublicServiceTest {

    @Mock
    private TrackRepository trackRepository;
    @Mock
    private UserAccountPublicService userAccountPublicService;

    private CatalogMapper mapper;
    private CatalogPublicService catalogPublicService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        catalogPublicService = new CatalogPublicService(trackRepository, userAccountPublicService, mapper);
    }

    @Test
    void trackExists_WhenTrackExists_ShouldReturnTrue() {
        when(trackRepository.existsByIdAndPublicationStatus(10L, org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED)).thenReturn(true);
        assertTrue(catalogPublicService.trackExists(10L));
    }

    @Test
    void trackExists_WhenTrackDoesNotExist_ShouldReturnFalse() {
        when(trackRepository.existsByIdAndPublicationStatus(99L, org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED)).thenReturn(false);
        assertFalse(catalogPublicService.trackExists(99L));
    }

    @Test
    void getTracksByIds_ShouldReturnTracksInRequestedOrder() {
        Genre genre = new Genre("EDM", "edm", "Electronic", 1L);

        Track track1 = new Track(5L, genre, "Beat 1", "beat-1", "audio_1", "/audio/1.mp3", "audio/mpeg", 180000);
        ReflectionTestUtils.setField(track1, "id", 101L);

        Track track2 = new Track(5L, genre, "Beat 2", "beat-2", "audio_2", "/audio/2.mp3", "audio/mpeg", 200000);
        ReflectionTestUtils.setField(track2, "id", 102L);

        when(trackRepository.findByIdInAndPublicationStatus(List.of(102L, 101L), org.example.soundwavebackend.catalog.entity.TrackPublicationStatus.PUBLISHED))
                .thenReturn(List.of(track1, track2));

        UserProfileSummary uploader = new UserProfileSummary(5L, "dj@soundwave.com", "DJ Sound", null, "LISTENER");
        when(userAccountPublicService.getUserSummariesByIds(Set.of(5L))).thenReturn(Map.of(5L, uploader));

        List<TrackResponse> result = catalogPublicService.getTracksByIds(List.of(102L, 101L));

        assertEquals(2, result.size());
        assertEquals(102L, result.get(0).id());
        assertEquals("Beat 2", result.get(0).title());
        assertEquals(101L, result.get(1).id());
        assertEquals("Beat 1", result.get(1).title());
        assertEquals("DJ Sound", result.get(0).creator().displayName());
    }
}
