package org.example.soundwavebackend.authentication.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProfileResponse(
        Long userId,
        String email,
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        LocalDate dateOfBirth,
        String countryCode,
        String role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
