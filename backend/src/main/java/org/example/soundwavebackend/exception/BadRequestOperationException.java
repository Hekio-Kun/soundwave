package org.example.soundwavebackend.exception;

import lombok.Getter;

@Getter
public class BadRequestOperationException extends RuntimeException {
    private final String code;

    public BadRequestOperationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BadRequestOperationException(String message) {
        super(message);
        this.code = "BAD_REQUEST";
    }
}
