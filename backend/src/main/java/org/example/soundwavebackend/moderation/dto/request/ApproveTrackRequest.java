package org.example.soundwavebackend.moderation.dto.request;

import jakarta.validation.constraints.Size;

public record ApproveTrackRequest(
        @Size(max = 2000, message = "Reviewer note must not exceed 2000 characters")
        String reviewerNote
) {}
