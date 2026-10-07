package org.example.soundwavebackend.catalog.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO nhận thông tin lượt nghe từ trình phát phía client.
 */
public record RecordPlayRequest(
        @NotNull(message = "Thời lượng đã nghe không được để trống")
        @Min(value = 0, message = "Thời lượng đã nghe không thể là số âm")
        Integer listenedDurationMs,

        Boolean completed
) {}
