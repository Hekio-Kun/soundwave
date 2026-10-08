package org.example.soundwavebackend.catalog.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateGenreStatusRequest(
        @NotNull(message = "Genre active status is required.")
        Boolean active
) {
}
