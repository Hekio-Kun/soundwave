package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.request.CreateGenreRequest;
import org.example.soundwavebackend.catalog.dto.request.UpdateGenreRequest;
import org.example.soundwavebackend.catalog.dto.response.AdminGenreResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.exception.ConflictOperationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenreManagementServiceTest {

    @Mock
    private GenreRepository genreRepository;

    @Mock
    private UserAccountPublicService userAccountPublicService;

    private GenreManagementService genreManagementService;

    @BeforeEach
    void setUp() {
        genreManagementService = new GenreManagementService(
                genreRepository,
                new CatalogMapper(),
                userAccountPublicService
        );
    }

    @Test
    void createGenre_validRequest_createsActiveGenreWithNormalizedSlug() {
        when(userAccountPublicService.getUserIdByEmail("admin@soundwave.com")).thenReturn(7L);
        when(genreRepository.save(any(Genre.class))).thenAnswer(invocation -> {
            Genre genre = invocation.getArgument(0);
            ReflectionTestUtils.setField(genre, "id", 15L);
            return genre;
        });

        AdminGenreResponse response = genreManagementService.createGenre(
                new CreateGenreRequest("Nhạc Trữ Tình", "", "Vietnamese sentimental music"),
                "admin@soundwave.com"
        );

        assertEquals("Nhạc Trữ Tình", response.name());
        assertEquals("nhac-tru-tinh", response.slug());
        assertTrue(response.active());
        assertEquals(7L, response.createdByUserId());
    }

    @Test
    void createGenre_duplicateName_throwsConflict() {
        when(genreRepository.existsByNameIgnoreCase("Pop")).thenReturn(true);

        ConflictOperationException exception = assertThrows(
                ConflictOperationException.class,
                () -> genreManagementService.createGenre(
                        new CreateGenreRequest("Pop", "pop-v2", null),
                        "admin@soundwave.com"
                )
        );

        assertEquals("GENRE_NAME_EXISTS", exception.getCode());
        verify(genreRepository, never()).save(any());
    }

    @Test
    void updateGenre_existingGenre_updatesEditableFields() {
        Genre genre = new Genre("R&B", "rnb", "Old description", 1L);
        ReflectionTestUtils.setField(genre, "id", 4L);
        when(genreRepository.findById(4L)).thenReturn(java.util.Optional.of(genre));
        when(genreRepository.save(genre)).thenReturn(genre);

        AdminGenreResponse response = genreManagementService.updateGenre(
                4L,
                new UpdateGenreRequest("R&B and Soul", "rnb-soul", "Updated description")
        );

        assertEquals("R&B and Soul", response.name());
        assertEquals("rnb-soul", response.slug());
        assertEquals("Updated description", response.description());
    }

    @Test
    void updateActiveState_existingGenre_deactivatesWithoutDeleting() {
        Genre genre = new Genre("Jazz", "jazz", null, 1L);
        ReflectionTestUtils.setField(genre, "id", 8L);
        when(genreRepository.findById(8L)).thenReturn(java.util.Optional.of(genre));
        when(genreRepository.save(genre)).thenReturn(genre);

        AdminGenreResponse response = genreManagementService.updateActiveState(8L, false);

        assertFalse(response.active());
        verify(genreRepository).save(genre);
        verify(genreRepository, never()).delete(any());
    }
}
