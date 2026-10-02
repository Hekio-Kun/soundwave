package org.example.soundwavebackend.media.service;

import com.cloudinary.Cloudinary;
import org.example.soundwavebackend.config.CloudinaryProperties;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class CloudMediaServiceTest {
    @Test
    void uploadAvatarRejectsUnsupportedFileContent() {
        CloudMediaService service = service(new CloudinaryProperties("cloud", "key", "secret"));
        MockMultipartFile file = new MockMultipartFile(
                "avatar", "avatar.jpg", "image/jpeg", "not-an-image".getBytes());

        assertThrows(InvalidAvatarFileException.class, () -> service.uploadAvatar(file, 1L));
    }

    @Test
    void uploadAvatarRejectsMissingCloudConfigurationAfterFileValidation() {
        CloudMediaService service = service(new CloudinaryProperties("", "", ""));
        byte[] jpegHeader = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
        MockMultipartFile file = new MockMultipartFile("avatar", "avatar.jpg", "image/jpeg", jpegHeader);

        assertThrows(CloudStorageUnavailableException.class, () -> service.uploadAvatar(file, 1L));
    }

    private CloudMediaService service(CloudinaryProperties properties) {
        return new CloudMediaService(mock(Cloudinary.class), properties);
    }
}
