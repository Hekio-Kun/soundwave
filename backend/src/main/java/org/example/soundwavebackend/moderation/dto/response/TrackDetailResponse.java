package org.example.soundwavebackend.moderation.dto.response;

import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;

import java.time.LocalDateTime;

public record TrackDetailResponse(
        Long id,
        String title,
        String slug,
        String description,
        Short trackNumber,
        TrackPublicationStatus publicationStatus,
        String audioUrl,
        String audioFormat,
        Integer durationMs,
        String coverUrl,
        long playCount,
        LocalDateTime approvedAt,
        String latestRejectionReason,
        LocalDateTime createdAt,
        GenreSummaryResponse genre,
        AlbumSummaryResponse album,
        String lyrics
) {
    public TrackDetailResponse(
            Long id,
            String title,
            String slug,
            String description,
            Short trackNumber,
            TrackPublicationStatus publicationStatus,
            String audioUrl,
            String audioFormat,
            Integer durationMs,
            String coverUrl,
            long playCount,
            LocalDateTime approvedAt,
            String latestRejectionReason,
            LocalDateTime createdAt,
            GenreSummaryResponse genre,
            AlbumSummaryResponse album
    ) {
        this(id, title, slug, description, trackNumber, publicationStatus, audioUrl, audioFormat,
                durationMs, coverUrl, playCount, approvedAt, latestRejectionReason, createdAt, genre, album, null);
    }
}
