package org.example.soundwavebackend.media.dto.response;

public record StoredAudioResponse(
        String publicId,
        String secureUrl,
        String format,
        Integer durationMs
) {}
