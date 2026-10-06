package org.example.soundwavebackend.moderation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TakeDownTrackRequest(
        @NotBlank(message = "Takedown reason is required")
        @Size(max = 1000, message = "Takedown reason must not exceed 1000 characters")
        String takedownReason,

        @Size(max = 2000, message = "Reviewer note must not exceed 2000 characters")
        String reviewerNote
) {}
