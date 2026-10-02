package org.example.soundwavebackend.library.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "listening_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ListeningHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "listened_duration_ms", nullable = false)
    private Integer listenedDurationMs;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "played_at", nullable = false)
    private LocalDateTime playedAt;

    public ListeningHistory(Long userId, Long trackId, Integer listenedDurationMs, boolean completed) {
        this.userId = userId;
        this.trackId = trackId;
        this.listenedDurationMs = listenedDurationMs;
        this.completed = completed;
    }

    @PrePersist
    void initializePlayedAt() {
        if (playedAt == null) playedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
