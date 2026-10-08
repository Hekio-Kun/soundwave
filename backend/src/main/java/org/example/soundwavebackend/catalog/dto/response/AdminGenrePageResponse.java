package org.example.soundwavebackend.catalog.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

public record AdminGenrePageResponse(
        List<AdminGenreResponse> content,
        long totalElements,
        int totalPages,
        int size,
        int number,
        boolean first,
        boolean last
) {
    public static AdminGenrePageResponse from(Page<AdminGenreResponse> page) {
        return new AdminGenrePageResponse(
                List.copyOf(page.getContent()),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber(),
                page.isFirst(),
                page.isLast()
        );
    }
}
