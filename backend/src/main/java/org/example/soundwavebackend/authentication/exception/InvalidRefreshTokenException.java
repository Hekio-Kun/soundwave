package org.example.soundwavebackend.authentication.exception;

public class InvalidRefreshTokenException extends AuthenticationException {
    public InvalidRefreshTokenException() {
        super("INVALID_REFRESH_TOKEN", "The session has expired. Please log in again.");
    }
}
