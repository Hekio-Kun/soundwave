package org.example.soundwavebackend.catalog.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "tracks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Track {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uploader_user_id", nullable = false)
    private Long uploaderUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id")
    private Album album;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "genre_id", nullable = false)
    private Genre genre;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(length = 2000)
    private String description;

    @Column(name = "track_number")
    private Short trackNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "publication_status", nullable = false, length = 30)
    private TrackPublicationStatus publicationStatus;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "latest_rejection_reason", length = 1000)
    private String latestRejectionReason;

    @Column(name = "audio_public_id", nullable = false, length = 255)
    private String audioPublicId;

    @Column(name = "audio_url", nullable = false, length = 2048)
    private String audioUrl;

    @Column(name = "audio_format", nullable = false, length = 20)
    private String audioFormat;

    @Column(name = "duration_ms", nullable = false)
    private Integer durationMs;

    @Column(name = "cover_public_id", length = 255)
    private String coverPublicId;

    @Column(name = "cover_url", length = 2048)
    private String coverUrl;

    @Column(name = "play_count_cache", nullable = false)
    private long playCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Track(Long uploaderUserId, Genre genre, String title, String slug, String audioPublicId,
                 String audioUrl, String audioFormat, Integer durationMs) {
        this.uploaderUserId = uploaderUserId;
        this.genre = genre;
        this.title = title;
        this.slug = slug;
        this.audioPublicId = audioPublicId;
        this.audioUrl = audioUrl;
        this.audioFormat = audioFormat;
        this.durationMs = durationMs;
        this.publicationStatus = TrackPublicationStatus.DRAFT;
        this.playCount = 0;
    }

    public Track(Long uploaderUserId, Genre genre, Album album, String title, String slug,
                 String description, Short trackNumber, String audioPublicId, String audioUrl,
                 String audioFormat, Integer durationMs, String coverPublicId, String coverUrl) {
        this.uploaderUserId = uploaderUserId;
        this.genre = genre;
        this.album = album;
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.trackNumber = trackNumber;
        this.audioPublicId = audioPublicId;
        this.audioUrl = audioUrl;
        this.audioFormat = audioFormat;
        this.durationMs = durationMs != null ? durationMs : 0;
        this.coverPublicId = coverPublicId;
        this.coverUrl = coverUrl;
        this.publicationStatus = TrackPublicationStatus.DRAFT;
        this.playCount = 0;
    }

    public boolean isEditable() {
        return publicationStatus == TrackPublicationStatus.DRAFT || publicationStatus == TrackPublicationStatus.REJECTED;
    }

    public boolean isDeletable() {
        return publicationStatus == TrackPublicationStatus.DRAFT || publicationStatus == TrackPublicationStatus.REJECTED;
    }

    public void updateDraftDetails(String title, String slug, Genre genre, Album album,
                                   String description, Short trackNumber,
                                   String audioPublicId, String audioUrl, String audioFormat, Integer durationMs,
                                   String coverPublicId, String coverUrl, LocalDateTime updatedAt) {
        this.title = title;
        this.slug = slug;
        this.genre = genre;
        this.album = album;
        this.description = description;
        this.trackNumber = trackNumber;
        if (audioUrl != null && !audioUrl.isBlank()) {
            this.audioPublicId = audioPublicId != null ? audioPublicId : this.audioPublicId;
            this.audioUrl = audioUrl;
            this.audioFormat = audioFormat != null ? audioFormat : this.audioFormat;
            this.durationMs = durationMs != null ? durationMs : this.durationMs;
        }
        if (coverUrl != null && !coverUrl.isBlank()) {
            this.coverPublicId = coverPublicId != null ? coverPublicId : this.coverPublicId;
            this.coverUrl = coverUrl;
        }
        this.updatedAt = updatedAt;
    }

    public void submitForReview(LocalDateTime submittedAt) {
        this.publicationStatus = TrackPublicationStatus.PENDING;
        this.updatedAt = submittedAt;
    }

    public void assignAlbum(Album album, Short trackNumber, LocalDateTime updatedAt) {
        this.album = album;
        this.trackNumber = trackNumber;
        this.updatedAt = updatedAt;
    }

    public void updatePublicationStatus(TrackPublicationStatus status, String rejectionReason,
                                        LocalDateTime changedAt) {
        publicationStatus = status;
        latestRejectionReason = rejectionReason;
        approvedAt = status == TrackPublicationStatus.PUBLISHED ? changedAt : approvedAt;
        updatedAt = changedAt;
    }

    public void incrementPlayCount() {
        playCount++;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
