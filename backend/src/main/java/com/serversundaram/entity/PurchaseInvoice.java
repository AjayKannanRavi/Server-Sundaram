package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "purchase_invoices")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class PurchaseInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    private LocalDateTime date;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "tax_amount")
    private Double taxAmount;

    // PENDING, REVIEWED, REJECTED
    private String status;

    // UNPAID, PARTIAL, PAID
    @Column(name = "paid_status")
    private String paidStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
    
    @OneToMany(mappedBy = "purchaseInvoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InvoiceItem> invoiceItems;

    @PrePersist
    protected void onCreate() {
        // Set tenant_id from restaurant_id if not already set
        if (tenantId == null && restaurant != null) {
            tenantId = restaurant.getId();
        }
    }
}
