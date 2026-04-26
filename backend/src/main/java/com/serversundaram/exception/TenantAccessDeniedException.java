package com.serversundaram.exception;

/**
 * Thrown when user tries to access another tenant's resource.
 * Tenant isolation violation detected.
 */
public class TenantAccessDeniedException extends ServiceException {
    public TenantAccessDeniedException(String message) {
        super("Access denied: " + message);
    }

    public TenantAccessDeniedException() {
        super("You don't have permission to access this resource.");
    }
}
