package org.example.soundwavebackend.lyrics.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(
        name = "lyric_languages",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_lyric_languages_code",
                columnNames = "code"
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LyricLanguage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public LyricLanguage(String code, String name) {
        this.code = code;
        this.name = name;
    }

    @PrePersist
    void initializeCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }
}
