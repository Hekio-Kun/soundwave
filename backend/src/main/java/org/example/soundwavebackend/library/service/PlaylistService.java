package org.example.soundwavebackend.library.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.service.CatalogPublicService;
import org.example.soundwavebackend.exception.ConflictOperationException;
import org.example.soundwavebackend.exception.ForbiddenOperationException;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.dto.request.AddTrackToPlaylistRequest;
import org.example.soundwavebackend.library.dto.request.CreatePlaylistRequest;
import org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest;
import org.example.soundwavebackend.library.dto.request.UpdatePlaylistRequest;
import org.example.soundwavebackend.library.dto.response.PlaylistResponse;
import org.example.soundwavebackend.library.entity.Playlist;
import org.example.soundwavebackend.library.entity.PlaylistTrack;
import org.example.soundwavebackend.library.entity.PlaylistVisibility;
import org.example.soundwavebackend.library.mapper.PlaylistMapper;
import org.example.soundwavebackend.library.repository.PlaylistRepository;
import org.example.soundwavebackend.library.repository.PlaylistTrackRepository;
import org.example.soundwavebackend.media.dto.response.StoredMediaResponse;
import org.example.soundwavebackend.media.service.CloudMediaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service xử lý các use case quản lý danh sách phát (Playlist CRUD) và bài hát bên trong playlist.
 */
@Service
@RequiredArgsConstructor
public class PlaylistService {
    private static final String DEFAULT_OWNER_NAME = "User";
    private static final int TEMPORARY_POSITION_OFFSET = 100_000;

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final CatalogPublicService catalogPublicService;
    private final UserAccountPublicService userAccountPublicService;
    private final PlaylistMapper mapper;
    private final CloudMediaService cloudMediaService;

    /**
     * Tải lên ảnh bìa danh sách phát (Playlist Cover) từ file JPG/PNG lên Cloudinary (UC-15).
     */
    @Transactional
    public String uploadPlaylistCover(MultipartFile file, String currentUserEmail) {
        UserProfileSummary user = userAccountPublicService.getUserSummaryByEmail(currentUserEmail);
        StoredMediaResponse response = cloudMediaService.uploadPlaylistCover(file, user.userId());
        return response.secureUrl();
    }

    /**
     * Tạo danh sách phát mới cho người dùng hiện tại.
     */
    @Transactional
    public PlaylistResponse createPlaylist(CreatePlaylistRequest request, String currentUserEmail) {
        UserProfileSummary currentUser = userAccountPublicService.getUserSummaryByEmail(currentUserEmail);

        Playlist playlist = new Playlist(currentUser.userId(), request.title().trim());
        playlist.update(
                request.title().trim(),
                request.description(),
                resolveVisibility(request.isPrivate()),
                null,
                request.coverUrl(),
                LocalDateTime.now(ZoneOffset.UTC)
        );

        Playlist saved = playlistRepository.save(playlist);
        return mapper.toResponse(saved, currentUser.displayName(), Collections.emptyList(), Collections.emptyList());
    }

    /**
     * Lấy danh sách phát của người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public List<PlaylistResponse> getMyPlaylists(String currentUserEmail) {
        UserProfileSummary currentUser = userAccountPublicService.getUserSummaryByEmail(currentUserEmail);
        List<Playlist> playlists = playlistRepository.findByOwnerUserIdOrderByUpdatedAtDesc(currentUser.userId());

        return playlists.stream().map(playlist -> {
            return toResponse(playlist, currentUser.displayName());
        }).toList();
    }

    /**
     * Lấy danh sách phát công khai trên hệ thống.
     */
    @Transactional(readOnly = true)
    public List<PlaylistResponse> getPublicPlaylists() {
        List<Playlist> playlists = playlistRepository.findByVisibilityOrderByUpdatedAtDesc(PlaylistVisibility.PUBLIC);
        Set<Long> ownerIds = playlists.stream().map(Playlist::getOwnerUserId).collect(Collectors.toSet());
        Map<Long, UserProfileSummary> userProfiles = userAccountPublicService.getUserSummariesByIds(ownerIds);

        return playlists.stream().map(playlist -> {
            UserProfileSummary owner = userProfiles.get(playlist.getOwnerUserId());
            String ownerName = owner != null ? owner.displayName() : DEFAULT_OWNER_NAME;
            return toResponse(playlist, ownerName);
        }).toList();
    }

    /**
     * Lấy chi tiết thông tin và toàn bộ bài hát trong playlist.
     */
    @Transactional(readOnly = true)
    public PlaylistResponse getPlaylistById(Long id, String currentUserEmail) {
        Playlist playlist = findPlaylist(id);
        Long currentUserId = resolveCurrentUserId(currentUserEmail).orElse(null);

        if (playlist.getVisibility() == PlaylistVisibility.PRIVATE) {
            if (currentUserId == null || !currentUserId.equals(playlist.getOwnerUserId())) {
                throw new ForbiddenOperationException("PLAYLIST_PRIVATE", "This playlist is private and can only be viewed by its owner.");
            }
        }

        return toResponse(playlist, resolveOwnerName(playlist.getOwnerUserId()));
    }

    private boolean canManagePlaylist(Playlist playlist, Long currentUserId) {
        if (currentUserId.equals(playlist.getOwnerUserId())) {
            return true;
        }
        return userAccountPublicService.findUserSummaryById(currentUserId)
                .map(user -> "ADMIN".equalsIgnoreCase(user.role()))
                .orElse(false);
    }

    /**
     * Cập nhật thông tin tiêu đề, mô tả, quyền riêng tư và ảnh bìa playlist.
     */
    @Transactional
    public PlaylistResponse updatePlaylist(Long id, UpdatePlaylistRequest request, String currentUserEmail) {
        Playlist playlist = findPlaylist(id);

        Long currentUserId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!canManagePlaylist(playlist, currentUserId)) {
            throw new ForbiddenOperationException("FORBIDDEN", "Only the owner can modify this playlist.");
        }

        playlist.update(
                request.title().trim(),
                request.description(),
                resolveVisibility(request.isPrivate()),
                null,
                request.coverUrl(),
                LocalDateTime.now(ZoneOffset.UTC)
        );

        return toResponse(playlist, resolveOwnerName(playlist.getOwnerUserId()));
    }

    /**
     * Xóa playlist cùng toàn bộ danh sách liên kết bài hát.
     */
    @Transactional
    public void deletePlaylist(Long id, String currentUserEmail) {
        Playlist playlist = findPlaylist(id);

        Long currentUserId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!canManagePlaylist(playlist, currentUserId)) {
            throw new ForbiddenOperationException("FORBIDDEN", "Only the owner can delete this playlist.");
        }

        playlistTrackRepository.deleteByPlaylistId(id);
        playlistRepository.delete(playlist);
    }

    /**
     * Thêm bài hát vào danh sách phát.
     */
    @Transactional
    public PlaylistResponse addTrackToPlaylist(Long playlistId, AddTrackToPlaylistRequest request, String currentUserEmail) {
        Playlist playlist = findPlaylist(playlistId);

        Long currentUserId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!canManagePlaylist(playlist, currentUserId)) {
            throw new ForbiddenOperationException("FORBIDDEN", "Only the owner can add tracks to this playlist.");
        }

        if (!catalogPublicService.trackExists(request.trackId())) {
            throw new ResourceNotFoundException("TRACK_NOT_FOUND", "Track not found in catalog with ID: " + request.trackId());
        }

        if (playlistTrackRepository.existsByPlaylistIdAndTrackId(playlistId, request.trackId())) {
            throw new ConflictOperationException("TRACK_ALREADY_IN_PLAYLIST", "Track is already present in this playlist.");
        }

        int nextPosition = playlistTrackRepository.findMaxPositionByPlaylistId(playlistId) + 1;
        PlaylistTrack entry = new PlaylistTrack(playlistId, request.trackId(), currentUserId, nextPosition);
        playlistTrackRepository.save(entry);

        touch(playlist);

        return toResponse(playlist, resolveOwnerName(playlist.getOwnerUserId()));
    }

    /**
     * Xóa bài hát khỏi danh sách phát và tự động sắp xếp lại thứ tự các bài hát còn lại.
     */
    @Transactional
    public PlaylistResponse removeTrackFromPlaylist(Long playlistId, Long trackId, String currentUserEmail) {
        Playlist playlist = findPlaylist(playlistId);

        Long currentUserId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!canManagePlaylist(playlist, currentUserId)) {
            throw new ForbiddenOperationException("FORBIDDEN", "Only the owner can remove tracks from this playlist.");
        }

        PlaylistTrack entry = playlistTrackRepository.findByPlaylistIdAndTrackId(playlistId, trackId)
                .orElseThrow(() -> new ResourceNotFoundException("TRACK_NOT_IN_PLAYLIST", "Track is not in this playlist."));

        playlistTrackRepository.delete(entry);
        playlistTrackRepository.flush();

        List<PlaylistTrack> remaining = playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        int tempPos = TEMPORARY_POSITION_OFFSET;
        for (PlaylistTrack pt : remaining) {
            pt.moveTo(tempPos++);
        }
        playlistTrackRepository.saveAllAndFlush(remaining);

        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).moveTo(i + 1);
        }
        playlistTrackRepository.saveAll(remaining);

        touch(playlist);

        return toResponse(playlist, resolveOwnerName(playlist.getOwnerUserId()));
    }

    /**
     * Thay đổi thứ tự các bài hát trong danh sách phát (Move Up/Down hoặc cung cấp thứ tự mới).
     */
    @Transactional
    public PlaylistResponse reorderPlaylistTracks(Long playlistId, ReorderPlaylistTracksRequest request, String currentUserEmail) {
        Playlist playlist = findPlaylist(playlistId);

        Long currentUserId = userAccountPublicService.getUserIdByEmail(currentUserEmail);
        if (!canManagePlaylist(playlist, currentUserId)) {
            throw new ForbiddenOperationException("FORBIDDEN", "Only the owner can reorder tracks in this playlist.");
        }

        List<PlaylistTrack> currentTracks = playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(playlistId);

        if (request.trackIds() != null && !request.trackIds().isEmpty()) {
            Map<Long, PlaylistTrack> trackMap = currentTracks.stream()
                    .collect(Collectors.toMap(PlaylistTrack::getTrackId, pt -> pt, (a, b) -> a));

            int temp = TEMPORARY_POSITION_OFFSET;
            for (PlaylistTrack pt : currentTracks) {
                pt.moveTo(temp++);
            }
            playlistTrackRepository.saveAllAndFlush(currentTracks);

            int pos = 1;
            for (Long tId : request.trackIds()) {
                PlaylistTrack pt = trackMap.get(tId);
                if (pt != null) {
                    pt.moveTo(pos++);
                }
            }
            playlistTrackRepository.saveAll(currentTracks);
        } else if (request.trackId() != null && request.direction() != null) {
            int targetIdx = -1;
            for (int i = 0; i < currentTracks.size(); i++) {
                if (currentTracks.get(i).getTrackId().equals(request.trackId())) {
                    targetIdx = i;
                    break;
                }
            }

            if (targetIdx != -1) {
                String dir = request.direction().trim().toUpperCase(Locale.ROOT);
                int swapIdx = "UP".equals(dir) ? targetIdx - 1 : targetIdx + 1;
                if (swapIdx >= 0 && swapIdx < currentTracks.size()) {
                    PlaylistTrack a = currentTracks.get(targetIdx);
                    PlaylistTrack b = currentTracks.get(swapIdx);
                    int aPos = a.getPosition();
                    int bPos = b.getPosition();

                    a.moveTo(TEMPORARY_POSITION_OFFSET + aPos);
                    playlistTrackRepository.saveAndFlush(a);

                    b.moveTo(aPos);
                    playlistTrackRepository.saveAndFlush(b);

                    a.moveTo(bPos);
                    playlistTrackRepository.save(a);
                }
            }
        }

        return toResponse(playlist, resolveOwnerName(playlist.getOwnerUserId()));
    }

    private Playlist findPlaylist(Long playlistId) {
        return playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PLAYLIST_NOT_FOUND",
                        "Playlist not found with ID: " + playlistId
                ));
    }

    private Optional<Long> resolveCurrentUserId(String currentUserEmail) {
        if (currentUserEmail == null || currentUserEmail.isBlank()) {
            return Optional.empty();
        }
        return userAccountPublicService.findUserIdByEmail(currentUserEmail);
    }

    private String resolveOwnerName(Long ownerUserId) {
        return userAccountPublicService.findUserSummaryById(ownerUserId)
                .map(UserProfileSummary::displayName)
                .orElse(DEFAULT_OWNER_NAME);
    }

    private PlaylistVisibility resolveVisibility(Boolean isPrivate) {
        return Boolean.TRUE.equals(isPrivate) ? PlaylistVisibility.PRIVATE : PlaylistVisibility.PUBLIC;
    }

    private PlaylistResponse toResponse(Playlist playlist, String ownerName) {
        List<Long> trackIds = playlistTrackRepository.findByPlaylistIdOrderByPositionAsc(playlist.getId()).stream()
                .map(PlaylistTrack::getTrackId)
                .toList();
        List<TrackResponse> tracks = catalogPublicService.getTracksByIds(trackIds);
        return mapper.toResponse(playlist, ownerName, trackIds, tracks);
    }

    private void touch(Playlist playlist) {
        playlist.update(
                playlist.getName(),
                playlist.getDescription(),
                playlist.getVisibility(),
                playlist.getCoverPublicId(),
                playlist.getCoverUrl(),
                LocalDateTime.now(ZoneOffset.UTC)
        );
    }
}
