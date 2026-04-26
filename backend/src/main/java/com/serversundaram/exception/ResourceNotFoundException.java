package com.serversundaram.exception;

/**
 * Thrown when a requested resource is not found.
 * Important: Returns 404, not 403, to prevent tenant enumeration.
 */
public class ResourceNotFoundException extends ServiceException {
    public ResourceNotFoundException(String resourceType, Object id) {
        super(resourceType + " not found: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
