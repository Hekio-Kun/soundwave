package org.example.soundwavebackend.track.exception;

import org.springframework.http.HttpStatus;

public class GenreNotFoundException extends TrackException {
    public GenreNotFoundException() {
        super(HttpStatus.NOT_FOUND, "GENRE_NOT_FOUND", "The specified music genre was not found or is currently inactive.");
    }

    public GenreNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "GENRE_NOT_FOUND", message);
    }
}
