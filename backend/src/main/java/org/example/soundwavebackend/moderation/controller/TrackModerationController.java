package org.example.soundwavebackend.moderation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.moderation.dto.request.ApproveTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.RejectTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.TakeDownTrackRequest;
import org.example.soundwavebackend.moderation.dto.response.SubmissionDetailResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionQueueItemResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionStatsResponse;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.service.ModerationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * ===================================================================================================
 * [PRESENTATION LAYER - OOP CONTROLLER PATTERN & RBAC SECURITY]
 * REST Controller tiếp nhận các yêu cầu kiểm duyệt bài hát (Track Moderation) trong Track Lifecycle
 * từ phía Nhân viên kiểm duyệt (Staff) và Quản trị viên (Admin).
 *
 * <h3>Các nguyên lý thiết kế hướng đối tượng (OOP Principles áp dụng):</h3>
 * <ul>
 *   <li><b>Separation of Concerns (SoC):</b> Tách biệt tầng hiển thị/giao tiếp mạng khỏi tầng nghiệp vụ;
 *       chịu trách nhiệm bảo vệ tài nguyên qua Role-based Access Control (RBAC) với {@code hasAnyRole('STAFF', 'ADMIN')}.</li>
 *   <li><b>Delegation Pattern:</b> Toàn bộ quyết định kiểm duyệt (Approve, Reject, Take Down) được ủy nhiệm
 *       thực thi cho {@link ModerationService}.</li>
 *   <li><b>DTO Transfer Pattern:</b> Giao tiếp với Client qua các DTO bất biến (Records) nhằm đóng gói
 *       và che giấu chi tiết cấu trúc Database.</li>
 * </ul>
 * ===================================================================================================
 */
@RestController
@RequestMapping({"/api/v1/moderation/submissions", "/api/v1/admin/moderation/tracks"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class TrackModerationController {
    private final ModerationService moderationService;

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - TRUY VẤN HÀNG ĐỢI KIỂM DUYỆT]
     * ===============================================================================================
     * Lấy danh sách bài hát đang chờ duyệt hoặc đã xử lý trong hàng đợi Moderation Queue.
     *
     * @param status   Bộ lọc trạng thái (PENDING, APPROVED, REJECTED)
     * @param search   Từ khóa tìm kiếm theo tiêu đề bài hát hoặc email tác giả
     * @param pageable Phân trang và sắp xếp mặc định theo submittedAt ASC
     * @return Trang kết quả {@link Page} chứa {@link SubmissionQueueItemResponse}
     */
    @GetMapping
    public ResponseEntity<Page<SubmissionQueueItemResponse>> getQueue(
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "submittedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(moderationService.getQueue(status, search, pageable));
    }

    /**
     * Lấy số liệu thống kê tổng hợp số lượng bản nộp theo từng trạng thái.
     *
     * @return DTO {@link SubmissionStatsResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/stats")
    public ResponseEntity<SubmissionStatsResponse> getQueueStats() {
        return ResponseEntity.ok(moderationService.getQueueStats());
    }

    /**
     * Lấy thông tin chi tiết của một bản nộp bài hát để Staff tiến hành nghe thử và đánh giá.
     *
     * @param id ID của bản nộp (TrackSubmission ID)
     * @return DTO {@link SubmissionDetailResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/{id}")
    public ResponseEntity<SubmissionDetailResponse> getSubmissionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(moderationService.getSubmissionDetail(id));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - PHÊ DUYỆT XUẤT BẢN BÀI HÁT]
     * ===============================================================================================
     * Chuyển trạng thái bài hát từ PENDING sang PUBLISHED, công khai bài hát ra toàn hệ thống SoundWave,
     * đồng thời gửi email và thông báo chúc mừng đến Creator.
     *
     * @param id        ID của bản nộp cần phê duyệt
     * @param request   DTO chứa ghi chú nội bộ của Reviewer (tùy chọn)
     * @param principal Thông tin tài khoản Staff đang thực hiện thao tác
     * @return DTO {@link SubmissionDetailResponse} với HTTP Status 200 (OK)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<SubmissionDetailResponse> approveSubmission(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApproveTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.approveSubmission(id, request, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - TỪ CHỐI BẢN NỘP BÀI HÁT]
     * ===============================================================================================
     * Chuyển trạng thái bài hát từ PENDING sang REJECTED kèm lý do từ chối cụ thể,
     * đồng thời gửi email và thông báo giải thích cho Creator.
     *
     * @param id        ID của bản nộp bị từ chối
     * @param request   DTO chứa lý do từ chối bắt buộc (rejectionReason) và ghi chú
     * @param principal Thông tin tài khoản Staff thực hiện thao tác
     * @return DTO {@link SubmissionDetailResponse} với HTTP Status 200 (OK)
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<SubmissionDetailResponse> rejectSubmission(
            @PathVariable Long id,
            @Valid @RequestBody RejectTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.rejectSubmission(id, request, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - GỠ BỎ KHẨN CẤP BÀI HÁT VI PHẠM]
     * ===============================================================================================
     * Thu hồi bài hát đã PUBLISHED sang trạng thái TAKEN_DOWN do vi phạm bản quyền hoặc tiêu chuẩn cộng đồng,
     * ngay lập tức ẩn khỏi Catalog và gửi email cảnh báo đến Creator.
     *
     * @param id        ID của bản nộp tương ứng với bài hát cần gỡ bỏ
     * @param request   DTO chứa lý do gỡ bài bắt buộc (takedownReason) và ghi chú
     * @param principal Thông tin tài khoản Staff thực hiện thao tác
     * @return DTO {@link SubmissionDetailResponse} với HTTP Status 200 (OK)
     */
    @PostMapping("/{id}/takedown")
    public ResponseEntity<SubmissionDetailResponse> takeDownSubmission(
            @PathVariable Long id,
            @Valid @RequestBody TakeDownTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.takeDownSubmission(id, request, principal.getName()));
    }
}
