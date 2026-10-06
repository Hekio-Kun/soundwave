package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.request.CreateGenreRequest;
import org.example.soundwavebackend.catalog.dto.request.UpdateGenreRequest;
import org.example.soundwavebackend.catalog.dto.response.AdminGenreResponse;
import org.example.soundwavebackend.catalog.dto.response.AdminGenrePageResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.exception.BadRequestOperationException;
import org.example.soundwavebackend.exception.ConflictOperationException;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

/**
 * Service điều phối các chức năng quản trị thể loại dành riêng cho Admin.
 */
@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GenreManagementService {
    private final GenreRepository genreRepository;
    private final CatalogMapper mapper;
    private final UserAccountPublicService userAccountPublicService;

    /**
     * Tìm kiếm và lọc toàn bộ thể loại, bao gồm cả thể loại đã vô hiệu hóa.
     */
    @Transactional(readOnly = true)
    public AdminGenrePageResponse getGenres(String search, Boolean active, Pageable pageable) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        Page<AdminGenreResponse> genres = genreRepository.searchForAdmin(normalizedSearch, active, pageable)
                .map(mapper::toAdminGenreResponse);
        return AdminGenrePageResponse.from(genres);
    }

    /**
     * Lấy chi tiết một thể loại cho màn hình quản trị.
     */
    @Transactional(readOnly = true)
    public AdminGenreResponse getGenre(Long id) {
        return mapper.toAdminGenreResponse(findGenre(id));
    }

    /**
     * Tạo thể loại mới và ghi nhận Admin thực hiện thao tác.
     */
    @Transactional
    public AdminGenreResponse createGenre(CreateGenreRequest request, String currentUserEmail) {
        String name = request.name().trim();
        String slug = resolveSlug(request.slug(), name);
        validateUniqueValues(name, slug, null);

        Long creatorId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        Genre genre = new Genre(name, slug, normalizeDescription(request.description()), creatorId);
        return mapper.toAdminGenreResponse(genreRepository.save(genre));
    }

    /**
     * Cập nhật tên, slug và mô tả của một thể loại.
     */
    @Transactional
    public AdminGenreResponse updateGenre(Long id, UpdateGenreRequest request) {
        Genre genre = findGenre(id);
        String name = request.name().trim();
        String slug = resolveSlug(request.slug(), name);
        validateUniqueValues(name, slug, id);

        genre.update(name, slug, normalizeDescription(request.description()), LocalDateTime.now(ZoneOffset.UTC));
        return mapper.toAdminGenreResponse(genreRepository.save(genre));
    }

    /**
     * Kích hoạt hoặc vô hiệu hóa thể loại mà không xóa dữ liệu liên quan.
     */
    @Transactional
    public AdminGenreResponse updateActiveState(Long id, boolean active) {
        Genre genre = findGenre(id);
        if (genre.isActive() != active) {
            genre.changeActiveState(active, LocalDateTime.now(ZoneOffset.UTC));
            genreRepository.save(genre);
        }
        return mapper.toAdminGenreResponse(genre);
    }

    private Genre findGenre(Long id) {
        return genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "GENRE_NOT_FOUND", "Genre was not found with ID: " + id));
    }

    private void validateUniqueValues(String name, String slug, Long excludedId) {
        boolean duplicateName = excludedId == null
                ? genreRepository.existsByNameIgnoreCase(name)
                : genreRepository.existsByNameIgnoreCaseAndIdNot(name, excludedId);
        if (duplicateName) {
            throw new ConflictOperationException("GENRE_NAME_EXISTS", "A genre with this name already exists.");
        }

        boolean duplicateSlug = excludedId == null
                ? genreRepository.existsBySlugIgnoreCase(slug)
                : genreRepository.existsBySlugIgnoreCaseAndIdNot(slug, excludedId);
        if (duplicateSlug) {
            throw new ConflictOperationException("GENRE_SLUG_EXISTS", "A genre with this slug already exists.");
        }
    }

    private String resolveSlug(String requestedSlug, String name) {
        String source = requestedSlug == null || requestedSlug.isBlank() ? name : requestedSlug;
        String slug = Normalizer.normalize(source.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            throw new BadRequestOperationException("INVALID_GENRE_SLUG", "Genre slug could not be generated from the provided value.");
        }
        if (slug.length() > 100) {
            throw new BadRequestOperationException("INVALID_GENRE_SLUG", "Genre slug must not exceed 100 characters.");
        }
        return slug;
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
