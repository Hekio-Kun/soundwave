package org.example.soundwavebackend.library.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "favorites")
@IdClass(FavoriteId.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Favorite {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Favorite(Long userId, Long trackId) {
        this.userId = userId;
        this.trackId = trackId;
    }

    @PrePersist
    void initializeCreatedAt() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
