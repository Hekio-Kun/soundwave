package org.example.soundwavebackend.track.exception;

import org.springframework.http.HttpStatus;

public class TrackNotFoundException extends TrackException {
    public TrackNotFoundException() {
        super(HttpStatus.NOT_FOUND, "TRACK_NOT_FOUND", "The requested track was not found or you do not have permission to access it.");
    }

    public TrackNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "TRACK_NOT_FOUND", message);
    }
}
