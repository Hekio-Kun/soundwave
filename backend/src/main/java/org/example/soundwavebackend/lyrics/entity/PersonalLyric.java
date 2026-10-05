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
        name = "personal_lyrics",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_personal_lyrics_user_track_lang_type",
                columnNames = {"user_id", "track_id", "language_id", "lyric_type"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PersonalLyric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id", nullable = false)
    private LyricLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(name = "lyric_type", nullable = false, length = 20)
    private LyricType lyricType;

    @Lob
    @Nationalized
    @Column(name = "lyric_content", nullable = false)
    private String lyricContent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PersonalLyric(Long userId, Long trackId, LyricLanguage language, LyricType lyricType, String lyricContent) {
        this.userId = userId;
        this.trackId = trackId;
        this.language = language;
        this.lyricType = lyricType != null ? lyricType : LyricType.CUSTOM;
        this.lyricContent = lyricContent;
    }

    public String getLanguageCode() {
        return language != null ? language.getCode() : null;
    }

    public void updateContent(String lyricContent, LocalDateTime updatedAt) {
        this.lyricContent = lyricContent;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (lyricType == null) {
            lyricType = LyricType.CUSTOM;
        }
    }
}
