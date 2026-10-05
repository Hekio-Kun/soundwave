package org.example.soundwavebackend.library.mapper;

import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.library.dto.response.PlaylistResponse;
import org.example.soundwavebackend.library.entity.Playlist;
import org.example.soundwavebackend.library.entity.PlaylistVisibility;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class PlaylistMapper {

    public PlaylistResponse toResponse(Playlist playlist, String ownerName, List<Long> trackIds, List<TrackResponse> tracks) {
        boolean isPrivate = playlist.getVisibility() == PlaylistVisibility.PRIVATE;
        List<Long> finalTrackIds = trackIds != null ? trackIds : Collections.emptyList();
        List<TrackResponse> finalTracks = tracks != null ? tracks : Collections.emptyList();

        return new PlaylistResponse(
                playlist.getId(),
                playlist.getName(),
                playlist.getDescription(),
                playlist.getCoverUrl(),
                finalTrackIds.size(),
                isPrivate,
                playlist.getOwnerUserId(),
                ownerName != null ? ownerName : "User",
                playlist.getCreatedAt(),
                playlist.getUpdatedAt(),
                finalTrackIds,
                finalTracks
        );
    }
}
