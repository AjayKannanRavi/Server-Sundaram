package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_transactions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // PAYMENT, REFUND, ADJUSTMENT
    private String type;

    private Double amount;

    private String description;

    private LocalDateTime date;

    // SUPPLIER, UTILITY, TAX, etc.
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @PrePersist
    protected void onCreate() {
        // Set tenant_id from restaurant_id if not already set
        if (tenantId == null && restaurant != null) {
            tenantId = restaurant.getId();
        }
    }
}
