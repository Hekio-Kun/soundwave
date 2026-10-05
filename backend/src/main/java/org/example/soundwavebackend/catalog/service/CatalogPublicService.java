package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.CreatorSummary;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Public service cung cấp thông tin bài hát từ module Catalog cho các module khác trong hệ thống Modular Monolith.
 */
@Service
@RequiredArgsConstructor
public class CatalogPublicService {
    private final TrackRepository trackRepository;
    private final UserAccountPublicService userAccountPublicService;
    private final CatalogMapper mapper;

    /**
     * Kiểm tra bài hát có tồn tại trong danh mục hay không.
     */
    @Transactional(readOnly = true)
    public boolean trackExists(Long trackId) {
        return trackId != null && trackRepository.existsById(trackId);
    }

    /**
     * Lấy danh sách chi tiết các bài hát theo đúng thứ tự của danh sách ID được cung cấp.
     */
    @Transactional(readOnly = true)
    public List<TrackResponse> getTracksByIds(List<Long> trackIds) {
        if (trackIds == null || trackIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Track> foundTracks = trackRepository.findByIdIn(trackIds);
        Map<Long, Track> trackMap = foundTracks.stream()
                .collect(Collectors.toMap(Track::getId, t -> t, (a, b) -> a));

        Set<Long> uploaderIds = foundTracks.stream()
                .map(Track::getUploaderUserId)
                .collect(Collectors.toSet());

        Map<Long, UserProfileSummary> userProfiles = userAccountPublicService.getUserSummariesByIds(uploaderIds);

        List<TrackResponse> orderedResponses = new ArrayList<>();
        for (Long trackId : trackIds) {
            Track track = trackMap.get(trackId);
            if (track != null) {
                UserProfileSummary uploader = userProfiles.get(track.getUploaderUserId());
                CreatorSummary creator = uploader != null
                        ? new CreatorSummary(uploader.userId(), uploader.displayName(), uploader.avatarUrl())
                        : new CreatorSummary(track.getUploaderUserId(), "Unknown Artist", null);
                orderedResponses.add(mapper.toTrackResponse(track, creator));
            }
        }
        return orderedResponses;
    }
}
