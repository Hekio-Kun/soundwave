package org.example.soundwavebackend.media.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.config.CloudinaryProperties;
import org.example.soundwavebackend.media.dto.response.StoredMediaResponse;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudMediaService {
    private static final long MAX_AVATAR_SIZE = 5L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    /**
     * Kiểm tra và tải ảnh đại diện của người dùng lên Cloudinary.
     */
    public StoredMediaResponse uploadAvatar(MultipartFile file, Long userId) {
        byte[] content = readValidAvatar(file);
        ensureConfigured();
        try {
            Map<?, ?> result = cloudinary.uploader().upload(content, ObjectUtils.asMap(
                    "folder", "soundwave/avatars",
                    "public_id", "user-" + userId + "-" + UUID.randomUUID(),
                    "resource_type", "image",
                    "overwrite", false
            ));
            return new StoredMediaResponse(
                    String.valueOf(result.get("public_id")),
                    String.valueOf(result.get("secure_url"))
            );
        } catch (IOException exception) {
            log.warn("Không thể tải avatar lên Cloudinary cho userId={}", userId);
            throw new CloudStorageUnavailableException();
        }
    }

    /**
     * Xóa ảnh cũ khỏi Cloudinary sau khi hồ sơ đã dùng ảnh mới.
     */
    public void deleteImageQuietly(String publicId) {
        if (publicId == null || publicId.isBlank() || !properties.isConfigured()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("invalidate", true));
        } catch (IOException exception) {
            log.warn("Không thể xóa media Cloudinary cũ publicId={}", publicId);
        }
    }

    private byte[] readValidAvatar(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_AVATAR_SIZE) {
            throw new InvalidAvatarFileException();
        }
        try {
            byte[] content = file.getBytes();
            if (!isJpeg(content) && !isPng(content)) throw new InvalidAvatarFileException();
            return content;
        } catch (IOException exception) {
            throw new InvalidAvatarFileException();
        }
    }

    private boolean isJpeg(byte[] content) {
        return content.length >= 3
                && content[0] == (byte) 0xFF
                && content[1] == (byte) 0xD8
                && content[2] == (byte) 0xFF;
    }

    private boolean isPng(byte[] content) {
        if (content.length < PNG_SIGNATURE.length) return false;
        for (int index = 0; index < PNG_SIGNATURE.length; index++) {
            if (content[index] != PNG_SIGNATURE[index]) return false;
        }
        return true;
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) throw new CloudStorageUnavailableException();
    }
}
