package org.example.soundwavebackend.catalog.mapper;

import org.example.soundwavebackend.catalog.dto.response.AlbumSummary;
import org.example.soundwavebackend.catalog.dto.response.CreatorSummary;
import org.example.soundwavebackend.catalog.dto.response.GenreResponse;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Genre;
import org.example.soundwavebackend.catalog.entity.Track;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CatalogMapper {

    private static final Map<String, String[]> GENRE_PALETTES = Map.of(
            "pop", new String[]{"#ecfeff", "#0891b2"},
            "ballad", new String[]{"#f5f3ff", "#7c3aed"},
            "rap-hip-hop", new String[]{"#fff7ed", "#ea580c"},
            "rnb", new String[]{"#fdf2f8", "#db2777"},
            "acoustic", new String[]{"#f0fdf4", "#16a34a"},
            "edm", new String[]{"#eff6ff", "#2563eb"},
            "indie", new String[]{"#fefce8", "#ca8a04"},
            "lofi", new String[]{"#f8fafc", "#475569"}
    );

    public GenreResponse toGenreResponse(Genre genre) {
        String slug = genre.getSlug() != null ? genre.getSlug().toLowerCase() : "";
        String[] palette = GENRE_PALETTES.getOrDefault(slug, new String[]{"#f8fafc", "#0ea5e9"});
        return new GenreResponse(
                genre.getId(),
                genre.getName(),
                genre.getSlug(),
                genre.getDescription(),
                palette[0],
                palette[1]
        );
    }

    public TrackResponse toTrackResponse(Track track, CreatorSummary creator) {
        return toTrackResponse(track, creator, null);
    }

    public TrackResponse toTrackResponse(Track track, CreatorSummary creator, String lyrics) {
        AlbumSummary albumSummary = track.getAlbum() != null
                ? new AlbumSummary(track.getAlbum().getId(), track.getAlbum().getTitle())
                : null;

        String publicationStatusStr = track.getPublicationStatus() != null
                ? track.getPublicationStatus().name()
                : "DRAFT";

        return new TrackResponse(
                track.getId(),
                track.getTitle(),
                track.getSlug(),
                track.getCoverUrl(),
                track.getAudioUrl(),
                track.getDurationMs(),
                track.getPlayCount(),
                publicationStatusStr,
                track.getGenre() != null ? track.getGenre().getSlug() : null,
                track.getGenre() != null ? track.getGenre().getName() : null,
                creator,
                albumSummary,
                track.getDescription(),
                track.getCreatedAt(),
                lyrics
        );
    }
}
