package org.example.soundwavebackend.catalog.dto.response;

public record CreatorSummary(
        Long userId,
        String displayName,
        String avatarUrl
) {}
