package org.example.soundwavebackend.authentication.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.request.*;
import org.example.soundwavebackend.authentication.dto.response.*;
import org.example.soundwavebackend.authentication.exception.InvalidRefreshTokenException;
import org.example.soundwavebackend.authentication.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private static final String REFRESH_COOKIE = "soundwave_refresh";
    private final AuthenticationService authenticationService;

    @Value("${app.security.refresh-cookie-secure}")
    private boolean secureCookie;

    /**
     * Đăng ký tài khoản mới và gửi OTP xác thực email.
     */
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authenticationService.register(request, httpRequest.getRemoteAddr()));
    }

    /**
     * Xác thực email bằng mã OTP sáu chữ số.
     */
    @PostMapping("/verify-email")
    public MessageResponse verifyEmail(@Valid @RequestBody EmailOtpRequest request) {
        return authenticationService.verifyEmail(request);
    }

    /**
     * Gửi lại OTP xác thực email theo giới hạn thời gian.
     */
    @PostMapping("/verification-otp")
    public MessageResponse resendVerificationOtp(@Valid @RequestBody EmailRequest request) {
        return authenticationService.resendVerificationOtp(request);
    }

    /**
     * Đăng nhập và trả access token theo vai trò backend xác định.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        log.info("Processing login request for email: {}", request.email());
        LoginResult result = authenticationService.login(request);
        return withRefreshCookie(result, httpRequest);
    }

    /**
     * Gửi OTP dùng để đặt lại mật khẩu nếu tài khoản tồn tại.
     */
    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody EmailRequest request) {
        return authenticationService.forgotPassword(request);
    }

    /**
     * Đặt mật khẩu mới bằng OTP hợp lệ.
     */
    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authenticationService.resetPassword(request);
    }

    /**
     * Làm mới access token và xoay refresh token hiện tại.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        LoginResult result = authenticationService.refresh(readRefreshCookie(request));
        return withRefreshCookie(result, request);
    }

    /**
     * Thu hồi phiên hiện tại và xóa refresh cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authenticationService.logout(readOptionalRefreshCookie(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie("", 0, request).toString())
                .build();
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(LoginResult result, HttpServletRequest request) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        buildRefreshCookie(result.refreshToken(), result.refreshTokenMaxAgeSeconds(), request).toString())
                .body(result.response());
    }

    private ResponseCookie buildRefreshCookie(String value, long maxAge, HttpServletRequest request) {
        boolean isHttps = request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie || isHttps)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
    }

    private String readRefreshCookie(HttpServletRequest request) {
        String value = readOptionalRefreshCookie(request);
        if (value == null) throw new InvalidRefreshTokenException();
        return value;
    }

    private String readOptionalRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }
}
