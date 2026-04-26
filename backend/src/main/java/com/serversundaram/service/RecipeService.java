package com.serversundaram.service;

import com.serversundaram.config.TenantContext;
import com.serversundaram.entity.MenuItem;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.entity.RecipeItem;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.repository.MenuItemRepository;
import com.serversundaram.repository.RawMaterialRepository;
import com.serversundaram.repository.RecipeItemRepository;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeItemRepository recipeItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final RestaurantRepository restaurantRepository;

    public List<RecipeItem> getRecipeForMenuItem(Long menuItemId) {
        return recipeItemRepository.findByMenuItemId(menuItemId);
    }

    @Transactional
    public List<RecipeItem> saveRecipe(Long menuItemId, List<RecipeItem> items) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        Long safeMenuItemId = Objects.requireNonNull(menuItemId);
        Restaurant restaurant = restaurantRepository.findById(safeRestaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant context not found"));
        MenuItem menuItem = menuItemRepository.findById(safeMenuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // Clear existing recipe items for this menu item
        recipeItemRepository.deleteByMenuItemId(safeMenuItemId);

        // Save new recipe items
        for (RecipeItem item : items) {
            Long rawMaterialId = Objects.requireNonNull(item.getRawMaterial()).getId();
            RawMaterial material = rawMaterialRepository.findById(Objects.requireNonNull(rawMaterialId))
                    .orElseThrow(() -> new RuntimeException("Raw material not found: " + item.getRawMaterial().getId()));
            
            item.setMenuItem(menuItem);
            item.setRawMaterial(material);
            item.setRestaurant(restaurant);
            recipeItemRepository.save(item);
        }

        return recipeItemRepository.findByMenuItemId(safeMenuItemId);
    }

    public List<RecipeItem> getAllRecipesForRestaurant() {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        return recipeItemRepository.findByRestaurantId(Objects.requireNonNull(restaurantId));
    }
}
