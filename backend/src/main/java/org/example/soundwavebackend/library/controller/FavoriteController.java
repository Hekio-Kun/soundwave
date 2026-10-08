package org.example.soundwavebackend.library.controller;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.library.dto.response.FavoriteResponse;
import org.example.soundwavebackend.library.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * Controller cung cấp API quản lý bài hát yêu thích cho Listener.
 */
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LISTENER')")
public class FavoriteController {
    private final FavoriteService favoriteService;

    /**
     * Lấy danh sách bài hát yêu thích của Listener hiện tại.
     */
    @GetMapping
    public ResponseEntity<List<TrackResponse>> getFavorites(Principal principal) {
        return ResponseEntity.ok(favoriteService.getFavorites(principal.getName()));
    }

    /**
     * Thêm bài hát vào danh sách yêu thích.
     */
    @PostMapping("/{trackId}")
    public ResponseEntity<FavoriteResponse> addFavorite(@PathVariable Long trackId, Principal principal) {
        return ResponseEntity.ok(favoriteService.addFavorite(trackId, principal.getName()));
    }

    /**
     * Xóa bài hát khỏi danh sách yêu thích.
     */
    @DeleteMapping("/{trackId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long trackId, Principal principal) {
        favoriteService.removeFavorite(trackId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
