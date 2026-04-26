package com.serversundaram.repository;

import com.serversundaram.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
    @Query("SELECT ii FROM InvoiceItem ii WHERE ii.tenantId = :tenantId")
    List<InvoiceItem> findByTenantId(Long tenantId);
    
    @Query("SELECT ii FROM InvoiceItem ii WHERE ii.purchaseInvoice.id = :invoiceId AND ii.tenantId = :tenantId")
    List<InvoiceItem> findByInvoiceIdAndTenantId(Long invoiceId, Long tenantId);
    
    List<InvoiceItem> findByPurchaseInvoiceId(Long invoiceId);
    
    @Query("SELECT ii FROM InvoiceItem ii WHERE ii.rawMaterial.id = :materialId AND ii.tenantId = :tenantId")
    List<InvoiceItem> findByMaterialIdAndTenantId(Long materialId, Long tenantId);
    
    List<InvoiceItem> findByRawMaterialId(Long materialId);
    
    @Query("SELECT SUM(ii.totalPrice) FROM InvoiceItem ii WHERE ii.purchaseInvoice.id = :invoiceId AND ii.tenantId = :tenantId")
    Double getTotalByInvoiceAndTenantId(Long invoiceId, Long tenantId);
    
    void deleteAllByTenantId(Long tenantId);
}