package org.example.soundwavebackend.moderation.service;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.service.CatalogService;
import org.example.soundwavebackend.lyrics.service.OfficialLyricService;
import org.example.soundwavebackend.moderation.dto.request.ApproveTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.RejectTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.TakeDownTrackRequest;
import org.example.soundwavebackend.moderation.dto.response.SubmissionDetailResponse;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.example.soundwavebackend.moderation.mapper.TrackSubmissionMapper;
import org.example.soundwavebackend.moderation.repository.TrackSubmissionRepository;
import org.example.soundwavebackend.notification.entity.NotificationType;
import org.example.soundwavebackend.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModerationServiceTest {

    @Mock private TrackSubmissionRepository submissionRepository;
    @Mock private CatalogService catalogService;
    @Mock private NotificationService notificationService;
    @Mock private ModerationMailService mailService;
    @Mock private TrackSubmissionMapper mapper;
    @Mock private AppUserRepository userRepository;
    @Mock private UserProfileRepository profileRepository;
    @Mock private OfficialLyricService officialLyricService;

    private ModerationService moderationService;
    private AppUser staffUser;
    private Track testTrack;

    @BeforeEach
    void setUp() {
        moderationService = new ModerationService(
                submissionRepository,
                catalogService,
                notificationService,
                mailService,
                mapper,
                userRepository,
                profileRepository,
                officialLyricService
        );

        Role staffRole = mock(Role.class);
        staffUser = new AppUser(staffRole, "staff@soundwave.com", "hash");
        ReflectionTestUtils.setField(staffUser, "id", 201L);

        Genre genre = new Genre("Rock", "rock", "Rock music", 1L);
        testTrack = new Track(101L, genre, "Awesome Song", "awesome-song", "pub_1", "/audio.mp3", "mp3", 200000);
        ReflectionTestUtils.setField(testTrack, "id", 501L);
    }

    @Test
    void approveSubmission_ShouldApproveAndPublish() {
        TrackSubmission submission = new TrackSubmission(501L, 101L, "Please review");
        ReflectionTestUtils.setField(submission, "id", 10L);

        when(submissionRepository.findById(10L)).thenReturn(Optional.of(submission));
        when(userRepository.findByEmailIgnoreCase("staff@soundwave.com")).thenReturn(Optional.of(staffUser));
        when(catalogService.approveTrack(eq(501L), any())).thenReturn(testTrack);

        moderationService.approveSubmission(10L, new ApproveTrackRequest("Looks good"), "staff@soundwave.com");

        assertEquals(SubmissionStatus.APPROVED, submission.getStatus());
        verify(catalogService).approveTrack(eq(501L), any());
        verify(notificationService).createNotification(
                eq(101L),
                eq(NotificationType.TRACK_APPROVED),
                anyString(),
                anyString(),
                eq("/track/501")
        );
    }

    @Test
    void rejectSubmission_ShouldRejectAndNotify() {
        TrackSubmission submission = new TrackSubmission(501L, 101L, "Please review");
        ReflectionTestUtils.setField(submission, "id", 10L);

        when(submissionRepository.findById(10L)).thenReturn(Optional.of(submission));
        when(userRepository.findByEmailIgnoreCase("staff@soundwave.com")).thenReturn(Optional.of(staffUser));
        when(catalogService.rejectTrack(eq(501L), eq("Distorted audio quality"), any())).thenReturn(testTrack);

        moderationService.rejectSubmission(10L, new RejectTrackRequest("Distorted audio quality", "Fix clipping"), "staff@soundwave.com");

        assertEquals(SubmissionStatus.REJECTED, submission.getStatus());
        verify(catalogService).rejectTrack(eq(501L), eq("Distorted audio quality"), any());
        verify(notificationService).createNotification(
                eq(101L),
                eq(NotificationType.TRACK_REJECTED),
                anyString(),
                anyString(),
                eq("/studio")
        );
    }

    @Test
    void takeDownSubmission_ShouldChangeToTakenDownAndNotify() {
        TrackSubmission submission = new TrackSubmission(501L, 101L, "Please review");
        ReflectionTestUtils.setField(submission, "id", 10L);
        submission.approve(201L, "Approved", null);

        when(submissionRepository.findById(10L)).thenReturn(Optional.of(submission));
        when(userRepository.findByEmailIgnoreCase("staff@soundwave.com")).thenReturn(Optional.of(staffUser));
        when(catalogService.takeDownTrack(eq(501L), eq("Copyright claim by label"), any())).thenReturn(testTrack);

        moderationService.takeDownSubmission(10L, new TakeDownTrackRequest("Copyright claim by label", "Confirmed dmca"), "staff@soundwave.com");

        verify(catalogService).takeDownTrack(eq(501L), eq("Copyright claim by label"), any());
        verify(notificationService).createNotification(
                eq(101L),
                eq(NotificationType.TRACK_TAKEN_DOWN),
                anyString(),
                anyString(),
                eq("/studio")
        );
    }
}
