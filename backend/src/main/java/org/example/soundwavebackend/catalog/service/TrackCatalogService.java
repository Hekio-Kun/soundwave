package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.response.CreatorSummary;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.example.soundwavebackend.catalog.specification.TrackSpecification;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service xử lý việc tìm kiếm, lọc và xem chi tiết bài hát trong danh mục phát hành.
 */
@Service
@RequiredArgsConstructor
public class TrackCatalogService {
    private final TrackRepository trackRepository;
    private final UserAccountPublicService userAccountPublicService;
    private final CatalogMapper mapper;

    /**
     * Lọc và tìm kiếm danh sách bài hát đã phát hành theo thể loại, từ khóa và sắp xếp.
     */
    @Transactional(readOnly = true)
    public Page<TrackResponse> getPublishedTracks(String genre, String search, String sortType, int page, int size) {
        Sort sort = resolveSort(sortType);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), sort);

        Specification<Track> spec = TrackSpecification.filterCatalog(
                TrackPublicationStatus.PUBLISHED,
                genre,
                search
        );

        Page<Track> trackPage = trackRepository.findAll(spec, pageable);

        Set<Long> uploaderIds = trackPage.getContent().stream()
                .map(Track::getUploaderUserId)
                .collect(Collectors.toSet());

        Map<Long, UserProfileSummary> userProfiles = userAccountPublicService.getUserSummariesByIds(uploaderIds);

        return trackPage.map(track -> {
            UserProfileSummary uploader = userProfiles.get(track.getUploaderUserId());
            CreatorSummary creator = uploader != null
                    ? new CreatorSummary(uploader.userId(), uploader.displayName(), uploader.avatarUrl())
                    : new CreatorSummary(track.getUploaderUserId(), "Unknown Artist", null);
            return mapper.toTrackResponse(track, creator);
        });
    }

    /**
     * Xem thông tin chi tiết một bài hát theo ID hoặc Slug.
     */
    @Transactional(readOnly = true)
    public TrackResponse getTrackByIdOrSlug(String idOrSlug) {
        Track track = null;
        try {
            Long id = Long.parseLong(idOrSlug);
            track = trackRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {
            // Not numeric ID, lookup by slug
        }

        if (track == null) {
            track = trackRepository.findBySlugIgnoreCase(idOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("TRACK_NOT_FOUND", "Track not found: " + idOrSlug));
        }

        UserProfileSummary uploader = null;
        try {
            uploader = userAccountPublicService.getUserSummaryById(track.getUploaderUserId());
        } catch (Exception ignored) {
        }

        CreatorSummary creator = uploader != null
                ? new CreatorSummary(uploader.userId(), uploader.displayName(), uploader.avatarUrl())
                : new CreatorSummary(track.getUploaderUserId(), "Unknown Artist", null);

        return mapper.toTrackResponse(track, creator);
    }

    private Sort resolveSort(String sortType) {
        if (sortType == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sortType.toLowerCase().trim()) {
            case "trending", "plays" -> Sort.by(Sort.Direction.DESC, "playCount");
            case "title", "name" -> Sort.by(Sort.Direction.ASC, "title");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
