package org.example.soundwavebackend.library.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(
        name = "playlist_tracks",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_playlist_tracks_position",
                columnNames = {"playlist_id", "position"}
        )
)
@IdClass(PlaylistTrackId.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaylistTrack {
    @Id
    @Column(name = "playlist_id", nullable = false)
    private Long playlistId;

    @Id
    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "added_by_user_id", nullable = false)
    private Long addedByUserId;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;

    public PlaylistTrack(Long playlistId, Long trackId, Long addedByUserId, Integer position) {
        this.playlistId = playlistId;
        this.trackId = trackId;
        this.addedByUserId = addedByUserId;
        this.position = position;
    }

    public void moveTo(Integer position) {
        this.position = position;
    }

    @PrePersist
    void initializeAddedAt() {
        addedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
