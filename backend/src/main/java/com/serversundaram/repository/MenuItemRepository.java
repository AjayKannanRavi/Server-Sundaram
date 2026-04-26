package com.serversundaram.repository;

import com.serversundaram.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    @Query("SELECT m FROM MenuItem m WHERE m.tenantId = :restaurantId")
    List<MenuItem> findByRestaurantId(Long restaurantId);

    @Query("SELECT m FROM MenuItem m WHERE m.category.id = :categoryId AND m.tenantId = :restaurantId")
    List<MenuItem> findByCategoryIdAndRestaurantId(Long categoryId, Long restaurantId);

    @Query("SELECT COUNT(m) FROM MenuItem m WHERE m.category.id = :categoryId AND m.tenantId = :restaurantId")
    long countByCategoryIdAndRestaurantId(Long categoryId, Long restaurantId);
}
