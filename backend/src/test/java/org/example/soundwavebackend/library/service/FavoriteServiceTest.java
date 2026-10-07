package org.example.soundwavebackend.library.service;

import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.service.CatalogPublicService;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.entity.Favorite;
import org.example.soundwavebackend.library.entity.FavoriteId;
import org.example.soundwavebackend.library.repository.FavoriteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {
    @Mock
    private FavoriteRepository favoriteRepository;
    @Mock
    private CatalogPublicService catalogPublicService;
    @Mock
    private UserAccountPublicService userAccountPublicService;

    private FavoriteService favoriteService;

    @BeforeEach
    void setUp() {
        favoriteService = new FavoriteService(favoriteRepository, catalogPublicService, userAccountPublicService);
    }

    @Test
    void getFavorites_ShouldKeepStoredOrder() {
        when(userAccountPublicService.getUserIdByEmail("listener@soundwave.com")).thenReturn(7L);
        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(7L))
                .thenReturn(List.of(new Favorite(7L, 20L), new Favorite(7L, 10L)));
        when(catalogPublicService.getTracksByIds(List.of(20L, 10L))).thenReturn(List.<TrackResponse>of());

        favoriteService.getFavorites("listener@soundwave.com");

        verify(catalogPublicService).getTracksByIds(List.of(20L, 10L));
    }

    @Test
    void addFavorite_ShouldBeIdempotent() {
        FavoriteId favoriteId = new FavoriteId(7L, 20L);
        when(userAccountPublicService.getUserIdByEmail("listener@soundwave.com")).thenReturn(7L);
        when(catalogPublicService.trackExists(20L)).thenReturn(true);
        when(favoriteRepository.existsById(favoriteId)).thenReturn(true);

        var response = favoriteService.addFavorite(20L, "listener@soundwave.com");

        assertEquals(20L, response.trackId());
        verify(favoriteRepository, never()).save(org.mockito.ArgumentMatchers.any(Favorite.class));
    }

    @Test
    void addFavorite_WhenTrackIsNotPublished_ShouldReject() {
        when(userAccountPublicService.getUserIdByEmail("listener@soundwave.com")).thenReturn(7L);
        when(catalogPublicService.trackExists(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> favoriteService.addFavorite(99L, "listener@soundwave.com"));
    }

    @Test
    void removeFavorite_ShouldDeleteOwnedLink() {
        FavoriteId favoriteId = new FavoriteId(7L, 20L);
        when(userAccountPublicService.getUserIdByEmail("listener@soundwave.com")).thenReturn(7L);
        when(favoriteRepository.existsById(favoriteId)).thenReturn(true);

        favoriteService.removeFavorite(20L, "listener@soundwave.com");

        verify(favoriteRepository).deleteById(favoriteId);
    }
}
