package com.servesmart.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "restaurant_tables") // using restaurant_tables to avoid 'tables' keyword conflict
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

    @Column(name = "current_session_id")
    private String currentSessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED

    @Column(name = "qr_generated", nullable = false)
    private Boolean qrGenerated = false;

}
