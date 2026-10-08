package org.example.soundwavebackend.exception;

import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidTrackAudioException;
import org.example.soundwavebackend.authentication.exception.AccountUnavailableException;
import org.example.soundwavebackend.track.exception.TrackNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {
    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("POST", "/api/v1/studio/tracks");
    }

    @Test
    void maxUploadSizeExceededReturnsPayloadTooLarge() {
        var response = handler.handleMaxUploadSizeExceeded(new MaxUploadSizeExceededException(30L), request);

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertEquals("FILE_TOO_LARGE", response.getBody().code());
    }

    @Test
    void invalidMediaReturnsBadRequest() {
        var response = handler.handleInvalidMediaFile(new InvalidTrackAudioException(), request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("INVALID_TRACK_AUDIO", response.getBody().code());
    }

    @Test
    void registrationRateLimitReturnsTooManyRequests() {
        var exception = new AccountUnavailableException("REGISTRATION_RATE_LIMITED", "Please wait.");

        var response = handler.handleBadRequest(exception, request);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
    }

    @Test
    void unavailableCloudStorageReturnsServiceUnavailable() {
        var response = handler.handleCloudStorageUnavailable(new CloudStorageUnavailableException(), request);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }

    @Test
    void trackNotFoundUsesExceptionStatus() {
        var response = handler.handleTrackException(new TrackNotFoundException(), request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("TRACK_NOT_FOUND", response.getBody().code());
    }

    @Test
    void unexpectedExceptionReturnsSafeGenericMessage() {
        var response = handler.handleUnexpectedException(new RuntimeException("database password leaked"), request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("An unexpected error occurred. Please try again later.", response.getBody().message());
    }
}
