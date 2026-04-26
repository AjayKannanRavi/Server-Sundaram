package com.serversundaram.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "restaurant_tables", // using restaurant_tables to avoid 'tables' keyword conflict
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_table_number_per_restaurant", columnNames = {"restaurant_id", "table_number"})
    }
)
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RestaurantTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_number", nullable = false)
    private Integer tableNumber;

    @Column(name = "qr_code_url")
    private String qrCodeUrl;

    @Column(name = "current_session_id", nullable = true)
    private String currentSessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnore
    private Restaurant restaurant;

    @Column(nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED

    @Column(name = "qr_generated", nullable = false)
    private Boolean qrGenerated = false;

    @PrePersist
    protected void onCreate() {
    }

    @JsonProperty("restaurantId")
    public Long getRestaurantId() {
        return restaurant != null ? restaurant.getId() : null;
    }

}
