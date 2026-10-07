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
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ModerationService {
    private final TrackSubmissionRepository submissionRepository;
    private final CatalogService catalogService;
    private final NotificationService notificationService;
    private final ModerationMailService mailService;
    private final TrackSubmissionMapper mapper;
    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final OfficialLyricService officialLyricService;

    @Transactional(readOnly = true)
    public Page<SubmissionQueueItemResponse> getQueue(SubmissionStatus status, String search, Pageable pageable) {
        boolean searchProvided = search != null && !search.trim().isBlank();
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

    @Transactional(readOnly = true)
    public SubmissionDetailResponse getSubmissionDetail(Long id) {
        TrackSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new SubmissionNotFoundException(id));

        Track track = catalogService.findTrackById(submission.getTrackId()).orElse(null);
        String lyrics = track != null ? officialLyricService.findLyricContentByTrackId(track.getId()) : null;
        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        AppUser reviewer = submission.getReviewerUserId() != null ?
                userRepository.findById(submission.getReviewerUserId()).orElse(null) : null;
        UserProfile reviewerProfile = submission.getReviewerUserId() != null ?
                profileRepository.findByUserId(submission.getReviewerUserId()).orElse(null) : null;

        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile, lyrics);
    }

    @Transactional(readOnly = true)
    public SubmissionStatsResponse getQueueStats() {
        long pending = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long approved = submissionRepository.countByStatus(SubmissionStatus.APPROVED);
        long rejected = submissionRepository.countByStatus(SubmissionStatus.REJECTED);
        long total = submissionRepository.count();
        return new SubmissionStatsResponse(pending, approved, rejected, total);
    }

    @Transactional
    public SubmissionDetailResponse approveSubmission(Long id, ApproveTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new SubmissionNotFoundException(id));

        if (submission.getStatus() != SubmissionStatus.PENDING) {
            throw new InvalidSubmissionStateException("Track submission is not in PENDING status. Current status: " + submission.getStatus());
        }

        AppUser reviewer = userRepository.findByEmailIgnoreCase(reviewerEmail)
                .orElseThrow(() -> new AccountUnavailableException("REVIEWER_NOT_FOUND", "Reviewer account not found."));

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

        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        String submitterDisplayName = submitterProfile != null && submitterProfile.getDisplayName() != null && !submitterProfile.getDisplayName().isBlank()
                ? submitterProfile.getDisplayName() : (submitter != null ? submitter.getEmail() : "Creator");

        if (submitter != null) {
            mailService.sendTrackApprovedEmail(submitter.getEmail(), submitterDisplayName, track.getTitle());
        }

        UserProfile reviewerProfile = profileRepository.findByUserId(reviewer.getId()).orElse(null);
        String lyrics = track != null ? officialLyricService.findLyricContentByTrackId(track.getId()) : null;
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile, lyrics);
    }

    @Transactional
    public SubmissionDetailResponse rejectSubmission(Long id, RejectTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new SubmissionNotFoundException(id));

        if (submission.getStatus() != SubmissionStatus.PENDING) {
            throw new InvalidSubmissionStateException("Track submission is not in PENDING status. Current status: " + submission.getStatus());
        }

        AppUser reviewer = userRepository.findByEmailIgnoreCase(reviewerEmail)
                .orElseThrow(() -> new AccountUnavailableException("REVIEWER_NOT_FOUND", "Reviewer account not found."));

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

        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        String submitterDisplayName = submitterProfile != null && submitterProfile.getDisplayName() != null && !submitterProfile.getDisplayName().isBlank()
                ? submitterProfile.getDisplayName() : (submitter != null ? submitter.getEmail() : "Creator");

        if (submitter != null) {
            mailService.sendTrackRejectedEmail(submitter.getEmail(), submitterDisplayName, track.getTitle(), rejectionReason);
        }

        UserProfile reviewerProfile = profileRepository.findByUserId(reviewer.getId()).orElse(null);
        String lyrics = track != null ? officialLyricService.findLyricContentByTrackId(track.getId()) : null;
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile, lyrics);
    }

    @Transactional
    public SubmissionDetailResponse takeDownSubmission(Long id, TakeDownTrackRequest request, String reviewerEmail) {
        TrackSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new SubmissionNotFoundException(id));

        if (submission.getStatus() != SubmissionStatus.APPROVED) {
            throw new InvalidSubmissionStateException("Only approved tracks can be taken down. Current status: " + submission.getStatus());
        }

        AppUser reviewer = userRepository.findByEmailIgnoreCase(reviewerEmail)
                .orElseThrow(() -> new AccountUnavailableException("REVIEWER_NOT_FOUND", "Reviewer account not found."));

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

        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        String submitterDisplayName = submitterProfile != null && submitterProfile.getDisplayName() != null && !submitterProfile.getDisplayName().isBlank()
                ? submitterProfile.getDisplayName() : (submitter != null ? submitter.getEmail() : "Creator");

        if (submitter != null) {
            mailService.sendTrackTakenDownEmail(submitter.getEmail(), submitterDisplayName, track.getTitle(), reason);
        }

        UserProfile reviewerProfile = profileRepository.findByUserId(reviewer.getId()).orElse(null);
        String lyrics = track != null ? officialLyricService.findLyricContentByTrackId(track.getId()) : null;
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile, lyrics);
    }
}
