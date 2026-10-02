package org.example.soundwavebackend.library.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "playlists")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Playlist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlaylistVisibility visibility;

    @Column(name = "cover_public_id", length = 255)
    private String coverPublicId;

    @Column(name = "cover_url", length = 2048)
    private String coverUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Playlist(Long ownerUserId, String name) {
        this.ownerUserId = ownerUserId;
        this.name = name;
        this.visibility = PlaylistVisibility.PRIVATE;
    }

    public void update(String name, String description, PlaylistVisibility visibility,
                       String coverPublicId, String coverUrl, LocalDateTime updatedAt) {
        this.name = name;
        this.description = description;
        this.visibility = visibility;
        this.coverPublicId = coverPublicId;
        this.coverUrl = coverUrl;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
