package org.example.soundwavebackend.moderation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ===================================================================================================
 * [TRACK LIFECYCLE - TAKE DOWN DTO REQUEST]
 * Bản ghi bất biến đóng gói thông tin yêu cầu gỡ bỏ khẩn cấp một bài hát vi phạm bản quyền / chính sách.
 * Bắt buộc phải có lý do gỡ bài (takedownReason) để thông báo giải trình cho Creator.
 * ===================================================================================================
 */
public record TakeDownTrackRequest(
        @NotBlank(message = "Takedown reason is required")
        @Size(max = 1000, message = "Takedown reason must not exceed 1000 characters")
        String takedownReason,

        @Size(max = 2000, message = "Reviewer note must not exceed 2000 characters")
        String reviewerNote
) {}
