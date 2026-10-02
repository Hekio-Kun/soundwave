package org.example.soundwavebackend.track.repository;

import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackRepository extends JpaRepository<Track, Long> {
    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdOrderByCreatedAtDesc(Long uploaderUserId);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdAndPublicationStatusOrderByCreatedAtDesc(Long uploaderUserId, TrackPublicationStatus status);

    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findByIdAndUploaderUserId(Long id, Long uploaderUserId);

    boolean existsBySlug(String slug);

    long countByUploaderUserId(Long uploaderUserId);

    long countByUploaderUserIdAndPublicationStatus(Long uploaderUserId, TrackPublicationStatus status);
}
