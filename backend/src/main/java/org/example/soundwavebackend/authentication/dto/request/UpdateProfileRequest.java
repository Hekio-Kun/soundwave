package org.example.soundwavebackend.authentication.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must contain between 3 and 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9._]+$", message = "Username may contain letters, numbers, dots and underscores")
        String username,

        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must not exceed 120 characters")
        String displayName,

        @Size(max = 1000, message = "Biography must not exceed 1000 characters")
        String bio,

        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,

        @Pattern(regexp = "^[A-Za-z]{2}$", message = "Country code must contain exactly two letters")
        String countryCode
) {}
