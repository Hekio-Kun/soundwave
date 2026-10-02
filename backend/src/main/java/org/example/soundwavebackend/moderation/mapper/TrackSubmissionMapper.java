package org.example.soundwavebackend.moderation.mapper;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.catalog.entity.Album;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.moderation.dto.response.*;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.springframework.stereotype.Component;

@Component
public class TrackSubmissionMapper {

    public SubmissionQueueItemResponse toQueueItemResponse(TrackSubmission submission,
                                                           Track track,
                                                           AppUser submitter,
                                                           UserProfile submitterProfile,
                                                           AppUser reviewer,
                                                           UserProfile reviewerProfile) {
        if (submission == null) {
            return null;
        }

        Long trackId = track != null ? track.getId() : submission.getTrackId();
        String trackTitle = track != null ? track.getTitle() : null;
        String genreName = (track != null && track.getGenre() != null) ? track.getGenre().getName() : null;
        String albumTitle = (track != null && track.getAlbum() != null) ? track.getAlbum().getTitle() : null;
        String coverUrl = track != null ? track.getCoverUrl() : null;
        Integer durationMs = track != null ? track.getDurationMs() : null;

        Long submitterId = submitter != null ? submitter.getId() : submission.getSubmittedByUserId();
        String submitterDisplayName = resolveDisplayName(submitter, submitterProfile);
        String submitterEmail = submitter != null ? submitter.getEmail() : null;
        String reviewerDisplayName = resolveDisplayName(reviewer, reviewerProfile);

        return new SubmissionQueueItemResponse(
                submission.getId(),
                trackId,
                trackTitle,
                genreName,
                albumTitle,
                coverUrl,
                durationMs,
                submitterId,
                submitterDisplayName,
                submitterEmail,
                submission.getStatus(),
                submission.getSubmittedAt(),
                submission.getReviewedAt(),
                reviewerDisplayName
        );
    }

    public SubmissionDetailResponse toDetailResponse(TrackSubmission submission,
                                                     Track track,
                                                     AppUser submitter,
                                                     UserProfile submitterProfile,
                                                     AppUser reviewer,
                                                     UserProfile reviewerProfile) {
        if (submission == null) {
            return null;
        }

        TrackDetailResponse trackDetail = toTrackDetailResponse(track);
        UserSummaryResponse submitterSummary = toUserSummaryResponse(submitter, submitterProfile);
        UserSummaryResponse reviewerSummary = toUserSummaryResponse(reviewer, reviewerProfile);

        return new SubmissionDetailResponse(
                submission.getId(),
                submission.getStatus(),
                submission.getSubmitterNote(),
                submission.getReviewerNote(),
                submission.getRejectionReason(),
                submission.getSubmittedAt(),
                submission.getReviewedAt(),
                trackDetail,
                submitterSummary,
                reviewerSummary
        );
    }

    public TrackDetailResponse toTrackDetailResponse(Track track) {
        if (track == null) {
            return null;
        }

        GenreSummaryResponse genreSummary = toGenreSummaryResponse(track.getGenre());
        AlbumSummaryResponse albumSummary = toAlbumSummaryResponse(track.getAlbum());

        return new TrackDetailResponse(
                track.getId(),
                track.getTitle(),
                track.getSlug(),
                track.getDescription(),
                track.getTrackNumber(),
                track.getPublicationStatus(),
                track.getAudioUrl(),
                track.getAudioFormat(),
                track.getDurationMs(),
                track.getCoverUrl(),
                track.getPlayCount(),
                track.getApprovedAt(),
                track.getLatestRejectionReason(),
                track.getCreatedAt(),
                genreSummary,
                albumSummary
        );
    }

    public GenreSummaryResponse toGenreSummaryResponse(Genre genre) {
        if (genre == null) {
            return null;
        }
        return new GenreSummaryResponse(genre.getId(), genre.getName(), genre.getSlug());
    }

    public AlbumSummaryResponse toAlbumSummaryResponse(Album album) {
        if (album == null) {
            return null;
        }
        return new AlbumSummaryResponse(album.getId(), album.getTitle(), album.getSlug(), album.getStatus());
    }

    public UserSummaryResponse toUserSummaryResponse(AppUser user, UserProfile profile) {
        if (user == null && profile == null) {
            return null;
        }
        Long id = user != null ? user.getId() : (profile != null ? profile.getUserId() : null);
        String email = user != null ? user.getEmail() : null;
        return new UserSummaryResponse(
                id,
                email,
                resolveUsername(profile),
                resolveDisplayName(user, profile)
        );
    }

    private String resolveDisplayName(AppUser user, UserProfile profile) {
        if (profile != null && profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName();
        }
        if (user != null) {
            return user.getEmail();
        }
        return null;
    }

    private String resolveUsername(UserProfile profile) {
        if (profile != null) {
            return profile.getUsername();
        }
        return null;
    }
}
