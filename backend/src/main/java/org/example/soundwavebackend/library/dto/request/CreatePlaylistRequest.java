package org.example.soundwavebackend.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlaylistRequest(
        @NotBlank(message = "Playlist title is required")
        @Size(max = 150, message = "Playlist title cannot exceed 150 characters")
        String title,

        @Size(max = 1000, message = "Playlist description cannot exceed 1000 characters")
        String description,

        Boolean isPrivate,

        @Size(max = 2048, message = "Cover URL cannot exceed 2048 characters")
        String coverUrl
) {}
