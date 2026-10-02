package org.example.soundwavebackend.track.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.exception.AccountUnavailableException;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.catalog.entity.Album;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.repository.AlbumRepository;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.example.soundwavebackend.moderation.repository.TrackSubmissionRepository;
import org.example.soundwavebackend.lyrics.service.OfficialLyricService;
import org.example.soundwavebackend.track.dto.request.CreateTrackRequest;
import org.example.soundwavebackend.track.dto.request.SubmitTrackForReviewRequest;
import org.example.soundwavebackend.track.dto.request.UpdateTrackRequest;
import org.example.soundwavebackend.track.dto.response.*;
import org.example.soundwavebackend.track.exception.AlbumNotFoundException;
import org.example.soundwavebackend.track.exception.GenreNotFoundException;
import org.example.soundwavebackend.track.exception.TrackNotFoundException;
import org.example.soundwavebackend.track.exception.TrackOperationNotAllowedException;
import org.example.soundwavebackend.track.mapper.TrackMapper;
import org.example.soundwavebackend.track.repository.TrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service điều phối nghiệp vụ quản lý bài hát cá nhân (Content Studio) dành cho Listener / Creator:
 * Tạo bản nháp, cập nhật, xóa, nộp kiểm duyệt và xem lý do từ chối.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudioTrackService {
    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final TrackRepository trackRepository;
    private final TrackSubmissionRepository submissionRepository;
    private final GenreRepository genreRepository;
    private final AlbumRepository albumRepository;
    private final AppUserRepository userRepository;
    private final TrackMapper trackMapper;
    private final OfficialLyricService officialLyricService;

    /**
     * Tạo bài hát mới ở trạng thái DRAFT cho người dùng hiện tại (UC-19.1).
     */
    @Transactional
    public StudioTrackResponse createTrackDraft(CreateTrackRequest request, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Genre genre = genreRepository.findById(request.genreId())
                .filter(Genre::isActive)
                .orElseThrow(GenreNotFoundException::new);

        Album album = null;
        if (request.albumId() != null) {
            album = albumRepository.findByIdAndCreatedByUserId(request.albumId(), user.getId())
                    .orElseThrow(AlbumNotFoundException::new);
        }

        String slug = generateUniqueSlug(request.title());
        String audioUrl = request.audioUrl() != null && !request.audioUrl().isBlank()
                ? request.audioUrl().trim()
                : "/audio/soundwave-demo.wav";
        String audioPublicId = request.audioPublicId() != null && !request.audioPublicId().isBlank()
                ? request.audioPublicId().trim()
                : "audio_" + UUID.randomUUID();
        String audioFormat = request.audioFormat() != null && !request.audioFormat().isBlank()
                ? request.audioFormat().trim().toLowerCase(Locale.ROOT)
                : "mp3";
        Integer durationMs = request.durationMs() != null && request.durationMs() > 0
                ? request.durationMs()
                : 240000;

        Track track = new Track(
                user.getId(),
                genre,
                album,
                request.title().trim(),
                slug,
                request.description() != null ? request.description().trim() : null,
                request.trackNumber(),
                audioPublicId,
                audioUrl,
                audioFormat,
                durationMs,
                request.coverPublicId(),
                request.coverUrl()
        );

        Track savedTrack = trackRepository.save(track);
        if (request.lyrics() != null && !request.lyrics().isBlank()) {
            officialLyricService.saveOrUpdateTrackLyric(savedTrack.getId(), request.lyrics(), user.getId());
        }
        log.info("Created draft track ID: {} by user: {}", savedTrack.getId(), user.getEmail());
        return trackMapper.toStudioTrackResponse(savedTrack, null, request.lyrics());
    }

    /**
     * Lấy danh sách bài hát cá nhân theo bộ lọc trạng thái (UC-19.2).
     */
    @Transactional(readOnly = true)
    public List<StudioTrackResponse> getMyTracks(String statusFilter, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        List<Track> tracks;

        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter.trim())) {
            try {
                TrackPublicationStatus status = TrackPublicationStatus.valueOf(statusFilter.trim().toUpperCase(Locale.ROOT));
                tracks = trackRepository.findByUploaderUserIdAndPublicationStatusOrderByCreatedAtDesc(user.getId(), status);
            } catch (IllegalArgumentException e) {
                tracks = trackRepository.findByUploaderUserIdOrderByCreatedAtDesc(user.getId());
            }
        } else {
            tracks = trackRepository.findByUploaderUserIdOrderByCreatedAtDesc(user.getId());
        }

        return tracks.stream()
                .map(track -> {
                    TrackSubmission latestSubmission = submissionRepository
                            .findFirstByTrackIdOrderBySubmittedAtDesc(track.getId())
                            .orElse(null);
                    String lyrics = officialLyricService.findLyricContentByTrackId(track.getId());
                    return trackMapper.toStudioTrackResponse(track, latestSubmission, lyrics);
                })
                .toList();
    }

    /**
     * Lấy chi tiết một bài hát thuộc quyền sở hữu của người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public StudioTrackResponse getMyTrackById(Long trackId, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Track track = trackRepository.findByIdAndUploaderUserId(trackId, user.getId())
                .orElseThrow(TrackNotFoundException::new);
        TrackSubmission latestSubmission = submissionRepository
                .findFirstByTrackIdOrderBySubmittedAtDesc(track.getId())
                .orElse(null);
        String lyrics = officialLyricService.findLyricContentByTrackId(track.getId());
        return trackMapper.toStudioTrackResponse(track, latestSubmission, lyrics);
    }

    /**
     * Cập nhật thông tin bài hát đang ở trạng thái DRAFT hoặc REJECTED (UC-19.3).
     */
    @Transactional
    public StudioTrackResponse updateTrack(Long trackId, UpdateTrackRequest request, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Track track = trackRepository.findByIdAndUploaderUserId(trackId, user.getId())
                .orElseThrow(TrackNotFoundException::new);

        if (!track.isEditable()) {
            throw new TrackOperationNotAllowedException("Only DRAFT or REJECTED tracks can be updated.");
        }

        Genre genre = genreRepository.findById(request.genreId())
                .filter(Genre::isActive)
                .orElseThrow(GenreNotFoundException::new);

        Album album = null;
        if (request.albumId() != null) {
            album = albumRepository.findByIdAndCreatedByUserId(request.albumId(), user.getId())
                    .orElseThrow(AlbumNotFoundException::new);
        }

        String slug = track.getTitle().equalsIgnoreCase(request.title().trim())
                ? track.getSlug()
                : generateUniqueSlug(request.title().trim());

        track.updateDraftDetails(
                request.title().trim(),
                slug,
                genre,
                album,
                request.description() != null ? request.description().trim() : null,
                request.trackNumber(),
                request.audioPublicId(),
                request.audioUrl(),
                request.audioFormat(),
                request.durationMs(),
                request.coverPublicId(),
                request.coverUrl(),
                nowUtc()
        );

        Track updatedTrack = trackRepository.save(track);
        if (request.lyrics() != null) {
            officialLyricService.saveOrUpdateTrackLyric(updatedTrack.getId(), request.lyrics(), user.getId());
        }
        log.info("Updated track ID: {} by user: {}", updatedTrack.getId(), user.getEmail());
        TrackSubmission latestSubmission = submissionRepository
                .findFirstByTrackIdOrderBySubmittedAtDesc(track.getId())
                .orElse(null);
        String lyrics = officialLyricService.findLyricContentByTrackId(updatedTrack.getId());
        return trackMapper.toStudioTrackResponse(updatedTrack, latestSubmission, lyrics);
    }

    /**
     * Xóa bài hát chưa duyệt (DRAFT hoặc REJECTED) thuộc quyền sở hữu (UC-19.4).
     */
    @Transactional
    public void deleteTrack(Long trackId, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Track track = trackRepository.findByIdAndUploaderUserId(trackId, user.getId())
                .orElseThrow(TrackNotFoundException::new);

        if (!track.isDeletable()) {
            throw new TrackOperationNotAllowedException("Only unapproved tracks (DRAFT or REJECTED) can be deleted.");
        }

        List<TrackSubmission> submissions = submissionRepository.findByTrackIdOrderBySubmittedAtDesc(track.getId());
        if (!submissions.isEmpty()) {
            submissionRepository.deleteAll(submissions);
        }

        officialLyricService.deleteByTrackId(track.getId());
        trackRepository.delete(track);
        log.info("Deleted track ID: {} by user: {}", trackId, user.getEmail());
    }

    /**
     * Nộp bài hát cho Staff kiểm duyệt (UC-19.5).
     */
    @Transactional
    public StudioTrackResponse submitForReview(Long trackId, SubmitTrackForReviewRequest request, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Track track = trackRepository.findByIdAndUploaderUserId(trackId, user.getId())
                .orElseThrow(TrackNotFoundException::new);

        if (track.getPublicationStatus() == TrackPublicationStatus.PENDING) {
            throw new TrackOperationNotAllowedException("Track is already pending moderation review.");
        }
        if (track.getPublicationStatus() == TrackPublicationStatus.PUBLISHED) {
            throw new TrackOperationNotAllowedException("Track is already published.");
        }
        if (track.getAudioUrl() == null || track.getAudioUrl().isBlank()) {
            throw new TrackOperationNotAllowedException("Cannot submit track without audio file.");
        }
        if (track.getGenre() == null) {
            throw new TrackOperationNotAllowedException("Cannot submit track without music genre.");
        }

        LocalDateTime now = nowUtc();
        track.submitForReview(now);
        trackRepository.save(track);

        String note = request != null && request.submitterNote() != null ? request.submitterNote().trim() : null;
        TrackSubmission submission = new TrackSubmission(track.getId(), user.getId(), note);
        TrackSubmission savedSubmission = submissionRepository.save(submission);

        log.info("Submitted track ID: {} for review. Submission ID: {}", track.getId(), savedSubmission.getId());
        String lyrics = officialLyricService.findLyricContentByTrackId(track.getId());
        return trackMapper.toStudioTrackResponse(track, savedSubmission, lyrics);
    }

    /**
     * Lấy lý do và ghi chú chi tiết từ chối duyệt từ Staff (UC-20).
     */
    @Transactional(readOnly = true)
    public TrackRejectionDetailsResponse getRejectionDetails(Long trackId, String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        Track track = trackRepository.findByIdAndUploaderUserId(trackId, user.getId())
                .orElseThrow(TrackNotFoundException::new);

        if (track.getPublicationStatus() != TrackPublicationStatus.REJECTED) {
            throw new TrackOperationNotAllowedException("Track is not in REJECTED status.");
        }

        TrackSubmission latestRejectedSubmission = submissionRepository
                .findFirstByTrackIdAndStatusOrderBySubmittedAtDesc(track.getId(), SubmissionStatus.REJECTED)
                .orElse(null);

        String rejectionReason = track.getLatestRejectionReason();
        String reviewerNote = null;
        LocalDateTime reviewedAt = null;

        if (latestRejectedSubmission != null) {
            if (rejectionReason == null) rejectionReason = latestRejectedSubmission.getRejectionReason();
            reviewerNote = latestRejectedSubmission.getReviewerNote();
            reviewedAt = latestRejectedSubmission.getReviewedAt();
        }

        return new TrackRejectionDetailsResponse(
                track.getId(),
                track.getTitle(),
                track.getPublicationStatus().name(),
                rejectionReason != null ? rejectionReason : "Content does not meet SoundWave publishing guidelines.",
                reviewerNote,
                reviewedAt != null ? reviewedAt : track.getUpdatedAt()
        );
    }

    /**
     * Lấy thống kê số lượng bài hát theo trạng thái của Studio.
     */
    @Transactional(readOnly = true)
    public StudioDashboardStatsResponse getDashboardStats(String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        long total = trackRepository.countByUploaderUserId(user.getId());
        long draft = trackRepository.countByUploaderUserIdAndPublicationStatus(user.getId(), TrackPublicationStatus.DRAFT);
        long pending = trackRepository.countByUploaderUserIdAndPublicationStatus(user.getId(), TrackPublicationStatus.PENDING);
        long approved = trackRepository.countByUploaderUserIdAndPublicationStatus(user.getId(), TrackPublicationStatus.PUBLISHED);
        long rejected = trackRepository.countByUploaderUserIdAndPublicationStatus(user.getId(), TrackPublicationStatus.REJECTED);

        return new StudioDashboardStatsResponse(total, draft, pending, approved, rejected);
    }

    /**
     * Lấy danh sách thể loại nhạc đang hoạt động để hiển thị chọn lựa khi upload bài hát.
     */
    @Transactional(readOnly = true)
    public List<GenreOptionResponse> getActiveGenres() {
        return genreRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(g -> new GenreOptionResponse(g.getId(), g.getName(), g.getSlug(), g.getDescription()))
                .toList();
    }

    /**
     * Lấy danh sách album thuộc sở hữu của người dùng hiện tại để chọn khi upload bài hát.
     */
    @Transactional(readOnly = true)
    public List<AlbumOptionResponse> getMyAlbums(String currentUserEmail) {
        AppUser user = getCurrentUser(currentUserEmail);
        return albumRepository.findByCreatedByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(a -> new AlbumOptionResponse(a.getId(), a.getTitle(), a.getSlug()))
                .toList();
    }

    private AppUser getCurrentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new AccountUnavailableException("USER_NOT_FOUND", "Current user account was not found."));
    }

    private String generateUniqueSlug(String title) {
        String baseSlug = toSlug(title);
        if (baseSlug.isBlank()) {
            baseSlug = "track-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = baseSlug;
        int counter = 1;
        while (trackRepository.existsBySlug(candidate)) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-+", "-");
    }

    private LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
