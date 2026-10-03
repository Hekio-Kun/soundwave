package org.example.soundwavebackend.authentication.repository;

import org.example.soundwavebackend.authentication.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying(flushAutomatically = true)
    @Query("""
            update RefreshToken token
            set token.revokedAt = :revokedAt
            where token.user.id = :userId
              and token.revokedAt is null
            """)
    int revokeAllActiveByUserId(@Param("userId") Long userId,
                                @Param("revokedAt") LocalDateTime revokedAt);

    Optional<RefreshToken> findFirstByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            Long userId, LocalDateTime now);
}
