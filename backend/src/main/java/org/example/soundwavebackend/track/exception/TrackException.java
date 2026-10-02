package org.example.soundwavebackend.track.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class TrackException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    protected TrackException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
