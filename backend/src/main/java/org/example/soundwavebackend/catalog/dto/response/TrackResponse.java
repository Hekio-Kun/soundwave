package org.example.soundwavebackend.catalog.dto.response;

import java.time.LocalDateTime;

public record TrackResponse(
        Long id,
        String title,
        String slug,
        String coverUrl,
        String audioUrl,
        Integer durationMs,
        long playCount,
        String publicationStatus,
        String genreSlug,
        String genreName,
        CreatorSummary creator,
        AlbumSummary album,
        String description,
        LocalDateTime createdAt
) {}
