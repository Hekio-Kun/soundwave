package org.example.soundwavebackend.authentication.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "password_reset_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;
    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public PasswordResetToken(AppUser user, String tokenHash, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public boolean isExpired(LocalDateTime now) { return !expiresAt.isAfter(now); }
    public boolean isUsed() { return usedAt != null; }
    public void markUsed(LocalDateTime now) { usedAt = now; }
}
