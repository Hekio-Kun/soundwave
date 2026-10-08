package org.example.soundwavebackend.authentication.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimiterServiceTest {

    @Test
    void registrationAllowsFiveAttemptsAndRejectsTheSixthForSameEmail() {
        AuthRateLimiterService service = new AuthRateLimiterService();

        for (int attempt = 0; attempt < AuthRateLimiterService.MAX_REGISTRATION_ATTEMPTS; attempt++) {
            assertTrue(service.tryAcquireRegistrationAttempt("listener@soundwave.com", "127.0.0." + attempt));
        }

        assertFalse(service.tryAcquireRegistrationAttempt("LISTENER@soundwave.com", "192.168.1.10"));
    }

    @Test
    void registrationAllowsFiveAttemptsAndRejectsTheSixthForSameIp() {
        AuthRateLimiterService service = new AuthRateLimiterService();

        for (int attempt = 0; attempt < AuthRateLimiterService.MAX_REGISTRATION_ATTEMPTS; attempt++) {
            assertTrue(service.tryAcquireRegistrationAttempt("listener" + attempt + "@soundwave.com", "127.0.0.1"));
        }

        assertFalse(service.tryAcquireRegistrationAttempt("another@soundwave.com", "127.0.0.1"));
    }
}
