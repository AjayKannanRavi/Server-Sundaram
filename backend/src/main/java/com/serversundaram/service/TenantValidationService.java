package com.serversundaram.service;

import com.serversundaram.config.TenantContext;
import com.serversundaram.exception.ResourceNotFoundException;
import com.serversundaram.exception.TenantAccessDeniedException;
import com.serversundaram.exception.TenantContextMissingException;
import org.springframework.stereotype.Service;

/**
 * Service for validating tenant context and access.
 * Ensures tenant isolation is maintained throughout request processing.
 */
@Service
public class TenantValidationService {

    /**
     * Validate that tenant context is present.
     * Called at the beginning of every service operation.
     *
     * @throws TenantContextMissingException if tenant context is not set
     */
    public void validateTenantContext() {
        Long tenantId = TenantContext.getCurrentTenantAsLong();
        if (tenantId == null) {
            throw new TenantContextMissingException();
        }
    }

    /**
     * Validate that tenant context is present.
     *
     * @param tenantId the tenant ID to validate
     * @throws TenantContextMissingException if tenant ID is null
     */
    public void validateTenantContext(Long tenantId) {
        if (tenantId == null) {
            throw new TenantContextMissingException();
        }
    }

    /**
     * Validate that the requested tenant ID matches the current tenant context.
     * Prevents cross-tenant access.
     *
     * @param requestedTenantId the tenant ID from request/entity
     * @throws TenantAccessDeniedException if tenant IDs don't match
     * @throws TenantContextMissingException if current tenant context is missing
     */
    public void validateTenantAccess(Long requestedTenantId) {
        Long currentTenantId = TenantContext.getCurrentTenantAsLong();
        validateTenantContext(currentTenantId);

        if (!currentTenantId.equals(requestedTenantId)) {
            throw new TenantAccessDeniedException("Tenant mismatch");
        }
    }

    /**
     * Validate that current tenant exists and is active.
     * (Implementation depends on your tenant persistence layer)
     */
    public void validateTenantIsActive() {
        Long tenantId = TenantContext.getCurrentTenantAsLong();
        validateTenantContext(tenantId);
        
        // Example: Check if tenant is active in your tenant registry
        // if (tenantRegistry.findById(tenantId).isEmpty()) {
        //     throw new TenantContextMissingException();
        // }
    }

    /**
     * Get current tenant ID with validation.
     *
     * @return current tenant ID
     * @throws TenantContextMissingException if tenant context is not set
     */
    public Long getCurrentTenantId() {
        Long tenantId = TenantContext.getCurrentTenantAsLong();
        validateTenantContext(tenantId);
        return tenantId;
    }

    /**
     * Verify that a resource with given ID belongs to current tenant.
     * Throws 404 (not 403) to prevent tenant enumeration attacks.
     *
     * @param tenantId the tenant ID from the resource
     * @param resourceType the type of resource (for error message)
     * @throws ResourceNotFoundException if tenant doesn't match
     */
    public void verifyResourceOwnership(Long tenantId, String resourceType) {
        if (!getCurrentTenantId().equals(tenantId)) {
            throw new ResourceNotFoundException(resourceType + " not found");
        }
    }

    /**
     * Verify that a resource with given ID belongs to current tenant.
     *
     * @param tenantId the tenant ID from the resource
     * @throws TenantAccessDeniedException if tenant doesn't match
     */
    public void requireTenantMatch(Long tenantId) {
        validateTenantAccess(tenantId);
    }
}
