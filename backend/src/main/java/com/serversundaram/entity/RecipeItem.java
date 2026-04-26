package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.Filter;

/**
 * Represents an ingredient and its quantity required for a specific menu item.
 * This is the core of the automated inventory system (Recipe Management).
 */
@Entity
@Table(name = "recipe_items")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecipeItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "raw_material_id", nullable = false)
    private RawMaterial rawMaterial;

    @Column(name = "quantity_required", nullable = false)
    private Double quantityRequired;

    @Column(nullable = false)
    private String unit; // Should match RawMaterial unit

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @PrePersist
    protected void onCreate() {
        // Set tenant_id from menu_item if not already set
        if (tenantId == null && menuItem != null) {
            tenantId = menuItem.getTenantId();
        } else if (tenantId == null && restaurant != null) {
            tenantId = restaurant.getId();
        }
    }
}
