package org.example.soundwavebackend.authentication.exception;

public class EmailNotVerifiedException extends AuthenticationException {
    public EmailNotVerifiedException() {
        super("EMAIL_NOT_VERIFIED", "Verify your email before logging in.");
    }
}
