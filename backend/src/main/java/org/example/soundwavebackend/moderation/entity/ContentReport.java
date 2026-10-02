package org.example.soundwavebackend.moderation.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "content_reports")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "submitted_by_user_id", nullable = false)
    private Long submittedByUserId;

    @Column(name = "handled_by_user_id")
    private Long handledByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReportCategory category;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportStatus status;

    @Column(name = "resolution_note", length = 2000)
    private String resolutionNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ContentReport(Long trackId, Long submittedByUserId, ReportCategory category, String description) {
        this.trackId = trackId;
        this.submittedByUserId = submittedByUserId;
        this.category = category;
        this.description = description;
        this.status = ReportStatus.PENDING;
    }

    public void resolve(Long handledByUserId, String resolutionNote, LocalDateTime handledAt) {
        completeReview(ReportStatus.RESOLVED, handledByUserId, resolutionNote, handledAt);
    }

    public void reject(Long handledByUserId, String resolutionNote, LocalDateTime handledAt) {
        completeReview(ReportStatus.REJECTED, handledByUserId, resolutionNote, handledAt);
    }

    public void withdraw(LocalDateTime updatedAt) {
        status = ReportStatus.WITHDRAWN;
        handledByUserId = null;
        resolutionNote = null;
        handledAt = null;
        this.updatedAt = updatedAt;
    }

    private void completeReview(ReportStatus status, Long handledByUserId, String resolutionNote,
                                LocalDateTime handledAt) {
        this.status = status;
        this.handledByUserId = handledByUserId;
        this.resolutionNote = resolutionNote;
        this.handledAt = handledAt;
        this.updatedAt = handledAt;
    }

    @PrePersist
    void initializeTimestamps() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }
}
