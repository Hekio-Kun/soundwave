package org.example.soundwavebackend.track.dto.response;

public record GenreOptionResponse(
        Long id,
        String name,
        String slug,
        String description
) {}
