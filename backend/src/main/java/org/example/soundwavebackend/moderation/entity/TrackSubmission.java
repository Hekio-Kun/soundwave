package org.example.soundwavebackend.moderation.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "track_submissions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrackSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "submitted_by_user_id", nullable = false)
    private Long submittedByUserId;

    @Column(name = "reviewer_user_id")
    private Long reviewerUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SubmissionStatus status;

    @Column(name = "submitter_note", length = 2000)
    private String submitterNote;

    @Column(name = "reviewer_note", length = 2000)
    private String reviewerNote;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public TrackSubmission(Long trackId, Long submittedByUserId, String submitterNote) {
        this.trackId = trackId;
        this.submittedByUserId = submittedByUserId;
        this.submitterNote = submitterNote;
        this.status = SubmissionStatus.PENDING;
    }

    public void approve(Long reviewerUserId, String reviewerNote, LocalDateTime reviewedAt) {
        this.reviewerUserId = reviewerUserId;
        this.reviewerNote = reviewerNote;
        this.reviewedAt = reviewedAt;
        this.rejectionReason = null;
        this.status = SubmissionStatus.APPROVED;
    }

    public void reject(Long reviewerUserId, String reviewerNote, String rejectionReason,
                       LocalDateTime reviewedAt) {
        this.reviewerUserId = reviewerUserId;
        this.reviewerNote = reviewerNote;
        this.rejectionReason = rejectionReason;
        this.reviewedAt = reviewedAt;
        this.status = SubmissionStatus.REJECTED;
    }

    @PrePersist
    void initializeSubmittedAt() {
        submittedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
