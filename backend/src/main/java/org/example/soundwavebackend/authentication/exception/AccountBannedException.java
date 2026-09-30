package org.example.soundwavebackend.authentication.exception;

public class AccountBannedException extends AuthenticationException {
    public AccountBannedException() {
        super("ACCOUNT_BANNED", "Your account has been banned. Please contact support.");
    }
}
