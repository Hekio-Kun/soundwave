package org.example.soundwavebackend.media.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.example.soundwavebackend.config.CloudinaryProperties;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.example.soundwavebackend.media.exception.InvalidTrackAudioException;
import org.example.soundwavebackend.media.exception.InvalidTrackCoverException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

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

    @Test
    void uploadTrackAudioRejectsUnsupportedFileContent() {
        CloudMediaService service = service(new CloudinaryProperties("cloud", "key", "secret"));
        MockMultipartFile file = new MockMultipartFile(
                "audio", "fake.mp3", "audio/mpeg", "not-audio".getBytes());

        assertThrows(InvalidTrackAudioException.class, () -> service.uploadTrackAudio(file, 1L));
    }

    @Test
    void uploadTrackCoverRejectsUnsupportedFileContent() {
        CloudMediaService service = service(new CloudinaryProperties("cloud", "key", "secret"));
        MockMultipartFile file = new MockMultipartFile(
                "cover", "fake.png", "image/png", "not-an-image".getBytes());

        assertThrows(InvalidTrackCoverException.class, () -> service.uploadTrackCover(file, 1L));
    }

    @Test
    void uploadTrackAudioReturnsCloudMetadata() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "public_id", "soundwave/tracks/audio/track-1",
                "secure_url", "https://media.example/track-1.mp3",
                "format", "mp3",
                "duration", 12.5
        ));
        CloudMediaService service = new CloudMediaService(
                cloudinary, new CloudinaryProperties("cloud", "key", "secret"));
        MockMultipartFile file = new MockMultipartFile(
                "audio", "track.mp3", "audio/mpeg", new byte[]{'I', 'D', '3', 0x01});

        var response = service.uploadTrackAudio(file, 1L);

        assertEquals("soundwave/tracks/audio/track-1", response.publicId());
        assertEquals("https://media.example/track-1.mp3", response.secureUrl());
        assertEquals("mp3", response.format());
        assertEquals(12500, response.durationMs());
        verify(uploader).upload(any(byte[].class), anyMap());
    }

    private CloudMediaService service(CloudinaryProperties properties) {
        return new CloudMediaService(mock(Cloudinary.class), properties);
    }
}
