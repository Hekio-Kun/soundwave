package org.example.soundwavebackend.lyrics.repository;

import org.example.soundwavebackend.lyrics.entity.LyricLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LyricLanguageRepository extends JpaRepository<LyricLanguage, Short> {
    Optional<LyricLanguage> findByCode(String code);
}
