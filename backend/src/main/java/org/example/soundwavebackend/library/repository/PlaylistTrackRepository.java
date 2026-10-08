package org.example.soundwavebackend.library.repository;

import org.example.soundwavebackend.library.entity.PlaylistTrack;
import org.example.soundwavebackend.library.entity.PlaylistTrackId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, PlaylistTrackId> {
    List<PlaylistTrack> findByPlaylistIdOrderByPositionAsc(Long playlistId);
    Optional<PlaylistTrack> findByPlaylistIdAndTrackId(Long playlistId, Long trackId);
    void deleteByPlaylistIdAndTrackId(Long playlistId, Long trackId);
    void deleteByPlaylistId(Long playlistId);
    boolean existsByPlaylistIdAndTrackId(Long playlistId, Long trackId);
    long countByPlaylistId(Long playlistId);

    @Query("SELECT COALESCE(MAX(pt.position), 0) FROM PlaylistTrack pt WHERE pt.playlistId = :playlistId")
    Integer findMaxPositionByPlaylistId(@Param("playlistId") Long playlistId);
}
