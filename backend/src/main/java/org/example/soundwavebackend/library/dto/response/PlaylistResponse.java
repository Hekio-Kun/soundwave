package org.example.soundwavebackend.library.dto.response;

import org.example.soundwavebackend.catalog.dto.response.TrackResponse;

import java.time.LocalDateTime;
import java.util.List;

public record PlaylistResponse(
        Long id,
        String title,
        String description,
        String coverUrl,
        int trackCount,
        boolean isPrivate,
        Long ownerId,
        String ownerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<Long> trackIds,
        List<TrackResponse> tracks
) {}
