package org.example.soundwavebackend.moderation.exception;

public class InvalidSubmissionStateException extends RuntimeException {
    public InvalidSubmissionStateException(String message) {
        super(message);
    }
}
