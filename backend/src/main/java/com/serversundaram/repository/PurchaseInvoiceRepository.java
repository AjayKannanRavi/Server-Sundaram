package com.serversundaram.repository;

import com.serversundaram.entity.PurchaseInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Long> {
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.tenantId = :tenantId")
    List<PurchaseInvoice> findByTenantId(Long tenantId);
    
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.tenantId = :restaurantId")
    List<PurchaseInvoice> findByRestaurantId(Long restaurantId);
    
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.invoiceNumber = :invoiceNumber AND p.tenantId = :tenantId")
    Optional<PurchaseInvoice> findByInvoiceNumberAndTenantId(String invoiceNumber, Long tenantId);
    
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.tenantId = :tenantId AND p.status = :status")
    List<PurchaseInvoice> findByStatusAndTenantId(String status, Long tenantId);
    
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.tenantId = :tenantId AND p.paidStatus = :paidStatus")
    List<PurchaseInvoice> findByPaidStatusAndTenantId(String paidStatus, Long tenantId);
    
    @Query("SELECT p FROM PurchaseInvoice p WHERE p.tenantId = :tenantId AND p.date BETWEEN :startDate AND :endDate")
    List<PurchaseInvoice> findByTenantIdAndDateBetween(Long tenantId, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT SUM(p.totalAmount) FROM PurchaseInvoice p WHERE p.tenantId = :tenantId")
    Double getTotalInvoiceAmountByTenantId(Long tenantId);
    
    void deleteAllByTenantId(Long tenantId);
}