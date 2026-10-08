package org.example.soundwavebackend.track.dto.request;

import jakarta.validation.constraints.Size;

public record SubmitTrackForReviewRequest(
        @Size(max = 2000, message = "Submitter note cannot exceed 2000 characters.")
        String submitterNote
) {}
