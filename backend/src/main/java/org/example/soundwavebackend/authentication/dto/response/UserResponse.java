package org.example.soundwavebackend.authentication.dto.response;

public record UserResponse(Long id, String email, String displayName, String avatarUrl, String role) {}
