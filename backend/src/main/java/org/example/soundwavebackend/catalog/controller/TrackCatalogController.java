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

import java.util.List;

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
     * Lấy danh sách bài hát gợi ý liên quan đến bài hát hiện tại.
     */
    @GetMapping("/{idOrSlug}/recommendations")
    public ResponseEntity<List<TrackResponse>> getRecommendations(
            @PathVariable String idOrSlug,
            @RequestParam(required = false, defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(trackCatalogService.getRecommendations(idOrSlug, limit));
    }
}

