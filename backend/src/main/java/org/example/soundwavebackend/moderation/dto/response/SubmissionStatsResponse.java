package org.example.soundwavebackend.moderation.dto.response;

public record SubmissionStatsResponse(
        long pendingCount,
        long approvedCount,
        long rejectedCount,
        long totalCount
) {}
