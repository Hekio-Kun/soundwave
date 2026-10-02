package org.example.soundwavebackend.moderation.repository;

import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.entity.TrackSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface TrackSubmissionRepository extends JpaRepository<TrackSubmission, Long> {
    long countByStatus(SubmissionStatus status);

    Page<TrackSubmission> findByStatus(SubmissionStatus status, Pageable pageable);

    @Query("SELECT s FROM TrackSubmission s WHERE (:status IS NULL OR s.status = :status) " +
           "AND (s.trackId IN :trackIds OR s.submittedByUserId IN :userIds)")
    Page<TrackSubmission> findByStatusAndMatchingIds(
            @Param("status") SubmissionStatus status,
            @Param("trackIds") Collection<Long> trackIds,
            @Param("userIds") Collection<Long> userIds,
            Pageable pageable);
}

