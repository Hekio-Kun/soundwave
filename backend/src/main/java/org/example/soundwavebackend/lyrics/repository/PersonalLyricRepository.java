package org.example.soundwavebackend.lyrics.repository;

import org.example.soundwavebackend.lyrics.entity.LyricType;
import org.example.soundwavebackend.lyrics.entity.PersonalLyric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalLyricRepository extends JpaRepository<PersonalLyric, Long> {
    Optional<PersonalLyric> findByUserIdAndTrackIdAndLanguage_CodeAndLyricType(Long userId, Long trackId, String languageCode, LyricType lyricType);

    List<PersonalLyric> findByUserIdAndTrackId(Long userId, Long trackId);

    void deleteByTrackId(Long trackId);
}
