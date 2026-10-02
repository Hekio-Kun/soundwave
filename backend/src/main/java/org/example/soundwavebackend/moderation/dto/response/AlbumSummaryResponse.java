package org.example.soundwavebackend.moderation.dto.response;

import org.example.soundwavebackend.catalog.entity.AlbumStatus;

public record AlbumSummaryResponse(
        Long id,
        String title,
        String slug,
        AlbumStatus status
) {}
