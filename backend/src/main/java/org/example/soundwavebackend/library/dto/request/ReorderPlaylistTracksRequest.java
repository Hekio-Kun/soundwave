package org.example.soundwavebackend.library.dto.request;

import java.util.List;

public record ReorderPlaylistTracksRequest(
        Long trackId,
        String direction,
        List<Long> trackIds
) {}
