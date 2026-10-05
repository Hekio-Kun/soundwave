package org.example.soundwavebackend.moderation.dto.response;

public record GenreSummaryResponse(
        Long id,
        String name,
        String slug
) {}
