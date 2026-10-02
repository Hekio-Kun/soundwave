package org.example.soundwavebackend.authentication.repository;

import org.example.soundwavebackend.authentication.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);
}
