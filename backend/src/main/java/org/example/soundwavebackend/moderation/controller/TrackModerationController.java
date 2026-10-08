package org.example.soundwavebackend.moderation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.moderation.dto.request.ApproveTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.RejectTrackRequest;
import org.example.soundwavebackend.moderation.dto.request.TakeDownTrackRequest;
import org.example.soundwavebackend.moderation.dto.response.SubmissionDetailResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionQueueItemResponse;
import org.example.soundwavebackend.moderation.dto.response.SubmissionStatsResponse;
import org.example.soundwavebackend.moderation.entity.SubmissionStatus;
import org.example.soundwavebackend.moderation.service.ModerationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping({"/api/v1/moderation/submissions", "/api/v1/admin/moderation/tracks"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class TrackModerationController {
    private final ModerationService moderationService;

    @GetMapping
    public ResponseEntity<Page<SubmissionQueueItemResponse>> getQueue(
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "submittedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(moderationService.getQueue(status, search, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<SubmissionStatsResponse> getQueueStats() {
        return ResponseEntity.ok(moderationService.getQueueStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionDetailResponse> getSubmissionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(moderationService.getSubmissionDetail(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<SubmissionDetailResponse> approveSubmission(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApproveTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.approveSubmission(id, request, principal.getName()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SubmissionDetailResponse> rejectSubmission(
            @PathVariable Long id,
            @Valid @RequestBody RejectTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.rejectSubmission(id, request, principal.getName()));
    }

    @PostMapping("/{id}/takedown")
    public ResponseEntity<SubmissionDetailResponse> takeDownSubmission(
            @PathVariable Long id,
            @Valid @RequestBody TakeDownTrackRequest request,
            Principal principal) {
        return ResponseEntity.ok(moderationService.takeDownSubmission(id, request, principal.getName()));
    }
}
