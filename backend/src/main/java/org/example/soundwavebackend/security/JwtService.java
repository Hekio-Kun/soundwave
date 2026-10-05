package org.example.soundwavebackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTokenMinutes;

    public JwtService(@Value("${app.security.jwt-secret}") String secret,
                      @Value("${app.security.access-token-minutes}") long accessTokenMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMinutes = accessTokenMinutes;
    }

    public String createAccessToken(AppUser user, Long sessionId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().getCode())
                .claim("sid", sessionId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public String extractSubject(String token) {
        return parse(token).getSubject();
    }

    public Long extractSessionId(String token) {
        Object sessionId = parse(token).get("sid");
        return sessionId instanceof Number number ? number.longValue() : null;
    }

    public boolean isValid(String token) {
        try {
            return parse(token).getExpiration().after(new Date());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public long getAccessTokenSeconds() {
        return accessTokenMinutes * 60;
    }

    public record JwtPayload(String subject, Long sessionId, String role, Long userId) {}

    /**
     * Xác thực chữ ký số và trích xuất claims của JWT chỉ trong 1 lần parse duy nhất.
     */
    public java.util.Optional<JwtPayload> validateAndExtract(String token) {
        if (token == null || token.isBlank()) return java.util.Optional.empty();
        try {
            Claims claims = parse(token);
            if (claims.getExpiration() == null || claims.getExpiration().before(new Date())) {
                return java.util.Optional.empty();
            }
            String subject = claims.getSubject();
            Object sidObj = claims.get("sid");
            Long sid = sidObj instanceof Number number ? number.longValue() : null;
            String role = claims.get("role", String.class);
            Object uidObj = claims.get("uid");
            Long uid = uidObj instanceof Number number ? number.longValue() : null;
            return java.util.Optional.of(new JwtPayload(subject, sid, role, uid));
        } catch (RuntimeException exception) {
            return java.util.Optional.empty();
        }
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
