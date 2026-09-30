package org.example.soundwavebackend.authentication.service;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.RefreshToken;
import org.example.soundwavebackend.authentication.entity.UserStatus;
import org.example.soundwavebackend.authentication.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationSessionServiceTest {
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @Test
    void activeSessionAcceptsAccessTokenForItsOwner() {
        RefreshToken session = mock(RefreshToken.class);
        AppUser user = mock(AppUser.class);
        when(refreshTokenRepository.findById(12L)).thenReturn(Optional.of(session));
        when(session.isUsable(any(LocalDateTime.class))).thenReturn(true);
        when(session.getUser()).thenReturn(user);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.getEmailVerifiedAt()).thenReturn(LocalDateTime.now());
        when(user.getEmail()).thenReturn("user@example.com");

        AuthenticationSessionService service = new AuthenticationSessionService(refreshTokenRepository);

        assertTrue(service.isSessionActive(12L, "user@example.com"));
    }

    @Test
    void revokedSessionRejectsItsAccessToken() {
        RefreshToken session = mock(RefreshToken.class);
        when(refreshTokenRepository.findById(12L)).thenReturn(Optional.of(session));
        when(session.isUsable(any(LocalDateTime.class))).thenReturn(false);

        AuthenticationSessionService service = new AuthenticationSessionService(refreshTokenRepository);

        assertFalse(service.isSessionActive(12L, "user@example.com"));
    }
}
