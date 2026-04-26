package com.serversundaram.repository;

import com.serversundaram.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {
    @Query("SELECT r FROM RecipeItem r WHERE r.menuItem.id = :menuItemId AND r.tenantId = :tenantId")
    List<RecipeItem> findByMenuItemIdAndTenantId(Long menuItemId, Long tenantId);
    
    List<RecipeItem> findByMenuItemId(Long menuItemId);
    
    @Query("SELECT r FROM RecipeItem r WHERE r.tenantId = :tenantId")
    List<RecipeItem> findByTenantId(Long tenantId);
    
    @Query("SELECT r FROM RecipeItem r WHERE r.tenantId = :restaurantId")
    List<RecipeItem> findByRestaurantId(Long restaurantId);
    
    @Query("DELETE FROM RecipeItem r WHERE r.menuItem.id = :menuItemId")
    void deleteByMenuItemId(Long menuItemId);
}
