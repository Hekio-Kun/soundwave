package org.example.soundwavebackend.authentication.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationMailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    /**
     * Gửi mã OTP dùng một lần để xác thực email đăng ký.
     */
    public void sendVerificationOtp(String recipient, String displayName, String otp, long expirationMinutes) {
        send(recipient, "Verify your SoundWave email",
                "Hello %s,%n%nYour SoundWave verification code is: %s%n%nThis code expires in %d minutes."
                        .formatted(displayName, otp, expirationMinutes));
    }

    /**
     * Gửi mã OTP dùng một lần để đặt lại mật khẩu.
     */
    public void sendPasswordResetOtp(String recipient, String otp, long expirationMinutes) {
        send(recipient, "Reset your SoundWave password",
                "Your SoundWave password reset code is: %s%n%nThis code expires in %d minutes. If you did not request it, ignore this email."
                        .formatted(otp, expirationMinutes));
    }

    private void send(String recipient, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }
}
