package org.example.soundwavebackend.moderation.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ModerationMailService {
    private static final Logger log = LoggerFactory.getLogger(ModerationMailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendTrackApprovedEmail(String recipient, String displayName, String trackTitle) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject("Your track \"" + trackTitle + "\" has been approved!");
            message.setText("Hello " + displayName + ",\n\n"
                    + "Great news! Your track \"" + trackTitle + "\" has been approved by our moderation team and is now published on SoundWave.\n\n"
                    + "Thank you for sharing your music with our community!\n\n"
                    + "Best regards,\nSoundWave Team");
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send track approval email to {}: {}", recipient, ex.getMessage());
        }
    }

    public void sendTrackRejectedEmail(String recipient, String displayName, String trackTitle, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject("Your track \"" + trackTitle + "\" submission update");
            message.setText("Hello " + displayName + ",\n\n"
                    + "Thank you for submitting your track \"" + trackTitle + "\" to SoundWave.\n\n"
                    + "After careful review, we regret to inform you that your track has not been approved for publication.\n\n"
                    + "Reason for rejection:\n" + rejectionReason + "\n\n"
                    + "You can review our community guidelines, update your track, and submit again.\n\n"
                    + "Best regards,\nSoundWave Team");
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send track rejection email to {}: {}", recipient, ex.getMessage());
        }
    }
}
