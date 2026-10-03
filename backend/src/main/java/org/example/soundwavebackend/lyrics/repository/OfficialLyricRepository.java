package org.example.soundwavebackend.lyrics.repository;

import org.example.soundwavebackend.lyrics.entity.OfficialLyric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficialLyricRepository extends JpaRepository<OfficialLyric, Long> {
    Optional<OfficialLyric> findByTrackIdAndLanguage_Code(Long trackId, String languageCode);

    Optional<OfficialLyric> findFirstByTrackIdOrderByCreatedAtDesc(Long trackId);

    void deleteByTrackId(Long trackId);
}
