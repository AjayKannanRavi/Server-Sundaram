package com.serversundaram.common;

import java.util.List;
import java.util.Optional;

/**
 * Base service interface for all business logic operations.
 * Ensures consistent CRUD operations with tenant isolation.
 *
 * @param <T> Entity type
 * @param <ID> Primary key type
 * @param <CreateRequest> Request DTO for creation
 * @param <UpdateRequest> Request DTO for updates
 * @param <Response> Response DTO
 */
public interface BaseService<T, ID, CreateRequest, UpdateRequest, Response> {

    /**
     * Create a new entity for the current tenant.
     */
    Response create(CreateRequest request);

    /**
     * Update an existing entity for the current tenant.
     */
    Response update(ID id, UpdateRequest request);

    /**
     * Retrieve an entity by ID for the current tenant.
     */
    Optional<Response> getById(ID id);

    /**
     * Retrieve all entities for the current tenant.
     */
    List<Response> getAll();

    /**
     * Delete an entity by ID for the current tenant.
     */
    void delete(ID id);

    /**
     * Check if entity exists for the current tenant.
     */
    boolean exists(ID id);

    /**
     * Get total count for the current tenant.
     */
    long count();
}
