package com.serversundaram.exception;

/**
 * Thrown when tenant context is missing from request.
 * Indicates JWT token doesn't contain tenantId or TenantContext not set.
 */
public class TenantContextMissingException extends ServiceException {
    public TenantContextMissingException() {
        super("Tenant context is missing. Please ensure JWT token is valid and contains tenantId.");
    }
    
    public TenantContextMissingException(String message) {
        super(message);
    }
}
