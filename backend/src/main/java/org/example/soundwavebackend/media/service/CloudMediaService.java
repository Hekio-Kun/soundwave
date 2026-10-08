package org.example.soundwavebackend.media.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.config.CloudinaryProperties;
import org.example.soundwavebackend.media.dto.response.StoredAudioResponse;
import org.example.soundwavebackend.media.dto.response.StoredMediaResponse;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.example.soundwavebackend.media.exception.InvalidTrackAudioException;
import org.example.soundwavebackend.media.exception.InvalidTrackCoverException;
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
    private static final long MAX_TRACK_AUDIO_SIZE = 30L * 1024 * 1024;
    private static final long MAX_TRACK_COVER_SIZE = 5L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    /**
     * Kiểm tra và tải ảnh đại diện của người dùng lên Cloudinary.
     */
    public StoredMediaResponse uploadAvatar(MultipartFile file, Long userId) {
        byte[] content = readValidAvatar(file);
        Map<?, ?> result = upload(content, "soundwave/avatars", "user-" + userId, "image");
        return toStoredMedia(result);
    }

    /**
     * Kiểm tra và tải file âm thanh của bài hát lên Cloudinary.
     */
    public StoredAudioResponse uploadTrackAudio(MultipartFile file, Long userId) {
        byte[] content = readValidTrackAudio(file);
        String detectedFormat = detectAudioFormat(content);
        Map<?, ?> result = upload(content, "soundwave/tracks/audio", "user-" + userId + "-track", "video");
        return new StoredAudioResponse(
                requiredResultValue(result, "public_id"),
                requiredResultValue(result, "secure_url"),
                optionalResultValue(result, "format", detectedFormat),
                readDurationMs(result)
        );
    }

    /**
     * Kiểm tra và tải ảnh bìa bài hát lên Cloudinary.
     */
    public StoredMediaResponse uploadTrackCover(MultipartFile file, Long userId) {
        byte[] content = readValidTrackCover(file);
        Map<?, ?> result = upload(content, "soundwave/tracks/covers", "user-" + userId + "-cover", "image");
        return toStoredMedia(result);
    }

    /**
     * Kiểm tra và tải ảnh bìa danh sách phát (Playlist Cover) lên Cloudinary.
     */
    public StoredMediaResponse uploadPlaylistCover(MultipartFile file, Long userId) {
        byte[] content = readValidTrackCover(file);
        Map<?, ?> result = upload(content, "soundwave/playlists/covers", "user-" + userId + "-playlist-cover", "image");
        return toStoredMedia(result);
    }

    /**
     * Xóa ảnh cũ khỏi Cloudinary sau khi hồ sơ đã dùng ảnh mới.
     */
    public void deleteImageQuietly(String publicId) {
        deleteMediaQuietly(publicId, "image");
    }

    /**
     * Xóa file âm thanh khỏi Cloudinary nhưng không làm hỏng transaction chính khi Cloudinary lỗi.
     */
    public void deleteTrackAudioQuietly(String publicId) {
        deleteMediaQuietly(publicId, "video");
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

    private byte[] readValidTrackAudio(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_TRACK_AUDIO_SIZE) {
            throw new InvalidTrackAudioException();
        }
        byte[] content = readBytes(file, new InvalidTrackAudioException());
        if (!isMp3(content) && !isWav(content) && !isFlac(content)) {
            throw new InvalidTrackAudioException();
        }
        return content;
    }

    private byte[] readValidTrackCover(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_TRACK_COVER_SIZE) {
            throw new InvalidTrackCoverException();
        }
        byte[] content = readBytes(file, new InvalidTrackCoverException());
        if (!isJpeg(content) && !isPng(content)) {
            throw new InvalidTrackCoverException();
        }
        return content;
    }

    private byte[] readBytes(MultipartFile file, RuntimeException invalidFileException) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw invalidFileException;
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

    private boolean isMp3(byte[] content) {
        boolean hasId3Header = content.length >= 3
                && content[0] == 'I' && content[1] == 'D' && content[2] == '3';
        boolean hasFrameSync = content.length >= 2
                && content[0] == (byte) 0xFF && (content[1] & 0xE0) == 0xE0;
        return hasId3Header || hasFrameSync;
    }

    private boolean isWav(byte[] content) {
        return content.length >= 12
                && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                && content[8] == 'W' && content[9] == 'A' && content[10] == 'V' && content[11] == 'E';
    }

    private boolean isFlac(byte[] content) {
        return content.length >= 4
                && content[0] == 'f' && content[1] == 'L' && content[2] == 'a' && content[3] == 'C';
    }

    private String detectAudioFormat(byte[] content) {
        if (isWav(content)) return "wav";
        if (isFlac(content)) return "flac";
        return "mp3";
    }

    private Map<?, ?> upload(byte[] content, String folder, String publicIdPrefix, String resourceType) {
        ensureConfigured();
        try {
            return cloudinary.uploader().upload(content, ObjectUtils.asMap(
                    "folder", folder,
                    "public_id", publicIdPrefix + "-" + UUID.randomUUID(),
                    "resource_type", resourceType,
                    "overwrite", false
            ));
        } catch (IOException | RuntimeException exception) {
            log.warn("Không thể tải media lên Cloudinary, folder={}, cause={}: {}",
                    folder, exception.getClass().getSimpleName(), exception.getMessage());
            throw new CloudStorageUnavailableException();
        }
    }

    private StoredMediaResponse toStoredMedia(Map<?, ?> result) {
        return new StoredMediaResponse(
                requiredResultValue(result, "public_id"),
                requiredResultValue(result, "secure_url")
        );
    }

    private String requiredResultValue(Map<?, ?> result, String key) {
        Object value = result.get(key);
        if (value == null || value.toString().isBlank()) throw new CloudStorageUnavailableException();
        return value.toString();
    }

    private String optionalResultValue(Map<?, ?> result, String key, String fallback) {
        Object value = result.get(key);
        return value == null || value.toString().isBlank() ? fallback : value.toString();
    }

    private Integer readDurationMs(Map<?, ?> result) {
        Object duration = result.get("duration");
        if (!(duration instanceof Number number) || number.doubleValue() <= 0) return 0;
        return (int) Math.round(number.doubleValue() * 1000);
    }

    private void deleteMediaQuietly(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank() || !properties.isConfigured()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "invalidate", true
            ));
        } catch (IOException | RuntimeException exception) {
            log.warn("Không thể xóa media Cloudinary cũ publicId={}", publicId);
        }
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) throw new CloudStorageUnavailableException();
    }
}
