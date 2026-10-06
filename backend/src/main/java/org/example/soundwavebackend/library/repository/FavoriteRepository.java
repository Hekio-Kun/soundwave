package org.example.soundwavebackend.library.repository;

import org.example.soundwavebackend.library.entity.Favorite;
import org.example.soundwavebackend.library.entity.FavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
}
