package com.serversundaram.exception;

/**
 * Thrown when trying to create a duplicate resource.
 */
public class DuplicateResourceException extends ServiceException {
    public DuplicateResourceException(String resourceType, String field, Object value) {
        super(resourceType + " with " + field + "=" + value + " already exists.");
    }

    public DuplicateResourceException(String message) {
        super(message);
    }
}
