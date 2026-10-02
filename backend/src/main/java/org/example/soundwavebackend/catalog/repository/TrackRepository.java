package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Track;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TrackRepository extends JpaRepository<Track, Long> {
    @EntityGraph(attributePaths = {"genre", "album"})
    Optional<Track> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"genre", "album"})
    List<Track> findAllWithDetailsByIdIn(Collection<Long> ids);

    @Query("SELECT t.id FROM Track t WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Long> findTrackIdsByTitleContainingIgnoreCase(@Param("search") String search);
}
