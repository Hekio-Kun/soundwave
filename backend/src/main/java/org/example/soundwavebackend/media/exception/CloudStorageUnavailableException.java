package org.example.soundwavebackend.media.exception;

public class CloudStorageUnavailableException extends MediaException {
    public CloudStorageUnavailableException() {
        super("CLOUD_STORAGE_UNAVAILABLE", "Cloud service unavailable. Please try again later.");
    }
}
