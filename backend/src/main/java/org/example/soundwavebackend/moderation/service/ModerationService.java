package org.example.soundwavebackend.moderation.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.exception.AccountUnavailableException;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.service.CatalogService;
import org.example.soundwavebackend.lyrics.service.OfficialLyricService;
import org.example.soundwavebackend.moderation.dto.request.ApproveTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.RejectTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.TakeDownTrackRequest;
import org.example.soundwavebackend.moderation.dto.response.SubmissionDetailResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionQueueItemResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionStatsResponse;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.example.soundwavebackend.moderation.exception.InvalidSubmissionStateException;
import org.example.soundwavebackend.moderation.exception.SubmissionNotFoundException;
import org.example.soundwavebackend.moderation.mapper.TrackSubmissionMapper;
import org.example.soundwavebackend.moderation.repository.TrackSubmissionRepository;
import org.example.soundwavebackend.notification.entity.NotificationType;
import org.example.soundwavebackend.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ModerationService {
    private static final String DEFAULT_CREATOR_NAME = "Creator";

    private final TrackSubmissionRepository submissionRepository;
    private final CatalogService catalogService;
    private final NotificationService notificationService;
    private final ModerationMailService mailService;
    private final TrackSubmissionMapper mapper;
    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final OfficialLyricService officialLyricService;

    /**
     * Lấy hàng đợi kiểm duyệt theo trạng thái và từ khóa tìm kiếm.
     */
    @Transactional(readOnly = true)
    public Page<SubmissionQueueItemResponse> getQueue(SubmissionStatus status, String search, Pageable pageable) {
        boolean searchProvided = search != null && !search.isBlank();
        Page<TrackSubmission> page;

        if (searchProvided) {
            String trimmedSearch = search.trim();
            List<Long> matchingTrackIds = catalogService.findTrackIdsByTitle(trimmedSearch);
            List<Long> matchingUserIds = userRepository.findByEmailContainingIgnoreCase(trimmedSearch).stream()
                    .map(AppUser::getId)
                    .toList();

            if (matchingTrackIds.isEmpty() && matchingUserIds.isEmpty()) {
                return Page.empty(pageable);
            }

            Collection<Long> safeTrackIds = matchingTrackIds.isEmpty() ? List.of(-1L) : matchingTrackIds;
            Collection<Long> safeUserIds = matchingUserIds.isEmpty() ? List.of(-1L) : matchingUserIds;
            page = submissionRepository.findByStatusAndMatchingIds(status, safeTrackIds, safeUserIds, pageable);
        } else if (status != null) {
            page = submissionRepository.findByStatus(status, pageable);
        } else {
            page = submissionRepository.findAll(pageable);
        }

        Set<Long> trackIds = page.getContent().stream()
                .map(TrackSubmission::getTrackId)
                .collect(Collectors.toSet());

        Set<Long> userIds = page.getContent().stream()
                .flatMap(s -> Stream.of(s.getSubmittedByUserId(), s.getReviewerUserId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Track> tracksMap = catalogService.findTracksByIds(trackIds);
        Map<Long, UserProfile> profilesMap = userIds.isEmpty() ? Map.of() :
                profileRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
        Map<Long, AppUser> usersMap = userIds.isEmpty() ? Map.of() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(AppUser::getId, Function.identity()));

        return page.map(submission -> {
            Track track = tracksMap.get(submission.getTrackId());
            AppUser submitter = usersMap.get(submission.getSubmittedByUserId());
            UserProfile submitterProfile = profilesMap.get(submission.getSubmittedByUserId());
            AppUser reviewer = submission.getReviewerUserId() != null ? usersMap.get(submission.getReviewerUserId()) : null;
            UserProfile reviewerProfile = submission.getReviewerUserId() != null ? profilesMap.get(submission.getReviewerUserId()) : null;
            return mapper.toQueueItemResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile);
        });
    }

    /**
     * Lấy đầy đủ thông tin một submission để Staff đánh giá.
     */
    @Transactional(readOnly = true)
    public SubmissionDetailResponse getSubmissionDetail(Long id) {
        return buildDetailResponse(findSubmission(id), null);
    }

    /**
     * Thống kê số lượng submission theo trạng thái.
     */
    @Transactional(readOnly = true)
    public SubmissionStatsResponse getQueueStats() {
        long pending = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long approved = submissionRepository.countByStatus(SubmissionStatus.APPROVED);
        long rejected = submissionRepository.countByStatus(SubmissionStatus.REJECTED);
        long total = submissionRepository.count();
        return new SubmissionStatsResponse(pending, approved, rejected, total);
    }

    /**
     * Phê duyệt bài hát đang chờ và phát hành nội dung liên quan.
     */
    @Transactional
    public SubmissionDetailResponse approveSubmission(Long id, ApproveTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = findSubmission(id);
        requireStatus(submission, SubmissionStatus.PENDING, "Track submission is not in PENDING status.");
        AppUser reviewer = findReviewer(reviewerEmail);

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String reviewerNote = request != null ? request.reviewerNote() : null;

        submission.approve(reviewer.getId(), reviewerNote, now);
        Track track = catalogService.approveTrack(submission.getTrackId(), now);
        officialLyricService.publishLyricForTrack(submission.getTrackId(), now);

        notificationService.createNotification(
                submission.getSubmittedByUserId(),
                NotificationType.TRACK_APPROVED,
                "Track approved",
                "Your track \"" + track.getTitle() + "\" has been approved and is now live.",
                "/track/" + track.getId()
        );

        ParticipantContext participants = loadParticipants(submission, reviewer);
        if (participants.submitter() != null) {
            mailService.sendTrackApprovedEmail(
                    participants.submitter().getEmail(),
                    participants.submitterDisplayName(),
                    track.getTitle()
            );
        }
        return toDetailResponse(submission, track, participants);
    }

    /**
     * Từ chối bài hát đang chờ và gửi lý do cho người đăng.
     */
    @Transactional
    public SubmissionDetailResponse rejectSubmission(Long id, RejectTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = findSubmission(id);
        requireStatus(submission, SubmissionStatus.PENDING, "Track submission is not in PENDING status.");
        AppUser reviewer = findReviewer(reviewerEmail);

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String rejectionReason = request.rejectionReason().trim();
        String reviewerNote = request.reviewerNote();

        submission.reject(reviewer.getId(), reviewerNote, rejectionReason, now);
        Track track = catalogService.rejectTrack(submission.getTrackId(), rejectionReason, now);
        officialLyricService.unpublishLyricForTrack(submission.getTrackId(), now);

        notificationService.createNotification(
                submission.getSubmittedByUserId(),
                NotificationType.TRACK_REJECTED,
                "Track rejected",
                "Your track \"" + track.getTitle() + "\" was rejected. Reason: " + rejectionReason,
                "/studio"
        );

        ParticipantContext participants = loadParticipants(submission, reviewer);
        if (participants.submitter() != null) {
            mailService.sendTrackRejectedEmail(
                    participants.submitter().getEmail(),
                    participants.submitterDisplayName(),
                    track.getTitle(),
                    rejectionReason
            );
        }
        return toDetailResponse(submission, track, participants);
    }

    /**
     * Gỡ một bài hát đã duyệt khi Staff xác nhận vi phạm.
     */
    @Transactional
    public SubmissionDetailResponse takeDownSubmission(Long id, TakeDownTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = findSubmission(id);
        requireStatus(submission, SubmissionStatus.APPROVED, "Only approved tracks can be taken down.");
        AppUser reviewer = findReviewer(reviewerEmail);

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        String reason = request.takedownReason().trim();
        String reviewerNote = request.reviewerNote();

        submission.reject(reviewer.getId(), reviewerNote, reason, now);
        Track track = catalogService.takeDownTrack(submission.getTrackId(), reason, now);
        officialLyricService.unpublishLyricForTrack(submission.getTrackId(), now);

        notificationService.createNotification(
                submission.getSubmittedByUserId(),
                NotificationType.TRACK_TAKEN_DOWN,
                "Track taken down",
                "Your track \"" + track.getTitle() + "\" has been taken down. Reason: " + reason,
                "/studio"
        );

        ParticipantContext participants = loadParticipants(submission, reviewer);
        if (participants.submitter() != null) {
            mailService.sendTrackTakenDownEmail(
                    participants.submitter().getEmail(),
                    participants.submitterDisplayName(),
                    track.getTitle(),
                    reason
            );
        }
        return toDetailResponse(submission, track, participants);
    }

    private TrackSubmission findSubmission(Long id) {
        return submissionRepository.findById(id).orElseThrow(() -> new SubmissionNotFoundException(id));
    }

    private AppUser findReviewer(String reviewerEmail) {
        return userRepository.findByEmailIgnoreCase(reviewerEmail)
                .orElseThrow(() -> new AccountUnavailableException("REVIEWER_NOT_FOUND", "Reviewer account not found."));
    }

    private void requireStatus(TrackSubmission submission, SubmissionStatus expectedStatus, String message) {
        if (submission.getStatus() != expectedStatus) {
            throw new InvalidSubmissionStateException(message + " Current status: " + submission.getStatus());
        }
    }

    private SubmissionDetailResponse buildDetailResponse(TrackSubmission submission, AppUser knownReviewer) {
        Track track = catalogService.findTrackById(submission.getTrackId()).orElse(null);
        AppUser reviewer = knownReviewer;
        if (reviewer == null && submission.getReviewerUserId() != null) {
            reviewer = userRepository.findById(submission.getReviewerUserId()).orElse(null);
        }
        return toDetailResponse(submission, track, loadParticipants(submission, reviewer));
    }

    private ParticipantContext loadParticipants(TrackSubmission submission, AppUser reviewer) {
        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        UserProfile reviewerProfile = reviewer == null
                ? null
                : profileRepository.findByUserId(reviewer.getId()).orElse(null);
        return new ParticipantContext(
                submitter,
                submitterProfile,
                reviewer,
                reviewerProfile,
                resolveDisplayName(submitter, submitterProfile)
        );
    }

    private SubmissionDetailResponse toDetailResponse(
            TrackSubmission submission,
            Track track,
            ParticipantContext participants
    ) {
        String lyrics = track == null ? null : officialLyricService.findLyricContentByTrackId(track.getId());
        return mapper.toDetailResponse(
                submission,
                track,
                participants.submitter(),
                participants.submitterProfile(),
                participants.reviewer(),
                participants.reviewerProfile(),
                lyrics
        );
    }

    private String resolveDisplayName(AppUser user, UserProfile profile) {
        if (profile != null && profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName();
        }
        return user == null ? DEFAULT_CREATOR_NAME : user.getEmail();
    }

    private record ParticipantContext(
            AppUser submitter,
            UserProfile submitterProfile,
            AppUser reviewer,
            UserProfile reviewerProfile,
            String submitterDisplayName
    ) {
    }
}
