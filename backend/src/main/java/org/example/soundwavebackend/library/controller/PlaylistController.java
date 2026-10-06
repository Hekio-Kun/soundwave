package org.example.soundwavebackend.library.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.library.dto.request.AddTrackToPlaylistRequest;
import org.example.soundwavebackend.library.dto.request.CreatePlaylistRequest;
import org.example.soundwavebackend.library.dto.request.ReorderPlaylistTracksRequest;
import org.example.soundwavebackend.library.dto.request.UpdatePlaylistRequest;
import org.example.soundwavebackend.library.dto.response.PlaylistResponse;
import org.example.soundwavebackend.library.service.PlaylistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý các yêu cầu HTTP liên quan đến quản lý danh sách phát (Playlist CRUD).
 */
@RestController
@RequestMapping("/api/v1/playlists")
@RequiredArgsConstructor
public class PlaylistController {
    private final PlaylistService playlistService;

    /**
     * Tải lên ảnh bìa cho Playlist từ file JPG/PNG lên Cloudinary (UC-15).
     */
    @PostMapping(value = "/upload-cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPlaylistCover(
            @RequestPart("cover") MultipartFile cover,
            Principal principal
    ) {
        String coverUrl = playlistService.uploadPlaylistCover(cover, principal.getName());
        return ResponseEntity.ok(Map.of("coverUrl", coverUrl));
    }

    /**
     * Tạo mới danh sách phát.
     */
    @PostMapping
    public ResponseEntity<PlaylistResponse> createPlaylist(
            @Valid @RequestBody CreatePlaylistRequest request,
            Principal principal
    ) {
        PlaylistResponse response = playlistService.createPlaylist(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách phát của người dùng đang đăng nhập.
     */
    @GetMapping("/me")
    public ResponseEntity<List<PlaylistResponse>> getMyPlaylists(Principal principal) {
        return ResponseEntity.ok(playlistService.getMyPlaylists(principal.getName()));
    }

    /**
     * Lấy danh sách phát công khai hoặc của tôi nếu có đăng nhập.
     */
    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> getPlaylists(
            @RequestParam(required = false, defaultValue = "false") boolean myOnly,
            Principal principal
    ) {
        if (myOnly || principal != null) {
            return ResponseEntity.ok(playlistService.getMyPlaylists(principal != null ? principal.getName() : ""));
        }
        return ResponseEntity.ok(playlistService.getPublicPlaylists());
    }

    /**
     * Lấy chi tiết thông tin và bài hát trong playlist.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> getPlaylistDetails(
            @PathVariable Long id,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(playlistService.getPlaylistById(id, email));
    }

    /**
     * Cập nhật thông tin chi tiết playlist.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PlaylistResponse> updatePlaylist(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlaylistRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(playlistService.updatePlaylist(id, request, principal.getName()));
    }

    /**
     * Xóa danh sách phát.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(
            @PathVariable Long id,
            Principal principal
    ) {
        playlistService.deletePlaylist(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Thêm bài hát vào playlist.
     */
    @PostMapping("/{id}/tracks")
    public ResponseEntity<PlaylistResponse> addTrackToPlaylist(
            @PathVariable Long id,
            @Valid @RequestBody AddTrackToPlaylistRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(playlistService.addTrackToPlaylist(id, request, principal.getName()));
    }

    /**
     * Xóa bài hát khỏi playlist.
     */
    @DeleteMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<PlaylistResponse> removeTrackFromPlaylist(
            @PathVariable Long id,
            @PathVariable Long trackId,
            Principal principal
    ) {
        return ResponseEntity.ok(playlistService.removeTrackFromPlaylist(id, trackId, principal.getName()));
    }

    /**
     * Thay đổi thứ tự các bài hát trong playlist.
     */
    @PutMapping("/{id}/tracks/reorder")
    public ResponseEntity<PlaylistResponse> reorderPlaylistTracks(
            @PathVariable Long id,
            @RequestBody ReorderPlaylistTracksRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(playlistService.reorderPlaylistTracks(id, request, principal.getName()));
    }
}
