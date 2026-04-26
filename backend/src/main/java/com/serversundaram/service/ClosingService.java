package com.serversundaram.service;

import com.serversundaram.dto.DailyUsageRequest;
import com.serversundaram.dto.UsageEntry;
import com.serversundaram.entity.DailyUsageLog;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.repository.DailyUsageLogRepository;
import com.serversundaram.repository.RawMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClosingService {

    private final RawMaterialRepository rawMaterialRepository;
    private final DailyUsageLogRepository dailyUsageLogRepository;
    private final com.serversundaram.repository.RestaurantRepository restaurantRepository;

    @Transactional
    public List<DailyUsageLog> performDayClosing(DailyUsageRequest request) {
        Long restaurantId = com.serversundaram.config.TenantContext.getCurrentTenantAsLong();
        com.serversundaram.entity.Restaurant restaurant = null;
        if (restaurantId != null) {
            restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        }

        List<DailyUsageLog> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (UsageEntry entry : request.getUsages()) {
            if (entry.getUsedQuantity() == null || entry.getUsedQuantity() <= 0) continue;

            Long materialId = entry.getMaterialId();
            if (materialId == null) {
                continue;
            }

            RawMaterial material = rawMaterialRepository.findById(materialId).orElse(null);
            if (material != null) {
                // Verify ownership
                if (restaurantId != null && !material.getRestaurant().getId().equals(restaurantId)) {
                    continue; // Skip items that don't belong to the tenant
                }

                double remaining = material.getQuantity() - entry.getUsedQuantity();
                material.setQuantity(Math.max(0, remaining));
                rawMaterialRepository.save(material);

                DailyUsageLog log = new DailyUsageLog();
                log.setDate(now);
                log.setMaterialName(material.getName());
                log.setUsedQuantity(entry.getUsedQuantity());
                log.setRemainingQuantity(material.getQuantity());
                log.setUnit(material.getUnit());
                log.setRestaurant(restaurant);
                
                logs.add(dailyUsageLogRepository.save(log));
            }
        }
        return logs;
    }
}
