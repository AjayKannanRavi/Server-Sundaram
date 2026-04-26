package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "subtotal", nullable = false)
    private Double subtotal;

    @Column(name = "tax_amount", nullable = false)
    private Double taxAmount;

    @Column(name = "service_charge", nullable = false)
    private Double serviceCharge;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "payment_method")
    private String paymentMethod; // CASH, CARD, ONLINE

    @Column(name = "discount_amount")
    private Double discountAmount = 0.0;

    @Column(name = "tax_details")
    private String taxDetails; // For complex GST breakdowns

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @PrePersist
    protected void onCreate() {
        if (tenantId == null && restaurant != null) {
            tenantId = restaurant.getId();
        }
    }
}
