package org.example.soundwavebackend.library.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.library.entity.ListeningHistory;
import org.example.soundwavebackend.library.repository.ListeningHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Public service cung cấp khả năng tương tác với module Library cho các module khác.
 */
@Service
@RequiredArgsConstructor
public class LibraryPublicService {
    private final ListeningHistoryRepository listeningHistoryRepository;

    /**
     * Ghi nhận một sự kiện nghe bài hát vào lịch sử nghe của người dùng.
     */
    @Transactional
    public void recordListeningHistory(Long userId, Long trackId, Integer listenedDurationMs, boolean completed) {
        if (userId == null || trackId == null) {
            return;
        }
        int durationMs = listenedDurationMs != null ? Math.max(0, listenedDurationMs) : 0;
        ListeningHistory history = new ListeningHistory(userId, trackId, durationMs, completed);
        listeningHistoryRepository.save(history);
    }
}
