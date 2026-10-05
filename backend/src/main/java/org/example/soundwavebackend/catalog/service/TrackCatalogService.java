package org.example.soundwavebackend.catalog.service;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.service.UserAccountPublicService;
import org.example.soundwavebackend.catalog.dto.request.RecordPlayRequest;
import org.example.soundwavebackend.catalog.dto.response.AudioStreamInfo;
import org.example.soundwavebackend.catalog.dto.response.CreatorSummary;
import org.example.soundwavebackend.catalog.dto.response.RecordPlayResponse;
import org.example.soundwavebackend.catalog.dto.response.TrackResponse;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.example.soundwavebackend.catalog.mapper.CatalogMapper;
import org.example.soundwavebackend.catalog.repository.TrackRepository;
import org.example.soundwavebackend.catalog.specification.TrackSpecification;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.example.soundwavebackend.library.service.LibraryPublicService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpRange;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

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
    private final LibraryPublicService libraryPublicService;
    private final CatalogMapper mapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

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

    /**
     * Ghi nhận lượt nghe hợp lệ cho một bài hát đã phát hành (UC-07, BR-08).
     * Tăng playCount của bài hát và lưu bản ghi vào listening_history nếu người dùng đã đăng nhập.
     */
    @Transactional
    public RecordPlayResponse recordTrackPlay(Long trackId, RecordPlayRequest request, String userEmail) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("TRACK_NOT_FOUND", "Track not found with ID: " + trackId));

        if (track.getPublicationStatus() != TrackPublicationStatus.PUBLISHED) {
            throw new ResourceNotFoundException("TRACK_NOT_FOUND", "Track is not publicly available with ID: " + trackId);
        }

        track.incrementPlayCount();
        trackRepository.save(track);

        boolean recordedHistory = false;
        if (userEmail != null && !userEmail.isBlank()) {
            Long userId = userAccountPublicService.findUserIdByEmail(userEmail).orElse(null);
            if (userId != null) {
                libraryPublicService.recordListeningHistory(
                        userId,
                        track.getId(),
                        request.listenedDurationMs(),
                        Boolean.TRUE.equals(request.completed())
                );
                recordedHistory = true;
            }
        }

        return new RecordPlayResponse(track.getId(), track.getPlayCount(), recordedHistory);
    }

    /**
     * Chuẩn bị thông tin stream âm thanh cho một bài hát đã phát hành (UC-07).
     * Hỗ trợ cả nguồn audio từ Cloudinary/remote và nguồn cục bộ kèm Range header.
     */
    @Transactional(readOnly = true)
    public AudioStreamInfo streamTrackAudio(Long trackId, String rangeHeader) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("TRACK_NOT_FOUND", "Track not found with ID: " + trackId));

        if (track.getPublicationStatus() != TrackPublicationStatus.PUBLISHED) {
            throw new ResourceNotFoundException("TRACK_NOT_FOUND", "Track is not publicly available with ID: " + trackId);
        }

        String audioUrl = track.getAudioUrl();
        if (audioUrl == null || audioUrl.isBlank()) {
            throw new ResourceNotFoundException("AUDIO_NOT_FOUND", "Audio source is missing for track ID: " + trackId);
        }

        if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
            return streamRemoteAudio(audioUrl, rangeHeader, track.getAudioFormat());
        } else {
            return streamLocalAudio(audioUrl, rangeHeader, track.getAudioFormat(), trackId);
        }
    }

    private AudioStreamInfo streamRemoteAudio(String audioUrl, String rangeHeader, String audioFormat) {
        try {
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(audioUrl))
                    .timeout(Duration.ofSeconds(30))
                    .GET();

            if (rangeHeader != null && !rangeHeader.isBlank()) {
                reqBuilder.header("Range", rangeHeader);
            }

            HttpResponse<InputStream> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofInputStream());
            int statusCode = response.statusCode();

            String contentType = response.headers().firstValue("Content-Type").orElseGet(() -> resolveContentType(audioFormat));
            String contentRange = response.headers().firstValue("Content-Range").orElse(null);
            Long contentLength = response.headers().firstValue("Content-Length")
                    .map(Long::parseLong)
                    .orElse(null);

            StreamingResponseBody body = outputStream -> {
                try (InputStream in = response.body()) {
                    in.transferTo(outputStream);
                    outputStream.flush();
                }
            };

            return new AudioStreamInfo(statusCode, contentType, contentRange, contentLength, body);
        } catch (Exception e) {
            throw new ResourceNotFoundException("AUDIO_STREAM_ERROR", "Failed to stream audio from remote source: " + e.getMessage());
        }
    }

    private AudioStreamInfo streamLocalAudio(String audioPath, String rangeHeader, String audioFormat, Long trackId) {
        Path path = resolveLocalPath(audioPath);
        if (path == null || !Files.exists(path) || !Files.isReadable(path)) {
            throw new ResourceNotFoundException("AUDIO_NOT_FOUND", "Local audio file not found for track ID: " + trackId);
        }

        try {
            long totalLength = Files.size(path);
            String contentType = resolveContentType(audioFormat);

            if (rangeHeader != null && !rangeHeader.isBlank()) {
                List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
                if (!ranges.isEmpty()) {
                    HttpRange range = ranges.get(0);
                    long start = range.getRangeStart(totalLength);
                    long end = range.getRangeEnd(totalLength);
                    long rangeLength = end - start + 1;

                    String contentRange = "bytes " + start + "-" + end + "/" + totalLength;

                    StreamingResponseBody body = outputStream -> {
                        try (InputStream in = Files.newInputStream(path)) {
                            long skipped = in.skip(start);
                            byte[] buffer = new byte[8192];
                            long bytesRemaining = rangeLength;
                            while (bytesRemaining > 0) {
                                int toRead = (int) Math.min(buffer.length, bytesRemaining);
                                int read = in.read(buffer, 0, toRead);
                                if (read == -1) break;
                                outputStream.write(buffer, 0, read);
                                bytesRemaining -= read;
                            }
                            outputStream.flush();
                        }
                    };

                    return new AudioStreamInfo(206, contentType, contentRange, rangeLength, body);
                }
            }

            StreamingResponseBody body = outputStream -> {
                try (InputStream in = Files.newInputStream(path)) {
                    in.transferTo(outputStream);
                    outputStream.flush();
                }
            };

            return new AudioStreamInfo(200, contentType, null, totalLength, body);
        } catch (IOException e) {
            throw new ResourceNotFoundException("AUDIO_STREAM_ERROR", "Error reading local audio file: " + e.getMessage());
        }
    }

    private Path resolveLocalPath(String audioPath) {
        String clean = audioPath.startsWith("/") ? audioPath.substring(1) : audioPath;
        List<Path> candidates = List.of(
                Path.of(clean),
                Path.of("frontend/public", clean),
                Path.of("../frontend/public", clean),
                Path.of("d:/SWP/frontend/public", clean)
        );
        for (Path p : candidates) {
            if (Files.exists(p) && Files.isReadable(p)) {
                return p;
            }
        }
        return null;
    }

    private String resolveContentType(String audioFormat) {
        if (audioFormat == null || audioFormat.isBlank()) return "audio/mpeg";
        String lower = audioFormat.toLowerCase().trim();
        if (lower.contains("wav")) return "audio/wav";
        if (lower.contains("ogg")) return "audio/ogg";
        if (lower.contains("flac")) return "audio/flac";
        if (lower.contains("/")) return lower;
        return "audio/mpeg";
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
