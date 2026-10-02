package org.example.soundwavebackend.authentication.dto.response;

public record LoginResult(AuthResponse response, String refreshToken, long refreshTokenMaxAgeSeconds) {}
