package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlbumRepository extends JpaRepository<Album, Long> {
}
