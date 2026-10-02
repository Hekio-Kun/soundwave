package org.example.soundwavebackend.track.mapper;

import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.example.soundwavebackend.track.dto.response.StudioTrackResponse;
import org.springframework.stereotype.Component;

@Component
public class TrackMapper {
    public StudioTrackResponse toStudioTrackResponse(Track track, TrackSubmission latestSubmission) {
        return toStudioTrackResponse(track, latestSubmission, null);
    }

    public StudioTrackResponse toStudioTrackResponse(Track track, TrackSubmission latestSubmission, String lyrics) {
        return new StudioTrackResponse(
                track.getId(),
                track.getTitle(),
                track.getSlug(),
                track.getDescription(),
                track.getGenre() != null ? track.getGenre().getId() : null,
                track.getGenre() != null ? track.getGenre().getName() : null,
                track.getGenre() != null ? track.getGenre().getSlug() : null,
                track.getAlbum() != null ? track.getAlbum().getId() : null,
                track.getAlbum() != null ? track.getAlbum().getTitle() : null,
                track.getTrackNumber(),
                track.getPublicationStatus().name(),
                track.getAudioUrl(),
                track.getAudioFormat(),
                track.getDurationMs(),
                track.getCoverUrl(),
                track.getPlayCount(),
                track.getLatestRejectionReason(),
                latestSubmission != null ? latestSubmission.getReviewerNote() : null,
                latestSubmission != null ? latestSubmission.getSubmittedAt() : null,
                track.getCreatedAt(),
                track.getUpdatedAt(),
                lyrics
        );
    }
}
