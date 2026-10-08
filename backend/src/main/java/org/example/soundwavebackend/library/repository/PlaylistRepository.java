package org.example.soundwavebackend.library.repository;

import org.example.soundwavebackend.library.entity.Playlist;
import org.example.soundwavebackend.library.entity.PlaylistVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);
    List<Playlist> findByVisibilityOrderByUpdatedAtDesc(PlaylistVisibility visibility);
    List<Playlist> findByVisibilityOrOwnerUserIdOrderByUpdatedAtDesc(PlaylistVisibility visibility, Long ownerUserId);
}
