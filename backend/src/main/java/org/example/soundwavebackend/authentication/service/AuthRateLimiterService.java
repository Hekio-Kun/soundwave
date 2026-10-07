package org.example.soundwavebackend.authentication.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dịch vụ kiểm soát tần suất và giới hạn số lần thử đăng nhập, xác thực OTP.
 * Ngăn chặn tấn công Brute-force và Credential Stuffing.
 */
@Slf4j
@Service
public class AuthRateLimiterService {
    public static final int MAX_FAILED_OTP_ATTEMPTS = 5;
    public static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    public static final int MAX_REGISTRATION_ATTEMPTS = 5;
    private static final long LOGIN_LOCKOUT_SECONDS = 600; // 10 phút khóa tạm thời
    private static final long REGISTRATION_WINDOW_MINUTES = 10;

    private final ConcurrentHashMap<String, OtpAttemptTracker> otpAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LoginAttemptTracker> loginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Deque<Instant>> registrationAttempts = new ConcurrentHashMap<>();

    private record OtpAttemptTracker(int failedCount, Instant lastAttempt) {}
    private record LoginAttemptTracker(int failedCount, Instant lockedUntil) {}

    /**
     * Ghi nhận lần đăng ký nếu cả email và địa chỉ IP vẫn còn trong giới hạn cho phép.
     */
    public synchronized boolean tryAcquireRegistrationAttempt(String email, String ipAddress) {
        Instant now = Instant.now();
        String emailKey = "email:" + normalize(email);
        String ipKey = "ip:" + normalizeIp(ipAddress);
        Deque<Instant> emailHistory = activeRegistrationAttempts(emailKey, now);
        Deque<Instant> ipHistory = activeRegistrationAttempts(ipKey, now);

        if (emailHistory.size() >= MAX_REGISTRATION_ATTEMPTS
                || ipHistory.size() >= MAX_REGISTRATION_ATTEMPTS) {
            return false;
        }

        emailHistory.addLast(now);
        ipHistory.addLast(now);
        return true;
    }

    /**
     * Ghi nhận một lần nhập sai OTP cho tài khoản email.
     */
    public int recordFailedOtpAttempt(String email) {
        String key = normalize(email);
        OtpAttemptTracker tracker = otpAttempts.compute(key, (k, current) -> {
            int count = current == null ? 1 : current.failedCount() + 1;
            return new OtpAttemptTracker(count, Instant.now());
        });
        return tracker.failedCount();
    }

    /**
     * Kiểm tra xem OTP của email này đã bị khóa do thử sai quá giới hạn hay chưa.
     */
    public boolean isOtpBlocked(String email) {
        OtpAttemptTracker tracker = otpAttempts.get(normalize(email));
        return tracker != null && tracker.failedCount() >= MAX_FAILED_OTP_ATTEMPTS;
    }

    /**
     * Xóa bộ đếm thử sai OTP khi xác thực thành công hoặc khi sinh OTP mới.
     */
    public void resetOtpAttempts(String email) {
        otpAttempts.remove(normalize(email));
    }

    /**
     * Kiểm tra số lần thử sai OTP còn lại trước khi mã bị vô hiệu hóa.
     */
    public int getRemainingOtpAttempts(String email) {
        OtpAttemptTracker tracker = otpAttempts.get(normalize(email));
        int failed = tracker == null ? 0 : tracker.failedCount();
        return Math.max(0, MAX_FAILED_OTP_ATTEMPTS - failed);
    }

    /**
     * Ghi nhận một lần đăng nhập sai mật khẩu.
     */
    public int recordFailedLogin(String email) {
        String key = normalize(email);
        LoginAttemptTracker updated = loginAttempts.compute(key, (k, current) -> {
            int newCount = (current == null || isExpired(current)) ? 1 : current.failedCount() + 1;
            Instant lockedUntil = newCount >= MAX_FAILED_LOGIN_ATTEMPTS
                    ? Instant.now().plusSeconds(LOGIN_LOCKOUT_SECONDS)
                    : null;
            return new LoginAttemptTracker(newCount, lockedUntil);
        });
        return updated.failedCount();
    }

    /**
     * Kiểm tra tài khoản có đang bị khóa tạm thời do nhập sai mật khẩu nhiều lần không.
     */
    public boolean isLoginBlocked(String email) {
        LoginAttemptTracker tracker = loginAttempts.get(normalize(email));
        if (tracker == null) return false;
        if (tracker.lockedUntil() != null && tracker.lockedUntil().isAfter(Instant.now())) {
            return true;
        }
        if (isExpired(tracker)) {
            loginAttempts.remove(normalize(email));
        }
        return false;
    }

    /**
     * Xóa bộ đếm đăng nhập sai khi người dùng đăng nhập thành công.
     */
    public void resetLoginAttempts(String email) {
        loginAttempts.remove(normalize(email));
    }

    /**
     * Lấy số lần đăng nhập sai còn lại trước khi tài khoản bị khóa tạm thời.
     */
    public int getRemainingLoginAttempts(String email) {
        LoginAttemptTracker tracker = loginAttempts.get(normalize(email));
        if (tracker == null || isExpired(tracker)) return MAX_FAILED_LOGIN_ATTEMPTS;
        return Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - tracker.failedCount());
    }

    private boolean isExpired(LoginAttemptTracker tracker) {
        return tracker.lockedUntil() != null && tracker.lockedUntil().isBefore(Instant.now());
    }

    private Deque<Instant> activeRegistrationAttempts(String key, Instant now) {
        Deque<Instant> history = registrationAttempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        Instant windowStart = now.minus(REGISTRATION_WINDOW_MINUTES, ChronoUnit.MINUTES);
        while (!history.isEmpty() && history.peekFirst().isBefore(windowStart)) {
            history.removeFirst();
        }
        return history;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "unknown";
        }
        return ipAddress.trim().toLowerCase(Locale.ROOT);
    }
}
