package org.example.soundwavebackend.track.dto.response;

import java.time.LocalDateTime;

public record StudioTrackResponse(
        Long id,
        String title,
        String slug,
        String description,
        Long genreId,
        String genreName,
        String genreSlug,
        Long albumId,
        String albumTitle,
        Short trackNumber,
        String status,
        String audioUrl,
        String audioFormat,
        Integer durationMs,
        String coverUrl,
        long playCount,
        String latestRejectionReason,
        String reviewerNote,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String lyrics
) {}
