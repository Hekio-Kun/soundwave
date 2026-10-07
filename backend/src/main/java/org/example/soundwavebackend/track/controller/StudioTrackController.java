package org.example.soundwavebackend.track.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.track.dto.request.CreateTrackRequest;
import org.example.soundwavebackend.track.dto.request.SubmitTrackForReviewRequest;
import org.example.soundwavebackend.track.dto.request.UpdateTrackRequest;
import org.example.soundwavebackend.track.dto.response.*;
import org.example.soundwavebackend.track.service.StudioTrackService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * ===================================================================================================
 * [PRESENTATION LAYER - OOP CONTROLLER PATTERN]
 * REST Controller điều phối các yêu cầu HTTP liên quan đến quản lý bài hát trong Content Studio
 * dành cho người dùng có vai trò sáng tạo nội dung (Creator / Listener).
 *
 * <h3>Các nguyên lý thiết kế hướng đối tượng (OOP Principles áp dụng):</h3>
 * <ul>
 *   <li><b>Separation of Concerns (SoC):</b> Controller chỉ chịu trách nhiệm tiếp nhận HTTP Request,
 *       validate dữ liệu đầu vào (Bean Validation), trích xuất thông tin người dùng từ Security Principal,
 *       và ánh xạ HTTP Status Code tương ứng. Tuyệt đối không chứa business logic xử lý dữ liệu.</li>
 *   <li><b>Delegation Pattern:</b> Toàn bộ logic nghiệp vụ thực thi được ủy quyền (delegate) hoàn toàn
 *       cho {@link StudioTrackService}.</li>
 *   <li><b>Data Transfer Object (DTO) Pattern:</b> Sử dụng các bản ghi (Records / DTOs) bất biến
 *       như {@link CreateTrackRequest}, {@link UpdateTrackRequest}, {@link StudioTrackResponse}
 *       để bảo vệ cấu trúc bên trong của Domain Entities khỏi việc bị rò rỉ ra API công khai.</li>
 * </ul>
 *
 * <h3>Hai nhóm chức năng chính:</h3>
 * <ol>
 *   <li><b>Upload Track:</b> API tải lên tệp âm thanh, ảnh bìa kèm metadata để tạo bản nháp DRAFT (UC-19.1).</li>
 *   <li><b>Track Lifecycle:</b> Tập hợp các API quản lý vòng đời bài hát (Xem danh sách/chi tiết, Cập nhật,
 *       Xóa bản nháp, Nộp duyệt cho Staff, Rút lại bản nộp, và Tra cứu lý do từ chối).</li>
 * </ol>
 * ===================================================================================================
 */
@RestController
@RequestMapping("/api/v1/studio")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LISTENER')")
public class StudioTrackController {
    private final StudioTrackService studioTrackService;

    /**
     * ===============================================================================================
     * [CHỨC NĂNG 1: UPLOAD TRACK - TIẾP NHẬN TẢI LÊN BÀI HÁT MỚI] (Use Case UC-19.1)
     * ===============================================================================================
     * Endpoint nhận tệp nhị phân âm thanh (MultipartFile audio), ảnh bìa tùy chọn (MultipartFile cover)
     * và chuỗi JSON metadata bài hát để tạo mới bản nháp DRAFT trong hệ thống.
     *
     * @param request   DTO chứa thông tin tiêu đề, thể loại, album, lời bài hát, mô tả
     * @param audio     Tệp tin âm thanh (audio/mpeg, audio/wav, v.v.)
     * @param cover     Tệp tin hình ảnh bìa (image/png, image/jpeg - có thể null)
     * @param principal Đối tượng bảo mật chứa email người dùng đăng nhập hiện tại
     * @return ResponseEntity chứa {@link StudioTrackResponse} với HTTP Status 201 (CREATED)
     */
    @PostMapping(value = "/tracks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudioTrackResponse> createTrackDraft(
            @Valid @RequestPart("track") CreateTrackRequest request,
            @RequestPart("audio") MultipartFile audio,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studioTrackService.createTrackDraft(request, audio, cover, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - DANH SÁCH BÀI HÁT THEO BỘ LỌC TRẠNG THÁI] (Use Case UC-19.2)
     * ===============================================================================================
     * Lấy toàn bộ danh sách bài hát cá nhân của Creator, có thể lọc theo từng giai đoạn trong vòng đời
     * (ALL, DRAFT, PENDING, PUBLISHED, REJECTED, TAKEN_DOWN).
     *
     * @param status    Chuỗi lọc trạng thái vòng đời (tùy chọn)
     * @param principal Thông tin tài khoản người dùng đang đăng nhập
     * @return Danh sách DTO {@link StudioTrackResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/tracks")
    public ResponseEntity<List<StudioTrackResponse>> getMyTracks(@RequestParam(required = false) String status,
                                                                 Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyTracks(status, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - CHI TIẾT BÀI HÁT THUỘC QUYỀN SỞ HỮU]
     * ===============================================================================================
     * Truy xuất chi tiết bài hát theo ID, kèm theo thông tin kiểm duyệt gần nhất và lời bài hát.
     *
     * @param id        ID bài hát
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link StudioTrackResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/tracks/{id}")
    public ResponseEntity<StudioTrackResponse> getMyTrackById(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyTrackById(id, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - CẬP NHẬT THÔNG TIN VÀ TỆP MEDIA BÀI HÁT] (Use Case UC-19.3)
     * ===============================================================================================
     * Cho phép Creator cập nhật thông tin và thay thế tệp âm thanh / ảnh bìa.
     * Áp dụng quy tắc nghiệp vụ: Chỉ cho phép sửa khi bài hát ở trạng thái DRAFT hoặc REJECTED hoặc TAKEN_DOWN.
     *
     * @param id        ID bài hát cần cập nhật
     * @param request   DTO chứa thông tin cập nhật mới
     * @param audio     Tệp tin âm thanh mới (tùy chọn nếu thay thế)
     * @param cover     Tệp tin hình ảnh mới (tùy chọn nếu thay thế)
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link StudioTrackResponse} sau cập nhật với HTTP Status 200 (OK)
     */
    @PutMapping(value = "/tracks/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudioTrackResponse> updateTrack(
            @PathVariable Long id,
            @Valid @RequestPart("track") UpdateTrackRequest request,
            @RequestPart(value = "audio", required = false) MultipartFile audio,
            @RequestPart(value = "cover", required = false) MultipartFile cover,
            Principal principal) {
        return ResponseEntity.ok(studioTrackService.updateTrack(id, request, audio, cover, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - XÓA BÀI HÁT KHỎI CONTENT STUDIO] (Use Case UC-19.4)
     * ===============================================================================================
     * Xóa bài hát khỏi hệ thống và tự động dọn dẹp các ràng buộc toàn vẹn cơ sở dữ liệu cùng tệp tin Cloudinary.
     *
     * @param id        ID bài hát cần xóa
     * @param principal Thông tin tài khoản người dùng
     * @return ResponseEntity rỗng với HTTP Status 204 (NO_CONTENT)
     */
    @DeleteMapping("/tracks/{id}")
    public ResponseEntity<Void> deleteTrack(@PathVariable Long id, Principal principal) {
        studioTrackService.deleteTrack(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - NỘP BÀI HÁT CHO NHÂN VIÊN KIỂM DUYỆT] (Use Case UC-19.5)
     * ===============================================================================================
     * Gửi bài hát vào hàng đợi kiểm duyệt (Moderation Queue) của Staff. Chuyển trạng thái sang PENDING.
     *
     * @param id        ID bài hát nộp duyệt
     * @param request   DTO ghi chú gửi kèm kiểm duyệt viên (submitterNote)
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link StudioTrackResponse} với HTTP Status 200 (OK)
     */
    @PostMapping("/tracks/{id}/submit")
    public ResponseEntity<StudioTrackResponse> submitForReview(@PathVariable Long id,
                                                               @RequestBody(required = false) SubmitTrackForReviewRequest request,
                                                               Principal principal) {
        return ResponseEntity.ok(studioTrackService.submitForReview(id, request, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - RÚT LẠI BÀI HÁT ĐANG CHỜ DUYỆT] (Use Case UC-19.4 Extension)
     * ===============================================================================================
     * Rút bài hát từ trạng thái PENDING trở về DRAFT để Creator có thể chỉnh sửa lại trước khi nộp lại.
     *
     * @param id        ID bài hát muốn rút lại
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link StudioTrackResponse} ở trạng thái DRAFT với HTTP Status 200 (OK)
     */
    @PostMapping("/tracks/{id}/withdraw")
    public ResponseEntity<StudioTrackResponse> withdrawSubmission(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(studioTrackService.cancelSubmission(id, principal.getName()));
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - TRA CỨU PHẢN HỒI VÀ LÝ DO TỪ CHỐI DUYỆT] (Use Case UC-20)
     * ===============================================================================================
     * Xem lý do từ chối và ghi chú chi tiết từ Staff khi bài hát bị REJECTED.
     *
     * @param id        ID bài hát bị từ chối
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link TrackRejectionDetailsResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/tracks/{id}/rejection")
    public ResponseEntity<TrackRejectionDetailsResponse> getRejectionDetails(@PathVariable Long id,
                                                                             Principal principal) {
        return ResponseEntity.ok(studioTrackService.getRejectionDetails(id, principal.getName()));
    }

    /**
     * Lấy số liệu thống kê tổng quát bài hát theo từng trạng thái vòng đời trong Studio.
     *
     * @param principal Thông tin tài khoản người dùng
     * @return DTO {@link StudioDashboardStatsResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/stats")
    public ResponseEntity<StudioDashboardStatsResponse> getDashboardStats(Principal principal) {
        return ResponseEntity.ok(studioTrackService.getDashboardStats(principal.getName()));
    }

    /**
     * Lấy danh sách thể loại nhạc đang hoạt động để hiển thị chọn lựa trên giao diện upload.
     *
     * @return Danh sách DTO {@link GenreOptionResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/genres")
    public ResponseEntity<List<GenreOptionResponse>> getActiveGenres() {
        return ResponseEntity.ok(studioTrackService.getActiveGenres());
    }

    /**
     * Lấy danh sách album cá nhân để chọn gán bài hát vào album khi upload hoặc chỉnh sửa.
     *
     * @param principal Thông tin tài khoản người dùng
     * @return Danh sách DTO {@link AlbumOptionResponse} với HTTP Status 200 (OK)
     */
    @GetMapping("/albums")
    public ResponseEntity<List<AlbumOptionResponse>> getMyAlbums(Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyAlbums(principal.getName()));
    }
}
