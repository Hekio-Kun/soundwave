package org.example.soundwavebackend.catalog.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "albums")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Album {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AlbumStatus status;

    @Column(name = "cover_public_id", length = 255)
    private String coverPublicId;

    @Column(name = "cover_url", length = 2048)
    private String coverUrl;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Album(Long createdByUserId, String title, String slug) {
        this.createdByUserId = createdByUserId;
        this.title = title;
        this.slug = slug;
        this.status = AlbumStatus.DRAFT;
    }

    public void updateDetails(String title, String slug, String description, LocalDate releaseDate,
                              String coverPublicId, String coverUrl, LocalDateTime updatedAt) {
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.releaseDate = releaseDate;
        this.coverPublicId = coverPublicId;
        this.coverUrl = coverUrl;
        this.updatedAt = updatedAt;
    }

    public void publish(LocalDateTime publishedAt) {
        status = AlbumStatus.PUBLISHED;
        this.publishedAt = publishedAt;
        updatedAt = publishedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
