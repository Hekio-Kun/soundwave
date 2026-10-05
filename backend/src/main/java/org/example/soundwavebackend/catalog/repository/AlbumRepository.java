package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlbumRepository extends JpaRepository<Album, Long> {
    Optional<Album> findBySlugIgnoreCase(String slug);
}
