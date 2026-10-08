package org.example.soundwavebackend.catalog.dto.response;

import java.time.LocalDateTime;

public record AdminGenreResponse(
        Long id,
        String name,
        String slug,
        String description,
        boolean active,
        Long createdByUserId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
