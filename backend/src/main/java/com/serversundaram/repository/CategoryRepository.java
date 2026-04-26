package com.serversundaram.repository;

import com.serversundaram.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    @Query("SELECT c FROM Category c WHERE c.tenantId = :restaurantId")
    List<Category> findByRestaurantId(Long restaurantId);

    @Query("SELECT c FROM Category c WHERE c.tenantId = :restaurantId AND LOWER(c.name) = LOWER(:name)")
    Category findByRestaurantIdAndNameIgnoreCase(Long restaurantId, String name);
}
