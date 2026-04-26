package com.serversundaram.config;

import com.serversundaram.common.ApiResponse;
import com.serversundaram.exception.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.ArrayList;
import java.util.List;

/**
 * Global exception handler for all REST endpoints.
 * Ensures consistent error responses across the application.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    /**
     * Handle tenant context missing exceptions.
     * Returns 401 Unauthorized.
     */
    @ExceptionHandler(TenantContextMissingException.class)
    public ResponseEntity<ApiResponse<?>> handleTenantContextMissing(
            TenantContextMissingException ex,
            WebRequest request) {
        log.warn("Tenant context missing: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.unauthorized(ex.getMessage());
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Handle tenant access denied exceptions.
     * Returns 403 Forbidden.
     */
    @ExceptionHandler(TenantAccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleTenantAccessDenied(
            TenantAccessDeniedException ex,
            WebRequest request) {
        log.warn("Tenant access denied: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.forbidden(ex.getMessage());
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle resource not found exceptions.
     * Returns 404 Not Found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {
        log.info("Resource not found: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.notFound(ex.getMessage());
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle validation exceptions.
     * Returns 400 Bad Request with validation details.
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            ValidationException ex,
            WebRequest request) {
        log.warn("Validation error: {}", ex.getMessage());
        
        List<ApiResponse.ErrorDetail> errors = new ArrayList<>();
        if (ex.getDetails() instanceof List<?> details) {
            errors.addAll((List<ApiResponse.ErrorDetail>) details);
        }
        
        ApiResponse<?> response = ApiResponse.error("Validation failed", errors);
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle duplicate resource exceptions.
     * Returns 409 Conflict.
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateResource(
            DuplicateResourceException ex,
            WebRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.error(409, ex.getMessage(), null);
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle authentication exceptions.
     * Returns 401 Unauthorized.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(
            AuthenticationException ex,
            WebRequest request) {
        log.warn("Authentication error: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.unauthorized(ex.getMessage());
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Handle business logic exceptions.
     * Returns 422 Unprocessable Entity.
     */
    @ExceptionHandler(BusinessLogicException.class)
    public ResponseEntity<ApiResponse<?>> handleBusinessLogicException(
            BusinessLogicException ex,
            WebRequest request) {
        log.warn("Business logic error: {}", ex.getMessage());
        
        ApiResponse<?> response = ApiResponse.error(422, ex.getMessage(), null);
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(422).body(response);
    }

    /**
     * Handle MethodArgumentNotValidException from Spring Validation.
     * Returns 400 Bad Request with field-level errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        log.warn("Method argument validation failed");
        
        List<ApiResponse.ErrorDetail> errors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.add(new ApiResponse.ErrorDetail(fieldName, errorMessage));
        });
        
        ApiResponse<?> response = ApiResponse.error("Validation failed", errors);
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle all other exceptions.
     * Returns 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(
            Exception ex,
            WebRequest request) {
        log.error("Unexpected error occurred", ex);
        
        ApiResponse<?> response = ApiResponse.error(
                500,
                "An unexpected error occurred. Please try again later.",
                null
        );
        response.setPath(request.getDescription(false).replace("uri=", ""));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
