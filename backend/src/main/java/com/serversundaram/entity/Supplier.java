package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "suppliers")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String name;

    private String contactPerson;

    private String phone;

    private String email;

    @Column(name = "bank_details")
    private String bankDetails;

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
