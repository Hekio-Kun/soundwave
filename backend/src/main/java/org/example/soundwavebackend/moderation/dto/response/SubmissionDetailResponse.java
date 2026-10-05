package org.example.soundwavebackend.moderation.dto.response;

import org.example.soundwavebackend.moderation.entity.SubmissionStatus;

import java.time.LocalDateTime;

public record SubmissionDetailResponse(
        Long id,
        SubmissionStatus status,
        String submitterNote,
        String reviewerNote,
        String rejectionReason,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt,
        TrackDetailResponse track,
        UserSummaryResponse submitter,
        UserSummaryResponse reviewer
) {}
