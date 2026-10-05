package org.example.soundwavebackend.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest;
import org.example.soundwavebackend.catalog.dto.response.AudioStreamInfo;
import org.example.soundwavebackend.catalog.dto.response.RecordPlayResponse;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.service.TrackCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * Controller xử lý các yêu cầu HTTP liên quan đến danh mục bài hát (Catalog Tracks).
 */
@RestController
@RequestMapping("/api/v1/tracks")
@RequiredArgsConstructor
public class TrackCatalogController {
    private final TrackCatalogService trackCatalogService;

    /**
     * Lọc và tìm kiếm danh sách bài hát đã phát hành.
     */
    @GetMapping
    public ResponseEntity<Page<TrackResponse>> getPublishedTracks(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "50") int size
    ) {
        Page<TrackResponse> result = trackCatalogService.getPublishedTracks(genre, search, sort, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * Xem thông tin chi tiết một bài hát theo ID hoặc Slug.
     */
    @GetMapping("/{idOrSlug}")
    public ResponseEntity<TrackResponse> getTrackDetails(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(trackCatalogService.getTrackByIdOrSlug(idOrSlug));
    }

    /**
     * Stream dữ liệu âm thanh bài hát có hỗ trợ HTTP 206 Partial Content và Range Header (UC-07).
     */
    @GetMapping("/{id}/stream")
    public ResponseEntity<StreamingResponseBody> streamTrackAudio(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader
    ) {
        AudioStreamInfo streamInfo = trackCatalogService.streamTrackAudio(id, rangeHeader);

        var responseBuilder = ResponseEntity.status(streamInfo.statusCode())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (streamInfo.contentType() != null) {
            responseBuilder.contentType(MediaType.parseMediaType(streamInfo.contentType()));
        }
        if (streamInfo.contentRange() != null) {
            responseBuilder.header(HttpHeaders.CONTENT_RANGE, streamInfo.contentRange());
        }
        if (streamInfo.contentLength() != null) {
            responseBuilder.contentLength(streamInfo.contentLength());
        }

        return responseBuilder.body(streamInfo.body());
    }

    /**
     * Ghi nhận lượt nghe hợp lệ cho một bài hát đã phát hành (UC-07, BR-08).
     * Cho phép cả Guest và User đã đăng nhập.
     */
    @PostMapping("/{id}/play")
    public ResponseEntity<RecordPlayResponse> recordTrackPlay(
            @PathVariable Long id,
            @Valid @RequestBody RecordPlayRequest request,
            Authentication authentication
    ) {
        String email = (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal()))
                ? authentication.getName()
                : null;
        return ResponseEntity.ok(trackCatalogService.recordTrackPlay(id, request, email));
    }
}

