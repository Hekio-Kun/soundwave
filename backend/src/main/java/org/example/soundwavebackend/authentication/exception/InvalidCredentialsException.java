package org.example.soundwavebackend.authentication.exception;

public class InvalidCredentialsException extends AuthenticationException {
    public InvalidCredentialsException() {
        super("INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
}
