package org.example.soundwavebackend.track.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTrackRequest(
        @NotBlank(message = "Track title is required.")
        @Size(max = 200, message = "Track title cannot exceed 200 characters.")
        String title,

        @NotNull(message = "Genre ID is required.")
        Long genreId,

        Long albumId,

        Short trackNumber,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters.")
        String description,

        String audioUrl,

        String audioPublicId,

        String audioFormat,

        Integer durationMs,

        String coverUrl,

        String coverPublicId,

        String lyrics
) {}
