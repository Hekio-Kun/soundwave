package org.example.soundwavebackend.lyrics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(
        name = "official_lyrics",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_official_lyrics_track_language",
                columnNames = {"track_id", "language_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OfficialLyric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id", nullable = false)
    private LyricLanguage language;

    @Lob
    @Nationalized
    @Column(name = "lyric_content", nullable = false)
    private String lyricContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LyricStatus status;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public OfficialLyric(Long trackId, LyricLanguage language, String lyricContent, Long createdByUserId) {
        this.trackId = trackId;
        this.language = language;
        this.lyricContent = lyricContent;
        this.createdByUserId = createdByUserId;
        this.status = LyricStatus.DRAFT;
    }

    public String getLanguageCode() {
        return language != null ? language.getCode() : null;
    }

    public void updateContent(String lyricContent, LocalDateTime updatedAt) {
        this.lyricContent = lyricContent;
        this.updatedAt = updatedAt;
    }

    public void publish(LocalDateTime publishedAt) {
        status = LyricStatus.PUBLISHED;
        updatedAt = publishedAt;
    }

    public void unpublish(LocalDateTime updatedAt) {
        status = LyricStatus.DRAFT;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
}
