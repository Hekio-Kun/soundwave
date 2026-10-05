package org.example.soundwavebackend.track.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateTrackRequest(
        @NotBlank(message = "Track title is required.")
        @Size(max = 200, message = "Track title cannot exceed 200 characters.")
        String title,

        @NotNull(message = "Genre ID is required.")
        Long genreId,

        Long albumId,

        @Positive(message = "Track number must be greater than zero.")
        Short trackNumber,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters.")
        String description,

        @Positive(message = "Audio duration must be greater than zero.")
        Integer durationMs,

        String lyrics
) {}
