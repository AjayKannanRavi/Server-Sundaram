package com.serversundaram.repository;

import com.serversundaram.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    @Query("SELECT s FROM Supplier s WHERE s.tenantId = :tenantId")
    List<Supplier> findByTenantId(Long tenantId);
    
    @Query("SELECT s FROM Supplier s WHERE s.tenantId = :restaurantId")
    List<Supplier> findByRestaurantId(Long restaurantId);
    
    @Query("SELECT s FROM Supplier s WHERE s.name = :name AND s.tenantId = :tenantId")
    Optional<Supplier> findByNameAndTenantId(String name, Long tenantId);
    
    @Query("SELECT s FROM Supplier s WHERE s.email = :email AND s.tenantId = :tenantId")
    Optional<Supplier> findByEmailAndTenantId(String email, Long tenantId);
    
    @Query("SELECT s FROM Supplier s WHERE s.tenantId = :tenantId AND s.phone = :phone")
    Optional<Supplier> findByPhoneAndTenantId(String phone, Long tenantId);
    
    void deleteAllByTenantId(Long tenantId);
}