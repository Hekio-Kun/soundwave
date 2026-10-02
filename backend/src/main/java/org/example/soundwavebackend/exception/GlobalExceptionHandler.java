package org.example.soundwavebackend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.example.soundwavebackend.authentication.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    @ExceptionHandler(EmailAlreadyExistsException.class)
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

    @ExceptionHandler({InvalidOtpException.class, AccountUnavailableException.class})
    public ResponseEntity<ApiErrorResponse> handleBadRequest(AuthenticationException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(org.example.soundwavebackend.moderation.exception.SubmissionNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleSubmissionNotFound(org.example.soundwavebackend.moderation.exception.SubmissionNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "SUBMISSION_NOT_FOUND", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(org.example.soundwavebackend.moderation.exception.InvalidSubmissionStateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSubmissionState(org.example.soundwavebackend.moderation.exception.InvalidSubmissionStateException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_SUBMISSION_STATE", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access is denied.", request, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message,
                                                    HttpServletRequest request, Map<String, String> fieldErrors) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(), status.value(), code, message, request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
