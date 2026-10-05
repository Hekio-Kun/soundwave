package org.example.soundwavebackend.authentication.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "user_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(length = 1000)
    private String bio;

    @Column(name = "avatar_public_id", length = 255)
    private String avatarPublicId;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "country_code", columnDefinition = "char(2)")
    private String countryCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserProfile(AppUser user, String username, String displayName) {
        this.user = user;
        this.username = username;
        this.displayName = displayName;
        if (user != null && user.getId() != null) {
            this.userId = user.getId();
        }
    }

    public void update(String displayName, String bio, LocalDate dateOfBirth, String countryCode,
                       LocalDateTime updatedAt) {
        this.displayName = displayName;
        this.bio = bio;
        this.dateOfBirth = dateOfBirth;
        this.countryCode = countryCode;
        this.updatedAt = updatedAt;
    }

    public void updateAvatar(String avatarPublicId, String avatarUrl, LocalDateTime updatedAt) {
        this.avatarPublicId = avatarPublicId;
        this.avatarUrl = avatarUrl;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
