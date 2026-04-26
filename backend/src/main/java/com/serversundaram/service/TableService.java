package com.serversundaram.service;

import com.serversundaram.config.TenantContext;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.entity.RestaurantTable;
import com.serversundaram.repository.RestaurantRepository;
import com.serversundaram.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TableService {
    private final RestaurantTableRepository tableRepository;
    private final RestaurantRepository restaurantRepository;

    public List<RestaurantTable> getAllTables() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return java.util.Collections.emptyList();
        }
        return tableRepository.findByRestaurantId(restaurantId);
    }
    
    public RestaurantTable addTable(RestaurantTable table) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        
        Restaurant restaurant = restaurantRepository.findById(safeRestaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant not found in tenant database"));
        
        // Auto-assign table number if it conflicts or is not provided
        Integer tableNumber = table.getTableNumber();
        if (tableNumber == null || tableNumber <= 0) {
            // Calculate the next available table number
            List<RestaurantTable> existingTables = tableRepository.findByRestaurantId(safeRestaurantId);
            tableNumber = existingTables.isEmpty() ? 1 : existingTables.stream()
                    .map(RestaurantTable::getTableNumber)
                    .max(Integer::compare)
                    .orElse(0) + 1;
        } else {
            // Check if the provided table number already exists, if so auto-assign next
            if (tableRepository.findByTableNumberAndRestaurantId(tableNumber, safeRestaurantId).isPresent()) {
                List<RestaurantTable> existingTables = tableRepository.findByRestaurantId(safeRestaurantId);
                tableNumber = existingTables.stream()
                        .map(RestaurantTable::getTableNumber)
                        .max(Integer::compare)
                        .orElse(tableNumber) + 1;
            }
        }
        
        // Enforce Subscription Limits
        if ("FREE".equalsIgnoreCase(restaurant.getPlanType())) {
            long currentCount = tableRepository.countByRestaurantId(safeRestaurantId);
            if (currentCount >= 5) {
                throw new RuntimeException("FREE Plan limit reached: Maximum 5 tables allowed. Please upgrade to PREMIUM.");
            }
        }
        
        if (table.getStatus() == null) table.setStatus("AVAILABLE");
        if (table.getQrGenerated() == null) table.setQrGenerated(false);

        // Retry with next table numbers if a concurrent insert or legacy row causes duplicate key collisions.
        int maxAttempts = 6;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                table.setTableNumber(tableNumber);
                table.setRestaurant(restaurant);
                table.setQrCodeUrl("http://localhost:5173/login?hotelId=" + safeRestaurantId + "&tableId=" + tableNumber);
                return tableRepository.save(table);
            } catch (DataIntegrityViolationException ex) {
                String message = ex.getMostSpecificCause() != null
                        ? ex.getMostSpecificCause().getMessage()
                        : ex.getMessage();
                if (message != null && message.contains("uk_table_number_per_restaurant")) {
                    tableNumber = tableNumber + 1;
                    continue;
                }
                throw ex;
            }
        }

        throw new RuntimeException("Could not auto-assign a unique table number. Please retry.");
    }

    public RestaurantTable updateTable(@NonNull Long id, RestaurantTable updated) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        return tableRepository.findById(id).map(t -> {
            if (!t.getRestaurant().getId().equals(safeRestaurantId)) {
                throw new RuntimeException("Unauthorized access to table");
            }
            if (updated.getTableNumber() != null) {
                t.setTableNumber(updated.getTableNumber());
                // Update QR URL if table number changes
                t.setQrCodeUrl("http://localhost:5173/login?hotelId=" + t.getRestaurant().getId() + "&tableId=" + updated.getTableNumber());
            }
            if (updated.getStatus() != null) t.setStatus(updated.getStatus());
            if (updated.getQrGenerated() != null) t.setQrGenerated(updated.getQrGenerated());
            return tableRepository.save(t);
        }).orElseThrow(() -> new RuntimeException("Table not found"));
    }

    public void generateQr(@NonNull Long id) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        Long safeRestaurantId = Objects.requireNonNull(restaurantId);
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        if (!table.getRestaurant().getId().equals(safeRestaurantId)) {
            throw new RuntimeException("Unauthorized access to generate QR for this table");
        }
        
        table.setQrGenerated(true);
        tableRepository.save(table);
    }
}
