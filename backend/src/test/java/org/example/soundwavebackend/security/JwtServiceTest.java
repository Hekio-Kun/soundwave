package org.example.soundwavebackend.security;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {
    @Test
    void accessTokenContainsItsSessionId() {
        AppUser user = mock(AppUser.class);
        Role role = mock(Role.class);
        when(user.getId()).thenReturn(7L);
        when(user.getEmail()).thenReturn("user@example.com");
        when(user.getRole()).thenReturn(role);
        when(role.getCode()).thenReturn("LISTENER");
        JwtService jwtService = new JwtService(
                "soundwave-test-secret-must-have-at-least-thirty-two-bytes", 15);

        String token = jwtService.createAccessToken(user, 12L);

        assertTrue(jwtService.isValid(token));
        assertEquals("user@example.com", jwtService.extractSubject(token));
        assertEquals(12L, jwtService.extractSessionId(token));

        var payloadOpt = jwtService.validateAndExtract(token);
        assertTrue(payloadOpt.isPresent());
        var payload = payloadOpt.get();
        assertEquals("user@example.com", payload.subject());
        assertEquals(12L, payload.sessionId());
        assertEquals("LISTENER", payload.role());
        assertEquals(7L, payload.userId());
    }
}

