package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.catalog.entity.Album;
import org.example.soundwavebackend.catalog.entity.AlbumStatus;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.repository.AlbumRepository;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final TrackRepository trackRepository;
    private final AlbumRepository albumRepository;

    @Transactional(readOnly = true)
    public Optional<Track> findTrackById(Long id) {
        return trackRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Map<Long, Track> findTracksByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return trackRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Track::getId, Function.identity()));
    }

    @Transactional(readOnly = true)
    public List<Long> findTrackIdsByTitle(String search) {
        if (search == null || search.isBlank()) {
            return List.of();
        }
        return trackRepository.findTrackIdsByTitleContainingIgnoreCase(search.trim());
    }

    @Transactional
    public Track approveTrack(Long trackId, LocalDateTime approvedAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.PUBLISHED, null, approvedAt);

        Album album = track.getAlbum();
        if (album != null && album.getStatus() == AlbumStatus.DRAFT) {
            album.publish(approvedAt);
        }
        return track;
    }

    @Transactional
    public Track rejectTrack(Long trackId, String reason, LocalDateTime rejectedAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.REJECTED, reason, rejectedAt);
        return track;
    }

    @Transactional
    public Track takeDownTrack(Long trackId, String reason, LocalDateTime takenDownAt) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new IllegalArgumentException("Track not found with id: " + trackId));
        track.updatePublicationStatus(TrackPublicationStatus.TAKEN_DOWN, reason, takenDownAt);
        return track;
    }
}
