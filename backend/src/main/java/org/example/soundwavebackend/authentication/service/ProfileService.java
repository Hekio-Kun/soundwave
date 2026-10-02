package org.example.soundwavebackend.authentication.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.request.UpdateProfileRequest;
import org.example.soundwavebackend.authentication.dto.response.ProfileResponse;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.exception.ProfileNotFoundException;
import org.example.soundwavebackend.authentication.exception.UsernameAlreadyExistsException;
import org.example.soundwavebackend.authentication.mapper.ProfileMapper;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.media.dto.response.StoredMediaResponse;
import org.example.soundwavebackend.media.service.CloudMediaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository profileRepository;
    private final ProfileMapper profileMapper;
    private final CloudMediaService cloudMediaService;

    /**
     * Lấy hồ sơ đầy đủ của người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile(String email) {
        return profileMapper.toResponse(findByEmail(email));
    }

    /**
     * Cập nhật các thông tin hồ sơ được phép của người dùng hiện tại.
     */
    @Transactional
    public ProfileResponse updateCurrentProfile(String email, UpdateProfileRequest request) {
        return updateCurrentProfile(email, request, null);
    }

    /**
     * Cập nhật hồ sơ và thay avatar Cloudinary trong cùng một luồng nghiệp vụ.
     */
    @Transactional
    public ProfileResponse updateCurrentProfile(String email, UpdateProfileRequest request, MultipartFile avatar) {
        UserProfile profile = findByEmail(email);
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (!username.equalsIgnoreCase(profile.getUsername())
                && profileRepository.existsByUsernameIgnoreCaseAndUserIdNot(username, profile.getUserId())) {
            throw new UsernameAlreadyExistsException();
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        profile.update(
                username,
                request.displayName().trim(),
                normalizeOptional(request.bio()),
                request.dateOfBirth(),
                normalizeCountryCode(request.countryCode()),
                now
        );

        if (avatar != null && !avatar.isEmpty()) {
            String oldPublicId = profile.getAvatarPublicId();
            StoredMediaResponse uploadedAvatar = cloudMediaService.uploadAvatar(avatar, profile.getUserId());
            profile.updateAvatar(uploadedAvatar.publicId(), uploadedAvatar.secureUrl(), now);
            registerMediaCleanup(oldPublicId, uploadedAvatar.publicId());
        }
        profileRepository.saveAndFlush(profile);
        return profileMapper.toResponse(profile);
    }

    private UserProfile findByEmail(String email) {
        return profileRepository.findByUser_EmailIgnoreCase(email)
                .orElseThrow(ProfileNotFoundException::new);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String normalizeCountryCode(String countryCode) {
        String normalized = normalizeOptional(countryCode);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT);
    }

    /**
     * Chỉ xóa ảnh cũ sau commit; nếu rollback thì dọn ảnh mới vừa tải lên.
     */
    private void registerMediaCleanup(String oldPublicId, String newPublicId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    cloudMediaService.deleteImageQuietly(oldPublicId);
                } else {
                    cloudMediaService.deleteImageQuietly(newPublicId);
                }
            }
        });
    }
}
