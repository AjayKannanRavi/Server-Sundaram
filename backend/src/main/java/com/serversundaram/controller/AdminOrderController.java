package com.serversundaram.controller;

import com.serversundaram.entity.RestaurantOrder;
import com.serversundaram.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<RestaurantOrder>> getAdminOrders(
            @RequestParam(value = "tableId", required = false) Long tableId) {
        Long restaurantId = com.serversundaram.config.TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return ResponseEntity.status(403).build();
        }
        if (tableId != null) {
            return ResponseEntity.ok(orderRepository.findByRestaurantTableId(tableId, restaurantId));
        }
        return ResponseEntity.ok(orderRepository.findAllByRestaurantId(restaurantId));
    }
}
