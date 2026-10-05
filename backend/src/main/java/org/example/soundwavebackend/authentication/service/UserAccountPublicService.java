package org.example.soundwavebackend.authentication.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Public service cung cấp thông tin tài khoản người dùng cho các module khác trong hệ thống Modular Monolith.
 */
@Service
@RequiredArgsConstructor
public class UserAccountPublicService {
    private final AppUserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Lấy ID người dùng từ email trong Security Context.
     */
    @Transactional(readOnly = true)
    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(AppUser::getId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "User was not found with email: " + email));
    }

    /**
     * Lấy thông tin tóm tắt người dùng theo email.
     */
    @Transactional(readOnly = true)
    public UserProfileSummary getUserSummaryByEmail(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "User was not found with email: " + email));
        return buildUserSummary(user);
    }

    /**
     * Lấy thông tin tóm tắt người dùng theo ID.
     */
    @Transactional(readOnly = true)
    public UserProfileSummary getUserSummaryById(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "User was not found with ID: " + userId));
        return buildUserSummary(user);
    }

    /**
     * Lấy danh sách tóm tắt thông tin người dùng theo tập hợp ID theo dạng batch để tránh N+1 query.
     */
    @Transactional(readOnly = true)
    public Map<Long, UserProfileSummary> getUserSummariesByIds(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<AppUser> users = userRepository.findAllById(userIds);
        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p, (a, b) -> a));

        Map<Long, UserProfileSummary> result = new HashMap<>();
        for (AppUser user : users) {
            UserProfile profile = profileMap.get(user.getId());
            String displayName = profile != null ? profile.getDisplayName() : user.getEmail();
            String avatarUrl = profile != null ? profile.getAvatarUrl() : null;
            result.put(user.getId(), new UserProfileSummary(
                    user.getId(),
                    user.getEmail(),
                    displayName,
                    avatarUrl,
                    user.getRole().getCode()
            ));
        }
        return result;
    }

    private UserProfileSummary buildUserSummary(AppUser user) {
        Optional<UserProfile> profile = userProfileRepository.findByUserId(user.getId());
        String displayName = profile.map(UserProfile::getDisplayName).orElse(user.getEmail());
        String avatarUrl = profile.map(UserProfile::getAvatarUrl).orElse(null);
        return new UserProfileSummary(
                user.getId(),
                user.getEmail(),
                displayName,
                avatarUrl,
                user.getRole().getCode()
        );
    }
}
