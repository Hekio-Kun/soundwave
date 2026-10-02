package org.example.soundwavebackend.track.dto.response;

public record StudioDashboardStatsResponse(
        long total,
        long draft,
        long pending,
        long approved,
        long rejected
) {}
