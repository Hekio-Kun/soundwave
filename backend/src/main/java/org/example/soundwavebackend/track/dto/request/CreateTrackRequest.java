package org.example.soundwavebackend.track.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * ===================================================================================================
 * [UPLOAD TRACK - DTO REQUEST PATTERN]
 * Bản ghi bất biến (Immutable Record / DTO) chứa dữ liệu đầu vào khi người dùng thực hiện
 * chức năng "Upload Track" để tạo bản nháp bài hát mới.
 *
 * <h3>Các nguyên lý hướng đối tượng:</h3>
 * <ul>
 *   <li><b>Encapsulation & Immutability:</b> Sử dụng Java Record để đảm bảo tính bất biến của dữ liệu chuyển giao,
 *       ngăn chặn việc thay đổi dữ liệu sau khi request đã được khởi tạo.</li>
 *   <li><b>Bean Validation (JSR-380):</b> Tự bảo vệ tính hợp lệ của dữ liệu (Data Invariants) thông qua các
 *       annotation ràng buộc trước khi chuyển giao cho tầng Service.</li>
 * </ul>
 * ===================================================================================================
 */
public record CreateTrackRequest(
        @NotBlank(message = "Track title is required.")
        @Size(max = 200, message = "Track title cannot exceed 200 characters.")
        String title,

        @NotNull(message = "Genre ID is required.")
        Long genreId,

        Long albumId,

        @Positive(message = "Track number must be greater than zero.")
        Short trackNumber,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters.")
        String description,

        @Positive(message = "Audio duration must be greater than zero.")
        Integer durationMs,

        String lyrics
) {}
