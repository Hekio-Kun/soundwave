package org.example.soundwavebackend.catalog.controller;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.dto.response.GenreResponse;
import org.example.soundwavebackend.catalog.service.GenreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu HTTP liên quan đến danh mục thể loại nhạc.
 */
@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService genreService;

    /**
     * Lấy danh sách toàn bộ các thể loại nhạc đang khả dụng.
     */
    @GetMapping
    public ResponseEntity<List<GenreResponse>> getAllActiveGenres() {
        return ResponseEntity.ok(genreService.getActiveGenres());
    }

    /**
     * Lấy chi tiết thông tin một thể loại theo slug hoặc ID.
     */
    @GetMapping("/{slugOrId}")
    public ResponseEntity<GenreResponse> getGenreDetails(@PathVariable String slugOrId) {
        return ResponseEntity.ok(genreService.getGenreBySlugOrId(slugOrId));
    }
}
