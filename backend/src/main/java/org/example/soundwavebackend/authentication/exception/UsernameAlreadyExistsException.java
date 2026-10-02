package org.example.soundwavebackend.authentication.exception;

public class UsernameAlreadyExistsException extends AuthenticationException {
    public UsernameAlreadyExistsException() {
        super("USERNAME_ALREADY_EXISTS", "This username is already in use.");
    }
}
