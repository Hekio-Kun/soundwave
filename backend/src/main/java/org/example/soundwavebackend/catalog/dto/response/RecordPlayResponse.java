package org.example.soundwavebackend.catalog.dto.response;

/**
 * DTO trả về kết quả sau khi ghi nhận lượt nghe thành công.
 */
public record RecordPlayResponse(
        Long trackId,
        long playCount,
        boolean recordedHistory
) {}
