package org.example.soundwavebackend.library.repository;

import org.example.soundwavebackend.library.entity.ListeningHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListeningHistoryRepository extends JpaRepository<ListeningHistory, Long> {
    Page<ListeningHistory> findByUserIdOrderByPlayedAtDesc(Long userId, Pageable pageable);

    List<ListeningHistory> findTop50ByUserIdOrderByPlayedAtDesc(Long userId);

    long countByUserId(Long userId);
}
