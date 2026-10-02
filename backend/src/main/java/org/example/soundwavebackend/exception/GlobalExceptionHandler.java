package org.example.soundwavebackend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.example.soundwavebackend.authentication.exception.*;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.InvalidTrackAudioException;
import org.example.soundwavebackend.media.exception.InvalidTrackCoverException;
import org.example.soundwavebackend.moderation.exception.InvalidSubmissionStateException;
import org.example.soundwavebackend.moderation.exception.SubmissionNotFoundException;
import org.example.soundwavebackend.track.exception.TrackException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception,
                                                              HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Please review the submitted fields.", request, errors);
    }

    @ExceptionHandler({EmailAlreadyExistsException.class, UsernameAlreadyExistsException.class})
    public ResponseEntity<ApiErrorResponse> handleConflict(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler({InvalidCredentialsException.class, InvalidRefreshTokenException.class})
    public ResponseEntity<ApiErrorResponse> handleUnauthorized(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler({AccountBannedException.class, EmailNotVerifiedException.class})
    public ResponseEntity<ApiErrorResponse> handleForbidden(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(ProfileNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler({InvalidOtpException.class, AccountUnavailableException.class})
    public ResponseEntity<ApiErrorResponse> handleBadRequest(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(InvalidAvatarFileException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAvatar(InvalidAvatarFileException exception,
                                                                 HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_AVATAR_FILE",
                "Avatar must be in JPG/PNG format and under 5MB.", request, Map.of("avatar", "Choose a JPG or PNG image under 5MB."));
    }

    @ExceptionHandler(InvalidTrackAudioException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidTrackAudio(InvalidTrackAudioException exception,
                                                                     HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request,
                Map.of("audio", "Choose a valid MP3, WAV or FLAC file under 30MB."));
    }

    @ExceptionHandler(InvalidTrackCoverException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidTrackCover(InvalidTrackCoverException exception,
                                                                     HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request,
                Map.of("cover", "Choose a valid JPG or PNG image under 5MB."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUploadTooLarge(MaxUploadSizeExceededException exception,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "UPLOAD_TOO_LARGE",
                "The selected files exceed the upload limit.", request,
                Map.of("media", "Audio must be under 30MB and cover artwork under 5MB."));
    }

    @ExceptionHandler(TrackException.class)
    public ResponseEntity<ApiErrorResponse> handleTrackException(TrackException exception,
                                                                  HttpServletRequest request) {
        return build(exception.getStatus(), exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(CloudStorageUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleCloudStorage(CloudStorageUnavailableException exception,
                                                                HttpServletRequest request) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(SubmissionNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleSubmissionNotFound(SubmissionNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "SUBMISSION_NOT_FOUND", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(InvalidSubmissionStateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSubmissionState(InvalidSubmissionStateException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_SUBMISSION_STATE", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access is denied.", request, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message,
                                                    HttpServletRequest request, Map<String, String> fieldErrors) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(), status.value(), code, message, request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
