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
        LocalDateTime createdAt,
        String lyrics
) {
    public TrackResponse(
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
    ) {
        this(id, title, slug, coverUrl, audioUrl, durationMs, playCount, publicationStatus,
                genreSlug, genreName, creator, album, description, createdAt, null);
    }
}
