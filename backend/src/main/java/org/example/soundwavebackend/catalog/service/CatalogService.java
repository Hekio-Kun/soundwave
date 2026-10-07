package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.entity.Album;
import org.example.soundwavebackend.catalog.entity.AlbumStatus;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.repository.AlbumRepository;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * ===================================================================================================
 * [CATALOG DOMAIN SERVICE - OOP DOMAIN LOGIC]
 * Dịch vụ nghiệp vụ lõi của module Catalog chịu trách nhiệm quản lý trạng thái hiển thị và phát hành
 * của các thực thể bài hát ({@link Track}) và album ({@link Album}).
 *
 * <h3>Các nguyên lý thiết kế hướng đối tượng (OOP Principles áp dụng):</h3>
 * <ul>
 *   <li><b>Low Coupling & High Cohesion:</b> Tách biệt logic quản lý thực thể Catalog khỏi logic hàng đợi Moderation,
 *       chỉ cung cấp các API nghiệp vụ rõ ràng để cập nhật trạng thái vòng đời.</li>
 *   <li><b>Encapsulation & Rich Domain Model:</b> Ủy quyền các hành vi chuyển đổi trạng thái cho chính Entity
 *       thông qua {@link Track#updatePublicationStatus} và {@link Album#publish}, ngăn chặn Anemic Domain Model.</li>
 * </ul>
 * ===================================================================================================
 */
@Service
@RequiredArgsConstructor
public class CatalogService {
    private final TrackRepository trackRepository;
    private final AlbumRepository albumRepository;

    @Transactional(readOnly = true)
    public Optional<Track> findTrackById(Long id) {
        return trackRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Map<Long, Track> findTracksByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return trackRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Track::getId, Function.identity()));
    }

    @Transactional(readOnly = true)
    public List<Long> findTrackIdsByTitle(String search) {
        if (search == null || search.isBlank()) {
            return List.of();
        }
        return trackRepository.findTrackIdsByTitleContainingIgnoreCase(search.trim());
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - CẬP NHẬT TRẠNG THÁI PHÁT HÀNH (PUBLISHED)]
     * ===============================================================================================
     * Chuyển trạng thái xuất bản của bài hát sang {@link TrackPublicationStatus#PUBLISHED}.
     * Đồng thời, nếu bài hát thuộc một Album đang ở trạng thái {@link AlbumStatus#DRAFT},
     * hệ thống sẽ tự động kích hoạt phát hành Album tương ứng để đảm bảo tính nhất quán danh mục.
     *
     * @param trackId    ID của bài hát được phê duyệt
     * @param approvedAt Thời điểm phê duyệt
     * @return Thực thể {@link Track} đã cập nhật
     * @throws IllegalArgumentException nếu không tìm thấy bài hát
     */
    @Transactional
    public Track approveTrack(Long trackId, LocalDateTime approvedAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.PUBLISHED, null, approvedAt);

        Album album = track.getAlbum();
        if (album != null && album.getStatus() == AlbumStatus.DRAFT) {
            album.publish(approvedAt);
        }
        return track;
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - CẬP NHẬT TRẠNG THÁI TỪ CHỐI (REJECTED)]
     * ===============================================================================================
     * Chuyển trạng thái xuất bản của bài hát sang {@link TrackPublicationStatus#REJECTED} và lưu trữ
     * lý do từ chối vào thực thể bài hát.
     *
     * @param trackId    ID của bài hát bị từ chối
     * @param reason     Lý do từ chối
     * @param rejectedAt Thời điểm từ chối
     * @return Thực thể {@link Track} đã cập nhật
     * @throws IllegalArgumentException nếu không tìm thấy bài hát
     */
    @Transactional
    public Track rejectTrack(Long trackId, String reason, LocalDateTime rejectedAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.REJECTED, reason, rejectedAt);
        return track;
    }

    /**
     * ===============================================================================================
     * [TRACK LIFECYCLE - CẬP NHẬT TRẠNG THÁI GỠ BỎ (TAKEN_DOWN)]
     * ===============================================================================================
     * Chuyển trạng thái xuất bản của bài hát sang {@link TrackPublicationStatus#TAKEN_DOWN} và lưu trữ
     * lý do vi phạm, thu hồi bài hát khỏi Catalog công chúng.
     *
     * @param trackId     ID của bài hát bị gỡ bỏ
     * @param reason      Lý do gỡ bỏ bài hát
     * @param takenDownAt Thời điểm gỡ bỏ
     * @return Thực thể {@link Track} đã cập nhật
     * @throws IllegalArgumentException nếu không tìm thấy bài hát
     */
    @Transactional
    public Track takeDownTrack(Long trackId, String reason, LocalDateTime takenDownAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.TAKEN_DOWN, reason, takenDownAt);
        return track;
    }
}
