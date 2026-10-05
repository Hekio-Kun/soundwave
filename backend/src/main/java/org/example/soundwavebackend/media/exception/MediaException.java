package org.example.soundwavebackend.media.exception;

import lombok.Getter;

@Getter
public class MediaException extends RuntimeException {
    private final String code;

    protected MediaException(String code, String message) {
        super(message);
        this.code = code;
    }
}
