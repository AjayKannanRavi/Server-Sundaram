package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "invoice_items")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private PurchaseInvoice purchaseInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raw_material_id")
    private RawMaterial rawMaterial;

    private Double quantity;

    @Column(name = "unit_price")
    private Double unitPrice;

    @Column(name = "total_price")
    private Double totalPrice;

    @PrePersist
    protected void onCreate() {
        // Set tenant_id from purchase_invoice if not already set
        if (tenantId == null && purchaseInvoice != null) {
            tenantId = purchaseInvoice.getTenantId();
        } else if (tenantId == null && rawMaterial != null) {
            tenantId = rawMaterial.getTenantId();
        }
    }
}
