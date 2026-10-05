package org.example.soundwavebackend.track.service;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.repository.AlbumRepository;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.media.dto.response.StoredAudioResponse;
import org.example.soundwavebackend.media.service.CloudMediaService;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.example.soundwavebackend.moderation.repository.TrackSubmissionRepository;
import org.example.soundwavebackend.track.dto.request.CreateTrackRequest;
import org.example.soundwavebackend.track.dto.request.SubmitTrackForReviewRequest;
import org.example.soundwavebackend.track.dto.request.UpdateTrackRequest;
import org.example.soundwavebackend.track.dto.response.StudioTrackResponse;
import org.example.soundwavebackend.track.dto.response.TrackRejectionDetailsResponse;
import org.example.soundwavebackend.track.exception.TrackOperationNotAllowedException;
import org.example.soundwavebackend.track.mapper.TrackMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudioTrackServiceTest {
    @Mock private TrackRepository trackRepository;
    @Mock private TrackSubmissionRepository submissionRepository;
    @Mock private GenreRepository genreRepository;
    @Mock private AlbumRepository albumRepository;
    @Mock private AppUserRepository userRepository;
    @Mock private org.example.soundwavebackend.lyrics.service.OfficialLyricService officialLyricService;
    @Mock private CloudMediaService cloudMediaService;

    private StudioTrackService service;
    private AppUser testUser;
    private Genre testGenre;

    @BeforeEach
    void setUp() {
        TrackMapper mapper = new TrackMapper();
        service = new StudioTrackService(trackRepository, submissionRepository, genreRepository,
                albumRepository, userRepository, mapper, officialLyricService, cloudMediaService);

        Role role = mock(Role.class);
        testUser = new AppUser(role, "creator@soundwave.com", "hash");
        ReflectionTestUtils.setField(testUser, "id", 101L);

        testGenre = new Genre("Pop", "pop", "Pop music", 1L);
        ReflectionTestUtils.setField(testGenre, "id", 1L);
    }

    @Test
    void createTrackDraft_success() {
        CreateTrackRequest request = new CreateTrackRequest("Song 1", 1L, null, null, "Desc",
                180000, "Sample lyrics line 1\nSample lyrics line 2");
        MockMultipartFile audio = new MockMultipartFile(
                "audio", "song.mp3", "audio/mpeg", new byte[]{'I', 'D', '3', 0x01});

        when(userRepository.findByEmailIgnoreCase("creator@soundwave.com")).thenReturn(Optional.of(testUser));
        when(genreRepository.findById(1L)).thenReturn(Optional.of(testGenre));
        when(trackRepository.existsBySlug(anyString())).thenReturn(false);
        when(cloudMediaService.uploadTrackAudio(audio, 101L))
                .thenReturn(new StoredAudioResponse("pub_audio_1", "https://media/song.mp3", "mp3", 180000));
        when(trackRepository.saveAndFlush(any(Track.class))).thenAnswer(inv -> {
            Track t = inv.getArgument(0);
            ReflectionTestUtils.setField(t, "id", 501L);
            return t;
        });

        StudioTrackResponse response = service.createTrackDraft(request, audio, null, "creator@soundwave.com");

        assertNotNull(response);
        assertEquals(501L, response.id());
        assertEquals("Song 1", response.title());
        assertEquals("DRAFT", response.status());
        assertEquals("https://media/song.mp3", response.audioUrl());
        assertEquals("Sample lyrics line 1\nSample lyrics line 2", response.lyrics());
        verify(trackRepository).saveAndFlush(any(Track.class));
        verify(cloudMediaService).uploadTrackAudio(audio, 101L);
        verify(officialLyricService).saveOrUpdateTrackLyric(eq(501L), eq(request.lyrics()), eq(101L));
    }

    @Test
    void submitForReview_success() {
        Track draftTrack = new Track(101L, testGenre, "Song 1", "song-1", "pub_1", "/audio/demo.mp3", "mp3", 180000);
        ReflectionTestUtils.setField(draftTrack, "id", 501L);

        when(userRepository.findByEmailIgnoreCase("creator@soundwave.com")).thenReturn(Optional.of(testUser));
        when(trackRepository.findByIdAndUploaderUserId(501L, 101L)).thenReturn(Optional.of(draftTrack));
        when(submissionRepository.save(any(TrackSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        StudioTrackResponse response = service.submitForReview(501L, new SubmitTrackForReviewRequest("Ready"), "creator@soundwave.com");

        assertNotNull(response);
        assertEquals("PENDING", response.status());
        verify(submissionRepository).save(any(TrackSubmission.class));
    }

    @Test
    void deleteTrack_notAllowedWhenPublished() {
        Track publishedTrack = new Track(101L, testGenre, "Song 1", "song-1", "pub_1", "/audio/demo.mp3", "mp3", 180000);
        ReflectionTestUtils.setField(publishedTrack, "id", 501L);
        ReflectionTestUtils.setField(publishedTrack, "publicationStatus", TrackPublicationStatus.PUBLISHED);

        when(userRepository.findByEmailIgnoreCase("creator@soundwave.com")).thenReturn(Optional.of(testUser));
        when(trackRepository.findByIdAndUploaderUserId(501L, 101L)).thenReturn(Optional.of(publishedTrack));

        assertThrows(TrackOperationNotAllowedException.class, () ->
                service.deleteTrack(501L, "creator@soundwave.com"));
        verify(trackRepository, never()).delete(any());
    }

    @Test
    void getRejectionDetails_success() {
        Track rejectedTrack = new Track(101L, testGenre, "Song 1", "song-1", "pub_1", "/audio/demo.mp3", "mp3", 180000);
        ReflectionTestUtils.setField(rejectedTrack, "id", 501L);
        ReflectionTestUtils.setField(rejectedTrack, "publicationStatus", TrackPublicationStatus.REJECTED);
        ReflectionTestUtils.setField(rejectedTrack, "latestRejectionReason", "Poor audio quality");

        TrackSubmission rejectedSub = new TrackSubmission(501L, 101L, "Initial");
        rejectedSub.reject(201L, "Audio clipping detected", "Poor audio quality", null);

        when(userRepository.findByEmailIgnoreCase("creator@soundwave.com")).thenReturn(Optional.of(testUser));
        when(trackRepository.findByIdAndUploaderUserId(501L, 101L)).thenReturn(Optional.of(rejectedTrack));
        when(submissionRepository.findFirstByTrackIdAndStatusOrderBySubmittedAtDesc(501L, SubmissionStatus.REJECTED))
                .thenReturn(Optional.of(rejectedSub));

        TrackRejectionDetailsResponse details = service.getRejectionDetails(501L, "creator@soundwave.com");

        assertNotNull(details);
        assertEquals("Poor audio quality", details.rejectionReason());
        assertEquals("Audio clipping detected", details.reviewerNote());
    }
}
