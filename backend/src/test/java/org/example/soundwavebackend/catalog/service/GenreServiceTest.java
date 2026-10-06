package org.example.soundwavebackend.catalog.service;

import org.example.soundwavebackend.catalog.dto.response.GenreResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.GenreRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenreServiceTest {

    @Mock
    private GenreRepository genreRepository;

    private CatalogMapper mapper;
    private GenreService genreService;

    @BeforeEach
    void setUp() {
        mapper = new CatalogMapper();
        genreService = new GenreService(genreRepository, mapper);
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
}
