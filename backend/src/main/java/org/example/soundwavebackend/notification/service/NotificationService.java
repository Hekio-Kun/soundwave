package org.example.soundwavebackend.notification.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.notification.entity.Notification;
import org.example.soundwavebackend.notification.entity.NotificationType;
import org.example.soundwavebackend.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(Long userId, NotificationType type, String title, String message, String actionUrl) {
        Notification notification = new Notification(userId, type, title, message, actionUrl);
        return notificationRepository.save(notification);
    }
}
