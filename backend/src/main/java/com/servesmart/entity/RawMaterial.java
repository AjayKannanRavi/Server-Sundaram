package com.servesmart.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "raw_materials")
@Data
public class RawMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double quantity = 0.0;

    @Column(nullable = false)
    private String unit; // kg, liters, pieces, etc.

    @Column(name = "min_threshold")
    private Double minThreshold;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
}
