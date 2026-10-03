package org.example.soundwavebackend.notification.repository;

import org.example.soundwavebackend.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
