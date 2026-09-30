package org.example.soundwavebackend.authentication.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.entity.UserStatus;
import org.example.soundwavebackend.authentication.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class AuthenticationSessionService {
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Kiểm tra phiên được liên kết với access token còn hợp lệ cho đúng tài khoản.
     */
    @Transactional(readOnly = true)
    public boolean isSessionActive(Long sessionId, String email) {
        if (sessionId == null || email == null || email.isBlank()) return false;
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return refreshTokenRepository.findById(sessionId)
                .filter(token -> token.isUsable(now))
                .map(token -> token.getUser())
                .filter(user -> user.getDeletedAt() == null)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .filter(user -> user.getEmailVerifiedAt() != null)
                .filter(user -> user.getEmail().equalsIgnoreCase(email))
                .isPresent();
    }
}
