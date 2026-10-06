package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.dto.response.GenreResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý các use case liên quan đến thể loại nhạc (Genre).
 */
@Service
@RequiredArgsConstructor
public class GenreService {
    private final GenreRepository genreRepository;
    private final CatalogMapper mapper;

    /**
     * Lấy danh sách toàn bộ các thể loại đang kích hoạt.
     */
    @Transactional(readOnly = true)
    public List<GenreResponse> getActiveGenres() {
        return genreRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(mapper::toGenreResponse)
                .toList();
    }

    /**
     * Lấy thông tin chi tiết một thể loại theo slug hoặc ID.
     */
    @Transactional(readOnly = true)
    public GenreResponse getGenreBySlugOrId(String slugOrId) {
        Genre genre = null;
        try {
            Long id = Long.parseLong(slugOrId);
            genre = genreRepository.findByIdAndActiveTrue(id).orElse(null);
        } catch (NumberFormatException ignored) {
            // Not a numeric ID, search by slug
        }

        if (genre == null) {
            genre = genreRepository.findBySlugIgnoreCaseAndActiveTrue(slugOrId)
                    .orElseThrow(() -> new ResourceNotFoundException("GENRE_NOT_FOUND", "Genre not found with identifier: " + slugOrId));
        }

        return mapper.toGenreResponse(genre);
    }
}
