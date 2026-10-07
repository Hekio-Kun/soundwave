package org.example.soundwavebackend.moderation.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.exception.AccountUnavailableException;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.service.CatalogService;
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

/**
 * ===================================================================================================
 * [MODERATION SERVICE LAYER - OOP ORCHESTRATION & STATE MANAGEMENT]
 * Service điều phối quy trình kiểm duyệt nội dung (Track Moderation) trong Vòng đời bài hát (Track Lifecycle).
 * Phục vụ cho vai trò Nhân viên kiểm duyệt (Staff) và Quản trị viên (Admin).
 *
 * <h3>Các nguyên lý thiết kế hướng đối tượng (OOP Principles áp dụng):</h3>
 * <ul>
 *   <li><b>Single Responsibility Principle (SRP):</b> Chuyên biệt hóa toàn bộ nghiệp vụ kiểm duyệt nội dung:
 *       Quản lý hàng đợi xét duyệt (Moderation Queue), phê duyệt (Approve), từ chối (Reject),
 *       và gỡ bỏ bài hát vi phạm bản quyền / chính sách (Take Down).</li>
 *   <li><b>State Machine & Invariant Validation:</b> Kiểm tra nghiêm ngặt điều kiện tiền đề (Preconditions)
 *       của vòng đời trước khi chuyển trạng thái (chỉ bản nộp {@code PENDING} mới được duyệt/từ chối;
 *       chỉ bài hát đã {@code APPROVED} mới được thực hiện gỡ bỏ {@code TAKEN_DOWN}).</li>
 *   <li><b>Observer / Event Notification Pattern:</b> Đóng vai trò là Subject phát sinh sự kiện, tự động
 *       thông báo đến Creator qua 2 kênh liên lạc độc lập: In-App Notification ({@link NotificationService})
 *       và Thư điện tử ({@link ModerationMailService}).</li>
 *   <li><b>Delegation Pattern:</b> Phân công trách nhiệm thay đổi trạng thái và dữ liệu bài hát trong danh mục
 *       xuống cho {@link CatalogService}, giữ cho ModerationService tập trung vào luồng điều phối nghiệp vụ.</li>
 * </ul>
 * ===================================================================================================
 */
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

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - TRUY VẤN HÀNG ĐỢI KIỂM DUYỆT (MODERATION QUEUE)]
     * ===============================================================================================
     * Lấy danh sách các bài hát trong hàng đợi kiểm duyệt kèm phân trang, lọc theo trạng thái
     * (PENDING, APPROVED, REJECTED) và tìm kiếm theo tên bài hát hoặc email của người nộp.
     *
     * @param status   Trạng thái bản nộp cần lọc (PENDING, APPROVED, REJECTED)
     * @param search   Từ khóa tìm kiếm (tên bài hát hoặc email người dùng)
     * @param pageable Thông tin phân trang và sắp xếp (Sort / Page)
     * @return Trang kết quả {@link Page} chứa các DTO {@link SubmissionQueueItemResponse}
     */
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
        AppUser submitter = userRepository.findById(submission.getSubmittedByUserId()).orElse(null);
        UserProfile submitterProfile = profileRepository.findByUserId(submission.getSubmittedByUserId()).orElse(null);
        AppUser reviewer = submission.getReviewerUserId() != null ?
                userRepository.findById(submission.getReviewerUserId()).orElse(null) : null;
        UserProfile reviewerProfile = submission.getReviewerUserId() != null ?
                profileRepository.findByUserId(submission.getReviewerUserId()).orElse(null) : null;

        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile);
    }

    @Transactional(readOnly = true)
    public SubmissionStatsResponse getQueueStats() {
        long pending = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long approved = submissionRepository.countByStatus(SubmissionStatus.APPROVED);
        long rejected = submissionRepository.countByStatus(SubmissionStatus.REJECTED);
        long total = submissionRepository.count();
        return new SubmissionStatsResponse(pending, approved, rejected, total);
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - PHÊ DUYỆT BÀI HÁT XUẤT BẢN] (Moderation Approve Flow)
     * ===============================================================================================
     * <p><b>Quy trình chuyển đổi trạng thái vòng đời & Nghiệp vụ (State Transition & Side Effects):</b></p>
     * <ol>
     *   <li><b>Precondition Validation:</b> Kiểm tra bản nộp bắt buộc phải đang ở trạng thái {@link SubmissionStatus#PENDING}.
     *       Nếu không thuộc trạng thái này sẽ ném {@link InvalidSubmissionStateException}.</li>
     *   <li><b>Submission Status Transition:</b> Chuyển bản nộp sang {@link SubmissionStatus#APPROVED},
     *       ghi nhận Reviewer ID, ghi chú và mốc thời gian UTC.</li>
     *   <li><b>Track Publication State Update:</b> Ủy quyền cho {@link CatalogService#approveTrack} chuyển trạng thái
     *       Entity {@link Track} sang {@link TrackPublicationStatus#PUBLISHED}, lưu mốc thời gian {@code approvedAt}.
     *       Đồng thời tự động kích hoạt xuất bản (Publish) Album liên quan nếu Album đang ở trạng thái DRAFT.</li>
     *   <li><b>Observer - In-App Notification:</b> Tạo thông báo hệ thống loại {@link NotificationType#TRACK_APPROVED}
     *       gửi đến tài khoản của Creator kèm đường dẫn đến bài hát.</li>
     *   <li><b>Observer - Email Dispatch:</b> Kích hoạt {@link ModerationMailService#sendTrackApprovedEmail}
     *       để gửi thư điện tử chúc mừng trực tiếp đến hòm thư Creator.</li>
     * </ol>
     *
     * @param id            ID của bản nộp (TrackSubmission ID)
     * @param request       DTO chứa ghi chú nội bộ của Reviewer (reviewerNote)
     * @param reviewerEmail Email của nhân viên kiểm duyệt thực hiện thao tác
     * @return {@link SubmissionDetailResponse} DTO chi tiết kết quả sau khi duyệt thành công
     * @throws SubmissionNotFoundException    nếu không tìm thấy bản nộp theo ID
     * @throws InvalidSubmissionStateException nếu bản nộp không ở trạng thái PENDING
     * @throws AccountUnavailableException    nếu tài khoản Reviewer không tồn tại
     */
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
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile);
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - TỪ CHỐI BẢN NỘP BÀI HÁT] (Moderation Reject Flow)
     * ===============================================================================================
     * <p><b>Quy trình chuyển đổi trạng thái vòng đời & Nghiệp vụ (State Transition & Side Effects):</b></p>
     * <ol>
     *   <li><b>Precondition Validation:</b> Kiểm tra bản nộp bắt buộc phải đang ở trạng thái {@link SubmissionStatus#PENDING}.</li>
     *   <li><b>Submission Status Transition:</b> Chuyển bản nộp sang {@link SubmissionStatus#REJECTED},
     *       lưu lý do từ chối (rejectionReason), ghi chú reviewerNote và thời điểm xử lý.</li>
     *   <li><b>Track Publication State Update:</b> Ủy quyền cho {@link CatalogService#rejectTrack} chuyển trạng thái
     *       Entity {@link Track} sang {@link TrackPublicationStatus#REJECTED}, đồng thời cập nhật trường
     *       {@code latestRejectionReason} trên Entity để Creator có thể tra cứu nhanh từ Studio.</li>
     *   <li><b>Observer - In-App Notification:</b> Tạo thông báo hệ thống loại {@link NotificationType#TRACK_REJECTED}
     *       thông báo lý do từ chối và hướng dẫn Creator quay lại Content Studio chỉnh sửa.</li>
     *   <li><b>Observer - Email Dispatch:</b> Kích hoạt {@link ModerationMailService#sendTrackRejectedEmail}
     *       gửi thư điện tử chi tiết về nguyên nhân từ chối đến hòm thư Creator.</li>
     * </ol>
     *
     * @param id            ID của bản nộp (TrackSubmission ID)
     * @param request       DTO chứa lý do từ chối bắt buộc (rejectionReason) và ghi chú (reviewerNote)
     * @param reviewerEmail Email của nhân viên kiểm duyệt thực hiện thao tác
     * @return {@link SubmissionDetailResponse} DTO chi tiết kết quả sau khi từ chối
     * @throws SubmissionNotFoundException    nếu không tìm thấy bản nộp theo ID
     * @throws InvalidSubmissionStateException nếu bản nộp không ở trạng thái PENDING
     * @throws AccountUnavailableException    nếu tài khoản Reviewer không tồn tại
     */
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
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile);
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - GỠ BỎ KHẨN CẤP BÀI HÁT ĐÃ PHÁT HÀNH] (Take Down Violation Flow)
     * ===============================================================================================
     * <p><b>Quy trình chuyển đổi trạng thái vòng đời & Nghiệp vụ (State Transition & Side Effects):</b></p>
     * <ol>
     *   <li><b>Precondition Validation:</b> Kiểm tra bản nộp bắt buộc phải đang ở trạng thái {@link SubmissionStatus#APPROVED}.
     *       Chỉ bài hát đã được phát hành mới có thể bị gỡ bỏ (Take Down).</li>
     *   <li><b>Submission Status Transition:</b> Đánh dấu bản nộp là REJECTED kèm lý do vi phạm (takedownReason)
     *       và ghi chú của người kiểm duyệt.</li>
     *   <li><b>Track Publication State Update:</b> Ủy quyền cho {@link CatalogService#takeDownTrack} chuyển trạng thái
     *       Entity {@link Track} sang {@link TrackPublicationStatus#TAKEN_DOWN}. Bài hát lập tức bị thu hồi
     *       và ẩn hoàn toàn khỏi Catalog công cộng, ngắt quyền nghe nhạc trực tuyến.</li>
     *   <li><b>Observer - In-App Notification:</b> Tạo thông báo hệ thống loại {@link NotificationType#TRACK_TAKEN_DOWN}
     *       thông báo lý do gỡ bài đến Creator.</li>
     *   <li><b>Observer - Email Dispatch:</b> Kích hoạt {@link ModerationMailService#sendTrackTakenDownEmail}
     *       gửi thư cảnh báo vi phạm bản quyền / chính sách đến email Creator.</li>
     * </ol>
     *
     * @param id            ID của bản nộp (TrackSubmission ID)
     * @param request       DTO chứa lý do gỡ bỏ bắt buộc (takedownReason) và ghi chú (reviewerNote)
     * @param reviewerEmail Email của nhân viên kiểm duyệt thực hiện thao tác
     * @return {@link SubmissionDetailResponse} DTO chi tiết kết quả sau khi gỡ bài
     * @throws SubmissionNotFoundException    nếu không tìm thấy bản nộp theo ID
     * @throws InvalidSubmissionStateException nếu bản nộp không ở trạng thái APPROVED
     * @throws AccountUnavailableException    nếu tài khoản Reviewer không tồn tại
     */
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
        return mapper.toDetailResponse(submission, track, submitter, submitterProfile, reviewer, reviewerProfile);
    }
}
