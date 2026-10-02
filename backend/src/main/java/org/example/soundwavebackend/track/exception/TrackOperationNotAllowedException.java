package org.example.soundwavebackend.track.exception;

import org.springframework.http.HttpStatus;

public class TrackOperationNotAllowedException extends TrackException {
    public TrackOperationNotAllowedException(String message) {
        super(HttpStatus.BAD_REQUEST, "TRACK_OPERATION_NOT_ALLOWED", message);
    }

    public TrackOperationNotAllowedException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }
}
