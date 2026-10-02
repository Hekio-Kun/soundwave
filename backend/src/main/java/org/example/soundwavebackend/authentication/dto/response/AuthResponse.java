package org.example.soundwavebackend.authentication.dto.response;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, UserResponse user) {}
