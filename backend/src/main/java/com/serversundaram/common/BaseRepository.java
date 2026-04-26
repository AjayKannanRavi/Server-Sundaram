package com.serversundaram.common;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Base repository interface for all multi-tenant entities.
 * All repository methods ensure tenant isolation.
 *
 * @param <T> Entity type
 * @param <ID> Primary key type
 */
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    /**
     * Find all entities for a specific tenant.
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId")
    List<T> findAllByTenantId(@Param("tenantId") Long tenantId);

    /**
     * Find an entity by ID and tenant ID (ensures tenant isolation).
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = :id AND e.tenantId = :tenantId")
    Optional<T> findByIdAndTenantId(@Param("id") ID id, @Param("tenantId") Long tenantId);

    /**
     * Check if an entity exists for a specific tenant.
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM #{#entityName} e WHERE e.id = :id AND e.tenantId = :tenantId")
    boolean existsByIdAndTenantId(@Param("id") ID id, @Param("tenantId") Long tenantId);

    /**
     * Count total entities for a tenant.
     */
    @Query("SELECT COUNT(e) FROM #{#entityName} e WHERE e.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") Long tenantId);
}
