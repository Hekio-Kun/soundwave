package org.example.soundwavebackend.track.exception;

import org.springframework.http.HttpStatus;

public class AlbumNotFoundException extends TrackException {
    public AlbumNotFoundException() {
        super(HttpStatus.NOT_FOUND, "ALBUM_NOT_FOUND", "The specified album was not found or does not belong to you.");
    }

    public AlbumNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "ALBUM_NOT_FOUND", message);
    }
}
