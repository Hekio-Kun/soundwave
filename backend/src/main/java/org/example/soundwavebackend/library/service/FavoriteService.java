package org.example.soundwavebackend.library.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.service.CatalogPublicService;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.dto.response.FavoriteResponse;
import org.example.soundwavebackend.library.entity.Favorite;
import org.example.soundwavebackend.library.entity.FavoriteId;
import org.example.soundwavebackend.library.repository.FavoriteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý danh sách bài hát yêu thích của Listener.
 */
@Service
@RequiredArgsConstructor
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final CatalogPublicService catalogPublicService;
    private final UserAccountPublicService userAccountPublicService;

    /**
     * Lấy các bài hát yêu thích còn được phát hành của người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public List<TrackResponse> getFavorites(String currentUserEmail) {
        Long userId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        List<Long> trackIds = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(Favorite::getTrackId)
                .toList();
        return catalogPublicService.getTracksByIds(trackIds);
    }

    /**
     * Thêm một bài hát đã phát hành vào danh sách yêu thích.
     */
    @Transactional
    public FavoriteResponse addFavorite(Long trackId, String currentUserEmail) {
        Long userId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!catalogPublicService.trackExists(trackId)) {
            throw new ResourceNotFoundException("TRACK_NOT_FOUND", "Published track not found with ID: " + trackId);
        }

        FavoriteId favoriteId = new FavoriteId(userId, trackId);
        if (!favoriteRepository.existsById(favoriteId)) {
            favoriteRepository.save(new Favorite(userId, trackId));
        }
        return new FavoriteResponse(trackId, true);
    }

    /**
     * Xóa một bài hát khỏi danh sách yêu thích nếu liên kết đang tồn tại.
     */
    @Transactional
    public void removeFavorite(Long trackId, String currentUserEmail) {
        Long userId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        FavoriteId favoriteId = new FavoriteId(userId, trackId);
        if (favoriteRepository.existsById(favoriteId)) {
            favoriteRepository.deleteById(favoriteId);
        }
    }
}
