package org.example.soundwavebackend.track.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.track.dto.request.CreateTrackRequest;
import org.example.soundwavebackend.track.dto.request.SubmitTrackForReviewRequest;
import org.example.soundwavebackend.track.dto.request.UpdateTrackRequest;
import org.example.soundwavebackend.track.dto.response.*;
import org.example.soundwavebackend.track.service.StudioTrackService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller xử lý các chức năng quản lý bài hát cá nhân (Content Studio) cho Listener / Creator:
 * Upload/tạo bản nháp, cập nhật, xóa, nộp kiểm duyệt và xem phản hồi từ chối.
 */
@RestController
@RequestMapping("/api/v1/studio")
@RequiredArgsConstructor
public class StudioTrackController {
    private final StudioTrackService studioTrackService;

    /**
     * Tạo bản nháp bài hát mới kèm metadata (UC-19.1).
     */
    @PostMapping("/tracks")
    public ResponseEntity<StudioTrackResponse> createTrackDraft(@Valid @RequestBody CreateTrackRequest request,
                                                                 Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studioTrackService.createTrackDraft(request, principal.getName()));
    }

    /**
     * Lấy danh sách bài hát cá nhân, có hỗ trợ lọc theo trạng thái (UC-19.2).
     */
    @GetMapping("/tracks")
    public ResponseEntity<List<StudioTrackResponse>> getMyTracks(@RequestParam(required = false) String status,
                                                                 Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyTracks(status, principal.getName()));
    }

    /**
     * Lấy chi tiết một bài hát thuộc sở hữu của người dùng hiện tại.
     */
    @GetMapping("/tracks/{id}")
    public ResponseEntity<StudioTrackResponse> getMyTrackById(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyTrackById(id, principal.getName()));
    }

    /**
     * Cập nhật thông tin bài hát ở trạng thái DRAFT hoặc REJECTED (UC-19.3).
     */
    @PutMapping("/tracks/{id}")
    public ResponseEntity<StudioTrackResponse> updateTrack(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateTrackRequest request,
                                                           Principal principal) {
        return ResponseEntity.ok(studioTrackService.updateTrack(id, request, principal.getName()));
    }

    /**
     * Xóa bài hát chưa duyệt (DRAFT hoặc REJECTED) (UC-19.4).
     */
    @DeleteMapping("/tracks/{id}")
    public ResponseEntity<Void> deleteTrack(@PathVariable Long id, Principal principal) {
        studioTrackService.deleteTrack(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Nộp bài hát cho Staff kiểm duyệt (UC-19.5).
     */
    @PostMapping("/tracks/{id}/submit")
    public ResponseEntity<StudioTrackResponse> submitForReview(@PathVariable Long id,
                                                               @RequestBody(required = false) SubmitTrackForReviewRequest request,
                                                               Principal principal) {
        return ResponseEntity.ok(studioTrackService.submitForReview(id, request, principal.getName()));
    }

    /**
     * Xem lý do từ chối và phản hồi chi tiết từ Staff khi bài hát bị REJECTED (UC-20).
     */
    @GetMapping("/tracks/{id}/rejection")
    public ResponseEntity<TrackRejectionDetailsResponse> getRejectionDetails(@PathVariable Long id,
                                                                             Principal principal) {
        return ResponseEntity.ok(studioTrackService.getRejectionDetails(id, principal.getName()));
    }

    /**
     * Lấy số liệu thống kê bài hát trong Content Studio của người dùng.
     */
    @GetMapping("/stats")
    public ResponseEntity<StudioDashboardStatsResponse> getDashboardStats(Principal principal) {
        return ResponseEntity.ok(studioTrackService.getDashboardStats(principal.getName()));
    }

    /**
     * Lấy danh sách thể loại nhạc đang hoạt động để hiển thị chọn lựa trên giao diện upload.
     */
    @GetMapping("/genres")
    public ResponseEntity<List<GenreOptionResponse>> getActiveGenres() {
        return ResponseEntity.ok(studioTrackService.getActiveGenres());
    }

    /**
     * Lấy danh sách album cá nhân để chọn gán bài hát vào album.
     */
    @GetMapping("/albums")
    public ResponseEntity<List<AlbumOptionResponse>> getMyAlbums(Principal principal) {
        return ResponseEntity.ok(studioTrackService.getMyAlbums(principal.getName()));
    }
}
