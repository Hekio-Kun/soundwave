package org.example.soundwavebackend.catalog.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "genres")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Genre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(length = 1000)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Genre(String name, String slug, String description, Long createdByUserId) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.createdByUserId = createdByUserId;
        this.active = true;
    }

    public void update(String name, String slug, String description, LocalDateTime updatedAt) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.updatedAt = updatedAt;
    }

    public void changeActiveState(boolean active, LocalDateTime updatedAt) {
        this.active = active;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
