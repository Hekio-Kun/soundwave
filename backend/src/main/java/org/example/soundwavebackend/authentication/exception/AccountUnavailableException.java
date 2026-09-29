package org.example.soundwavebackend.authentication.exception;

public class AccountUnavailableException extends AuthenticationException {
    public AccountUnavailableException(String code, String message) {
        super(code, message);
    }
}
