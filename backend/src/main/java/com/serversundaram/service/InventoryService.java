package com.serversundaram.service;

import com.serversundaram.entity.DailyUsageLog;
import com.serversundaram.entity.OrderItem;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.entity.RecipeItem;
import com.serversundaram.entity.RestaurantOrder;
import com.serversundaram.repository.DailyUsageLogRepository;
import com.serversundaram.repository.RawMaterialRepository;
import com.serversundaram.repository.RecipeItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final RecipeItemRepository recipeItemRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final DailyUsageLogRepository dailyUsageLogRepository;

    @Transactional
    public void deductStockForOrder(RestaurantOrder order) {
        log.info("Deducting stock for Order #{}", order.getId());
        for (OrderItem item : order.getItems()) {
            if (item.getMenuItem() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                continue;
            }

            List<RecipeItem> recipeItems = recipeItemRepository.findByMenuItemId(item.getMenuItem().getId());
            for (RecipeItem recipe : recipeItems) {
                RawMaterial material = recipe.getRawMaterial();
                if (material == null || recipe.getQuantityRequired() == null || recipe.getQuantityRequired() <= 0) {
                    log.warn("Skipping invalid recipe link for menu item {} in Order #{}", item.getMenuItem().getId(), order.getId());
                    continue;
                }

                double quantityToDeduct = recipe.getQuantityRequired() * item.getQuantity();
                double currentQty = material.getQuantity() != null ? material.getQuantity() : 0.0;

                log.debug("Deducting {} {} of {} for Order #{}", quantityToDeduct, material.getUnit(), material.getName(), order.getId());
                
                material.setQuantity(Math.max(0.0, currentQty - quantityToDeduct));
                rawMaterialRepository.save(material);

                // Create usage log
                DailyUsageLog usageLog = new DailyUsageLog();
                usageLog.setMaterialName(material.getName() != null ? material.getName() : "Unknown Material");
                usageLog.setUsedQuantity(quantityToDeduct);
                usageLog.setRemainingQuantity(material.getQuantity());
                usageLog.setUnit(material.getUnit() != null ? material.getUnit() : "unit");
                usageLog.setRestaurant(order.getRestaurant());
                dailyUsageLogRepository.save(usageLog);
            }
        }
    }
}
