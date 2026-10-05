package org.example.soundwavebackend.authentication.dto.response;

/**
 * DTO tóm tắt thông tin người dùng được cung cấp công khai cho các module khác.
 */
public record UserProfileSummary(
        Long userId,
        String email,
        String displayName,
        String avatarUrl,
        String role
) {}
