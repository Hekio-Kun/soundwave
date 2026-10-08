package org.example.soundwavebackend.catalog.repository;

import org.example.soundwavebackend.catalog.entity.Genre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {
    List<Genre> findAllByActiveTrueOrderByNameAsc();
    Optional<Genre> findByIdAndActiveTrue(Long id);
    Optional<Genre> findBySlugIgnoreCase(String slug);
    Optional<Genre> findBySlugIgnoreCaseAndActiveTrue(String slug);
    Optional<Genre> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlugIgnoreCase(String slug);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

    @Query("""
            select genre from Genre genre
            where (:active is null or genre.active = :active)
              and (:search is null
                   or lower(genre.name) like lower(concat('%', :search, '%'))
                   or lower(genre.slug) like lower(concat('%', :search, '%')))
            """)
    Page<Genre> searchForAdmin(@Param("search") String search,
                               @Param("active") Boolean active,
                               Pageable pageable);
}
