package org.example.soundwavebackend.track.dto.response;

import java.time.LocalDateTime;

public record TrackRejectionDetailsResponse(
        Long trackId,
        String trackTitle,
        String status,
        String rejectionReason,
        String reviewerNote,
        LocalDateTime reviewedAt
) {}
