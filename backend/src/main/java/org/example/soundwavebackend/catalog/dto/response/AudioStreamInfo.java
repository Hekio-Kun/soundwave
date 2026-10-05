package org.example.soundwavebackend.catalog.dto.response;

import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * DTO chứa thông tin phân đoạn âm thanh phục vụ HTTP 206 Partial Content / Streaming.
 */
public record AudioStreamInfo(
        int statusCode,
        String contentType,
        String contentRange,
        Long contentLength,
        StreamingResponseBody body
) {}
