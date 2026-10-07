package org.example.soundwavebackend.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.authentication.exception.AccountBannedException;
import org.example.soundwavebackend.authentication.exception.AccountUnavailableException;
import org.example.soundwavebackend.authentication.exception.AuthenticationException;
import org.example.soundwavebackend.authentication.exception.EmailAlreadyExistsException;
import org.example.soundwavebackend.authentication.exception.EmailNotVerifiedException;
import org.example.soundwavebackend.authentication.exception.InvalidCredentialsException;
import org.example.soundwavebackend.authentication.exception.InvalidOtpException;
import org.example.soundwavebackend.authentication.exception.InvalidRefreshTokenException;
import org.example.soundwavebackend.authentication.exception.ProfileNotFoundException;
import org.example.soundwavebackend.authentication.exception.UsernameAlreadyExistsException;
import org.example.soundwavebackend.media.exception.InvalidAvatarFileException;
import org.example.soundwavebackend.media.exception.CloudStorageUnavailableException;
import org.example.soundwavebackend.media.exception.MediaException;
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
@Slf4j
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
        HttpStatus status = "REGISTRATION_RATE_LIMITED".equals(exception.getCode())
                ? HttpStatus.TOO_MANY_REQUESTS
                : HttpStatus.BAD_REQUEST;
        return build(status, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiErrorResponse> handleForbiddenOperation(ForbiddenOperationException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(ConflictOperationException.class)
    public ResponseEntity<ApiErrorResponse> handleConflictOperation(ConflictOperationException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(BadRequestOperationException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequestOperation(BadRequestOperationException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                "File size exceeds maximum allowed upload limit (30MB)", request, Map.of());
    }

    @ExceptionHandler({InvalidTrackAudioException.class, InvalidTrackCoverException.class, InvalidAvatarFileException.class})
    public ResponseEntity<ApiErrorResponse> handleInvalidMediaFile(
            MediaException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(CloudStorageUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleCloudStorageUnavailable(
            CloudStorageUnavailableException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(TrackException.class)
    public ResponseEntity<ApiErrorResponse> handleTrackException(
            TrackException exception,
            HttpServletRequest request
    ) {
        return build(exception.getStatus(), exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(SubmissionNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleSubmissionNotFound(
            SubmissionNotFoundException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "SUBMISSION_NOT_FOUND", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(InvalidSubmissionStateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSubmissionState(
            InvalidSubmissionStateException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.CONFLICT, "INVALID_SUBMISSION_STATE", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission to perform this action.",
                request, Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error("Unhandled exception while processing {} {}", request.getMethod(), request.getRequestURI(), exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please try again later.", request, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message,
                                                    HttpServletRequest request, Map<String, String> fieldErrors) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(), status.value(), code, message, request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
