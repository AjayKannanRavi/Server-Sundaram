package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_usage_logs")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class DailyUsageLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(name = "material_name", nullable = false)
    private String materialName;

    @Column(name = "used_quantity", nullable = false)
    private Double usedQuantity;

    @Column(name = "remaining_quantity", nullable = false)
    private Double remainingQuantity;

    @Column(nullable = false)
    private String unit;

    @PrePersist
    protected void onCreate() {
        // Set tenant_id from restaurant_id if not already set
        if (tenantId == null && restaurant != null) {
            tenantId = restaurant.getId();
        }
    }
}
