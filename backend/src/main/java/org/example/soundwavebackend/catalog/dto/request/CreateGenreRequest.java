package org.example.soundwavebackend.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGenreRequest(
        @NotBlank(message = "Genre name is required.")
        @Size(max = 100, message = "Genre name must not exceed 100 characters.")
        String name,

        @Size(max = 100, message = "Genre slug must not exceed 100 characters.")
        @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Genre slug may contain only lowercase letters, numbers, and hyphens.")
        String slug,

        @Size(max = 1000, message = "Genre description must not exceed 1000 characters.")
        String description
) {
}
