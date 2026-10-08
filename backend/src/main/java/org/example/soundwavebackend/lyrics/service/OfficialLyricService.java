package org.example.soundwavebackend.lyrics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.lyrics.entity.LyricLanguage;
import org.example.soundwavebackend.lyrics.entity.OfficialLyric;
import org.example.soundwavebackend.lyrics.repository.LyricLanguageRepository;
import org.example.soundwavebackend.lyrics.repository.OfficialLyricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * Service quản lý lời bài hát chính thức (Official Lyrics) cho từng bài hát (UC-11 & UC-19).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OfficialLyricService {
    public static final String DEFAULT_LANGUAGE_CODE = "vi";

    private final OfficialLyricRepository officialLyricRepository;
    private final LyricLanguageRepository lyricLanguageRepository;

    /**
     * Lưu hoặc cập nhật lời bài hát chính thức cho một bài hát.
     *
     * @param trackId ID của bài hát
     * @param lyricContent Nội dung lời bài hát (văn bản thuần hoặc định dạng .lrc)
     * @param userId ID người tải lên
     */
    @Transactional
    public void saveOrUpdateTrackLyric(Long trackId, String lyricContent, Long userId) {
        if (lyricContent == null || lyricContent.isBlank()) {
            officialLyricRepository.deleteByTrackId(trackId);
            return;
        }

        Optional<OfficialLyric> existing = officialLyricRepository
                .findByTrackIdAndLanguage_Code(trackId, DEFAULT_LANGUAGE_CODE);

        if (existing.isPresent()) {
            OfficialLyric lyric = existing.get();
            lyric.updateContent(lyricContent.trim(), LocalDateTime.now(ZoneOffset.UTC));
            officialLyricRepository.save(lyric);
            log.info("Cập nhật lyric cho bài hát ID: {}", trackId);
        } else {
            LyricLanguage defaultLanguage = lyricLanguageRepository.findByCode(DEFAULT_LANGUAGE_CODE)
                    .orElseGet(() -> lyricLanguageRepository.save(new LyricLanguage(DEFAULT_LANGUAGE_CODE, "Vietnamese")));
            OfficialLyric lyric = new OfficialLyric(trackId, defaultLanguage, lyricContent.trim(), userId);
            officialLyricRepository.save(lyric);
            log.info("Tạo lyric mới cho bài hát ID: {}", trackId);
        }
    }

    /**
     * Lấy nội dung lời bài hát theo ID bài hát.
     *
     * @param trackId ID của bài hát
     * @return Nội dung lời bài hát hoặc null nếu chưa có
     */
    @Transactional(readOnly = true)
    public String findLyricContentByTrackId(Long trackId) {
        return officialLyricRepository.findFirstByTrackIdOrderByCreatedAtDesc(trackId)
                .map(OfficialLyric::getLyricContent)
                .orElse(null);
    }

    /**
     * Xuất bản (Publish) lời bài hát chính thức khi duyệt bài hát thành công.
     *
     * @param trackId ID của bài hát
     * @param publishedAt Thời điểm duyệt/xuất bản
     */
    @Transactional
    public void publishLyricForTrack(Long trackId, LocalDateTime publishedAt) {
        officialLyricRepository.findByTrackIdAndLanguage_Code(trackId, DEFAULT_LANGUAGE_CODE)
                .ifPresent(lyric -> {
                    lyric.publish(publishedAt);
                    officialLyricRepository.save(lyric);
                    log.info("Đã xuất bản lyric cho bài hát ID: {}", trackId);
                });
    }

    /**
     * Hủy xuất bản (Unpublish/Draft) lời bài hát khi bài hát bị gỡ hoặc từ chối.
     *
     * @param trackId ID của bài hát
     * @param updatedAt Thời điểm cập nhật
     */
    @Transactional
    public void unpublishLyricForTrack(Long trackId, LocalDateTime updatedAt) {
        officialLyricRepository.findByTrackIdAndLanguage_Code(trackId, DEFAULT_LANGUAGE_CODE)
                .ifPresent(lyric -> {
                    lyric.unpublish(updatedAt);
                    officialLyricRepository.save(lyric);
                    log.info("Đã chuyển lyric về DRAFT cho bài hát ID: {}", trackId);
                });
    }

    /**
     * Xóa lời bài hát liên kết với một bài hát khi bài hát bị xóa.
     *
     * @param trackId ID của bài hát
     */
    @Transactional
    public void deleteByTrackId(Long trackId) {
        officialLyricRepository.deleteByTrackId(trackId);
        log.info("Đã xóa lyric của bài hát ID: {}", trackId);
    }
}
