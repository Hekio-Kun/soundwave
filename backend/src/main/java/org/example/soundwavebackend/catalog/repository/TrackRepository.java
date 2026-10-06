package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TrackRepository extends JpaRepository<Track, Long>, JpaSpecificationExecutor<Track> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"genre", "album"})
    Page<Track> findAll(@Nullable Specification<Track> spec, @NonNull Pageable pageable);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findByIdAndPublicationStatus(Long id, TrackPublicationStatus publicationStatus);

    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findBySlugIgnoreCase(String slug);

    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findBySlugIgnoreCaseAndPublicationStatus(String slug, TrackPublicationStatus publicationStatus);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByIdInAndPublicationStatus(Collection<Long> ids, TrackPublicationStatus publicationStatus);

    boolean existsByIdAndPublicationStatus(Long id, TrackPublicationStatus publicationStatus);

    @Query("SELECT track.id FROM Track track WHERE LOWER(track.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Long> findTrackIdsByTitleContainingIgnoreCase(@Param("search") String search);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdOrderByCreatedAtDesc(Long uploaderUserId);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdOrderByUpdatedAtDesc(Long uploaderUserId);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdAndPublicationStatusOrderByCreatedAtDesc(
            Long uploaderUserId,
            TrackPublicationStatus publicationStatus
    );

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByUploaderUserIdAndPublicationStatusOrderByUpdatedAtDesc(
            Long uploaderUserId,
            TrackPublicationStatus publicationStatus
    );

    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findByIdAndUploaderUserId(Long id, Long uploaderUserId);

    boolean existsBySlug(String slug);

    long countByUploaderUserId(Long uploaderUserId);

    long countByUploaderUserIdAndPublicationStatus(
            Long uploaderUserId,
            TrackPublicationStatus publicationStatus
    );

    long countByPublicationStatus(TrackPublicationStatus status);
}
