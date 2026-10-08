package org.example.soundwavebackend.authentication.exception;

public class EmailAlreadyExistsException extends AuthenticationException {
    public EmailAlreadyExistsException() {
        super("EMAIL_ALREADY_EXISTS", "An account already uses this email address.");
    }
}
