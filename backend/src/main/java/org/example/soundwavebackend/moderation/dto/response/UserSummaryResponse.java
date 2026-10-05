package org.example.soundwavebackend.moderation.dto.response;

public record UserSummaryResponse(
        Long id,
        String email,
        String username,
        String displayName
) {}
