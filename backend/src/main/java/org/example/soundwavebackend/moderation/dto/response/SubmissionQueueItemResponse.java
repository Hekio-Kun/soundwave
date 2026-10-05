package org.example.soundwavebackend.moderation.dto.response;

import org.example.soundwavebackend.moderation.entity.SubmissionStatus;

import java.time.LocalDateTime;

public record SubmissionQueueItemResponse(
        Long id,
        Long trackId,
        String trackTitle,
        String genreName,
        String albumTitle,
        String coverUrl,
        Integer durationMs,
        Long submitterId,
        String submitterDisplayName,
        String submitterEmail,
        SubmissionStatus status,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt,
        String reviewerDisplayName
) {}
