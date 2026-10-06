package org.example.soundwavebackend.catalog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.dto.request.CreateGenreRequest;
import org.example.soundwavebackend.catalog.dto.request.UpdateGenreRequest;
import org.example.soundwavebackend.catalog.dto.request.UpdateGenreStatusRequest;
import org.example.soundwavebackend.catalog.dto.response.AdminGenreResponse;
import org.example.soundwavebackend.catalog.dto.response.AdminGenrePageResponse;
import org.example.soundwavebackend.catalog.service.GenreManagementService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller tiếp nhận các yêu cầu quản trị thể loại của Admin.
 */
@RestController
@RequestMapping("/api/v1/admin/genres")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGenreController {
    private final GenreManagementService genreManagementService;

    /**
     * Lấy danh sách thể loại có tìm kiếm, lọc trạng thái và phân trang.
     */
    @GetMapping
    public ResponseEntity<AdminGenrePageResponse> getGenres(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(genreManagementService.getGenres(search, active, pageable));
    }

    /**
     * Lấy chi tiết một thể loại theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminGenreResponse> getGenre(@PathVariable Long id) {
        return ResponseEntity.ok(genreManagementService.getGenre(id));
    }

    /**
     * Tạo một thể loại mới.
     */
    @PostMapping
    public ResponseEntity<AdminGenreResponse> createGenre(@Valid @RequestBody CreateGenreRequest request,
                                                           Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(genreManagementService.createGenre(request, principal.getName()));
    }

    /**
     * Cập nhật thông tin một thể loại.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AdminGenreResponse> updateGenre(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateGenreRequest request) {
        return ResponseEntity.ok(genreManagementService.updateGenre(id, request));
    }

    /**
     * Kích hoạt hoặc vô hiệu hóa một thể loại.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminGenreResponse> updateGenreStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGenreStatusRequest request) {
        return ResponseEntity.ok(genreManagementService.updateActiveState(id, request.active()));
    }
}
