package org.example.soundwavebackend.moderation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationMailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    /**
     * Gửi email thông báo bài hát đã được duyệt.
     */
    public void sendTrackApprovedEmail(String recipient, String displayName, String trackTitle) {
        String subject = "Your track \"" + trackTitle + "\" has been approved!";
        String content = "Hello " + displayName + ",\n\n"
                + "Great news! Your track \"" + trackTitle + "\" has been approved by our moderation team and is now published on SoundWave.\n\n"
                + "Thank you for sharing your music with our community!\n\n"
                + "Best regards,\nSoundWave Team";
        send(recipient, subject, content);
    }

    /**
     * Gửi email thông báo bài hát bị từ chối kèm lý do.
     */
    public void sendTrackRejectedEmail(String recipient, String displayName, String trackTitle, String rejectionReason) {
        String subject = "Your track \"" + trackTitle + "\" submission update";
        String content = "Hello " + displayName + ",\n\n"
                + "Thank you for submitting your track \"" + trackTitle + "\" to SoundWave.\n\n"
                + "After careful review, we regret to inform you that your track has not been approved for publication.\n\n"
                + "Reason for rejection:\n" + rejectionReason + "\n\n"
                + "You can review our community guidelines, update your track, and submit again.\n\n"
                + "Best regards,\nSoundWave Team";
        send(recipient, subject, content);
    }

    /**
     * Gửi email thông báo bài hát đã bị gỡ khỏi hệ thống.
     */
    public void sendTrackTakenDownEmail(String recipient, String displayName, String trackTitle, String takedownReason) {
        String subject = "Notice: Your track \"" + trackTitle + "\" has been taken down";
        String content = "Hello " + displayName + ",\n\n"
                + "We are writing to inform you that your track \"" + trackTitle + "\" has been taken down from SoundWave.\n\n"
                + "Reason for removal:\n" + takedownReason + "\n\n"
                + "If you believe this was done in error, please contact our support team.\n\n"
                + "Best regards,\nSoundWave Team";
        send(recipient, subject, content);
    }

    private void send(String recipient, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
        } catch (MailException exception) {
            log.warn("Failed to send moderation email to {}: {}", recipient, exception.getMessage());
        }
    }
}
