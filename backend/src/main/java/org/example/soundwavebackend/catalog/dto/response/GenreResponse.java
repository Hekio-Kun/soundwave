package org.example.soundwavebackend.catalog.dto.response;

public record GenreResponse(
        Long id,
        String name,
        String slug,
        String description,
        String color,
        String accent
) {}
