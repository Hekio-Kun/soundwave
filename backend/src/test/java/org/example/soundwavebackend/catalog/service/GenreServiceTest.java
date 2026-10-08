package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.request.CreateGenreRequest;
import org.example.soundwavebackend.catalog.dto.request.UpdateGenreRequest;
import org.example.soundwavebackend.catalog.dto.response.AdminGenreResponse;
import org.example.soundwavebackend.catalog.dto.response.GenreResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
import org.example.soundwavebackend.exception.ConflictOperationException;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenreServiceTest {

    @Mock
    private GenreRepository genreRepository;

    @Mock
    private UserAccountPublicService userAccountPublicService;

    private CatalogMapper mapper;
    private GenreService genreService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        genreService = new GenreService(genreRepository, mapper, userAccountPublicService);
    }

    @Test
    void getActiveGenres_ShouldReturnAllActive() {
        Genre genre = new Genre("Pop", "pop", "Catchy pop", 1L);
        ReflectionTestUtils.setField(genre, "id", 1L);

        when(genreRepository.findAllByActiveTrueOrderByNameAsc()).thenReturn(List.of(genre));

        List<GenreResponse> result = genreService.getActiveGenres();

        assertEquals(1, result.size());
        assertEquals("Pop", result.get(0).name());
        assertEquals("pop", result.get(0).slug());
        assertNotNull(result.get(0).color());
        assertNotNull(result.get(0).accent());
    }

    @Test
    void getGenreBySlugOrId_WhenSlugFound_ShouldReturnGenre() {
        Genre genre = new Genre("Ballad", "ballad", "Soft ballad", 1L);
        ReflectionTestUtils.setField(genre, "id", 2L);

        when(genreRepository.findBySlugIgnoreCaseAndActiveTrue("ballad")).thenReturn(Optional.of(genre));

        GenreResponse response = genreService.getGenreBySlugOrId("ballad");

        assertEquals("Ballad", response.name());
        assertEquals("ballad", response.slug());
    }

    @Test
    void getGenreBySlugOrId_WhenNotFound_ShouldThrowException() {
        when(genreRepository.findBySlugIgnoreCaseAndActiveTrue("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                genreService.getGenreBySlugOrId("unknown"));
    }

    @Test
    void createGenre_validRequest_createsActiveGenreWithNormalizedSlug() {
        when(userAccountPublicService.getUserIdByEmail("admin@soundwave.com")).thenReturn(7L);
        when(genreRepository.save(any(Genre.class))).thenAnswer(invocation -> {
            Genre genre = invocation.getArgument(0);
            ReflectionTestUtils.setField(genre, "id", 15L);
            return genre;
        });

        AdminGenreResponse response = genreService.createGenre(
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
                () -> genreService.createGenre(
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
        when(genreRepository.findById(4L)).thenReturn(Optional.of(genre));
        when(genreRepository.save(genre)).thenReturn(genre);

        AdminGenreResponse response = genreService.updateGenre(
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
        when(genreRepository.findById(8L)).thenReturn(Optional.of(genre));
        when(genreRepository.save(genre)).thenReturn(genre);

        AdminGenreResponse response = genreService.updateActiveState(8L, false);

        assertFalse(response.active());
        verify(genreRepository).save(genre);
        verify(genreRepository, never()).delete(any());
    }
}
