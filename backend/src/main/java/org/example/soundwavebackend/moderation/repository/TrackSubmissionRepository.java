package org.example.soundwavebackend.moderation.repository;

import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackSubmissionRepository extends JpaRepository<TrackSubmission, Long> {
    List<TrackSubmission> findByTrackIdOrderBySubmittedAtDesc(Long trackId);
    Optional<TrackSubmission> findFirstByTrackIdOrderBySubmittedAtDesc(Long trackId);
    Optional<TrackSubmission> findFirstByTrackIdAndStatusOrderBySubmittedAtDesc(Long trackId, SubmissionStatus status);
}
