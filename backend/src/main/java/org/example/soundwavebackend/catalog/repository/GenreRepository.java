package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    List<Genre> findAllByActiveTrueOrderByNameAsc();
    Optional<Genre> findBySlugIgnoreCase(String slug);
    Optional<Genre> findByNameIgnoreCase(String name);
    boolean existsBySlugIgnoreCase(String slug);
}
