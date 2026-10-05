package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
    Optional<Track> findBySlugIgnoreCase(String slug);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findByIdIn(Collection<Long> ids);

    long countByPublicationStatus(TrackPublicationStatus status);
}
