package org.example.soundwavebackend.config;

import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogDataInitializerTest {

    @Mock
    private GenreRepository genreRepository;
    @Mock
    private TrackRepository trackRepository;
    @Mock
    private UserAccountPublicService userAccountPublicService;

    private CatalogDataInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new CatalogDataInitializer(genreRepository, trackRepository, userAccountPublicService);
        ReflectionTestUtils.setField(initializer, "demoSeedEnabled", true);
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@soundwave.com");
    }

    @Test
    void run_WhenDatabaseIsEmpty_ShouldCreateGenresWithoutHardCodedUserId() throws Exception {
        when(genreRepository.findBySlugIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userAccountPublicService.findUserIdByEmail("admin@soundwave.com")).thenReturn(Optional.of(42L));
        when(trackRepository.count()).thenReturn(1L);

        initializer.run(null);

        ArgumentCaptor<Genre> genreCaptor = ArgumentCaptor.forClass(Genre.class);
        verify(genreRepository, times(8)).save(genreCaptor.capture());
        assertEquals(8, genreCaptor.getAllValues().size());
        genreCaptor.getAllValues().forEach(genre -> assertNull(genre.getCreatedByUserId()));
    }

    @Test
    void run_WhenAdminDoesNotExist_ShouldSkipDemoTracks() throws Exception {
        Genre existingGenre = mock(Genre.class);
        when(genreRepository.findBySlugIgnoreCase(anyString())).thenReturn(Optional.of(existingGenre));
        when(userAccountPublicService.findUserIdByEmail("admin@soundwave.com")).thenReturn(Optional.empty());

        initializer.run(null);

        verifyNoInteractions(trackRepository);
    }
}
