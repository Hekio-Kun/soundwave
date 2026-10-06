package org.example.soundwavebackend.library.controller;

import org.example.soundwavebackend.library.service.PlaylistService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class PlaylistControllerTest {

    @Test
    void getPlaylistsReturnsUnauthorizedForGuestRequestingMyOnly() {
        PlaylistService playlistService = mock(PlaylistService.class);
        PlaylistController controller = new PlaylistController(playlistService);

        var response = controller.getPlaylists(true, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(playlistService);
    }
}
