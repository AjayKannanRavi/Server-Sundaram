package com.serversundaram.exception;

/**
 * Thrown when validation fails.
 * Includes details about what failed validation.
 */
public class ValidationException extends ServiceException {
    private Object details;

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, Object details) {
        super(message);
        this.details = details;
    }

    public Object getDetails() {
        return details;
    }
}
