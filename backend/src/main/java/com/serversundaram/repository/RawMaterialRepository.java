package com.serversundaram.repository;

import com.serversundaram.entity.RawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, Long> {
    // Find by tenant_id (Hibernate @Filter will apply automatically)
    @Query("SELECT r FROM RawMaterial r WHERE r.tenantId = :tenantId")
    List<RawMaterial> findByTenantId(Long tenantId);
    
    // Find by restaurant_id for backward compatibility
    @Query("SELECT r FROM RawMaterial r WHERE r.tenantId = :restaurantId")
    List<RawMaterial> findByRestaurantId(Long restaurantId);
    
    // Find by name and tenant
    @Query("SELECT r FROM RawMaterial r WHERE r.name = :name AND r.tenantId = :tenantId")
    Optional<RawMaterial> findByNameAndTenantId(String name, Long tenantId);
    
    // Delete all by tenant
    void deleteAllByTenantId(Long tenantId);
}
