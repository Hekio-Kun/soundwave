package org.example.soundwavebackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

/**
 * Tự động khởi tạo dữ liệu mẫu cho thể loại nhạc và bài hát mặc định khi hệ thống khởi động.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class CatalogDataInitializer implements ApplicationRunner {
    private final GenreRepository genreRepository;
    private final TrackRepository trackRepository;
    private final UserAccountPublicService userAccountPublicService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initDefaultGenres();
        initDefaultTracks();
    }

    private void initDefaultGenres() {
        if (genreRepository.count() > 0) {
            return;
        }

        String[][] defaultGenres = {
                {"Pop", "pop", "Bright, catchy, and popular melodies."},
                {"Ballad", "ballad", "Gentle, heartfelt songs rich in emotion."},
                {"Rap / Hip-hop", "rap-hip-hop", "Energetic beats with honest, expressive lyrics."},
                {"R&B", "rnb", "Smooth, warm, and soulful melodies."},
                {"Acoustic", "acoustic", "Natural sounds from acoustic guitar and piano."},
                {"EDM", "edm", "High-energy modern electronic music."},
                {"Indie", "indie", "Independent music with a free and distinctive spirit."},
                {"Lofi", "lofi", "Relaxing sounds for studying and working."}
        };

        for (String[] g : defaultGenres) {
            Genre genre = new Genre(g[0], g[1], g[2], 1L);
            genreRepository.save(genre);
        }
        log.info("Successfully initialized {} default genres.", defaultGenres.length);
    }

    private void initDefaultTracks() {
        if (trackRepository.count() > 0) {
            return;
        }

        Long adminId = 1L;
        try {
            adminId = userAccountPublicService.getUserIdByEmail("admin@soundwave.com");
        } catch (Exception e) {
            log.warn("Could not find admin user for demo track seeder, defaulting to 1L: {}", e.getMessage());
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        Map<String, Genre> genreMap = new HashMap<>();
        genreRepository.findAll().forEach(g -> genreMap.put(g.getSlug().toLowerCase(), g));

        Object[][] defaultTracks = {
                {"Sớm Mai Dịu Dàng", "som-mai-diu-dang", "acoustic", 368000, "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80", "Từng tia nắng ấm khẽ luồn qua ô cửa..."},
                {"Thành Phố Sau Mưa", "thanh-pho-sau-mua", "pop", 421000, "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80", "Mưa tạnh rồi trên những con phố quen..."},
                {"Phía Bên Kia Biển", "phia-ben-kia-bien", "indie", 338000, "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80", "Biển xanh ngút ngàn sóng vỗ về đâu..."},
                {"Hạ Vẫn Ở Đây", "ha-van-o-day", "lofi", 312000, "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80", "Nắng vàng ươm rớt trên vai gầy..."},
                {"Đêm Trôi Rất Khẽ", "dem-troi-rat-khe", "ballad", 387000, "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80", "Đêm trôi rất khẽ qua từng kẽ tay..."},
                {"Một Khoảng Bình Yên", "mot-khoang-binh-yen", "acoustic", 356000, "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80", "Tách trà thơm bên khung cửa sổ..."},
                {"Chạm Vào Khoảng Không", "cham-vao-khoang-khong", "rnb", 329000, "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80", "Bàn tay với lấy những điều xa xôi..."},
                {"Gọi Nắng Về", "goi-nang-ve", "rap-hip-hop", 344000, "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80", "Từng nhịp bass đánh thức buổi sáng..."}
        };

        for (Object[] t : defaultTracks) {
            String title = (String) t[0];
            String slug = (String) t[1];
            String genreSlug = (String) t[2];
            Integer duration = (Integer) t[3];
            String coverUrl = (String) t[4];
            String desc = (String) t[5];

            Genre genre = genreMap.get(genreSlug);
            if (genre == null) continue;

            Track track = new Track(
                    adminId,
                    genre,
                    title,
                    slug,
                    "seed_" + slug,
                    "/audio/soundwave-demo.wav",
                    "audio/wav",
                    duration
            );
            track.updateMetadata(title, desc, null, coverUrl, now);
            track.updatePublicationStatus(TrackPublicationStatus.PUBLISHED, null, now);
            trackRepository.save(track);
        }
        log.info("Successfully initialized default published tracks.");
    }
}
