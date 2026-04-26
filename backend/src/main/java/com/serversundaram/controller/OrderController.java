package com.serversundaram.controller;

import com.serversundaram.dto.OrderItemRequest;
import com.serversundaram.dto.OrderRequest;
import com.serversundaram.dto.PaymentRequest;
import com.serversundaram.dto.RejectRequest;
import com.serversundaram.entity.RestaurantOrder;
import com.serversundaram.entity.OrderStatus;
import com.serversundaram.entity.PaymentStatus;
import com.serversundaram.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<RestaurantOrder> createOrder(@RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @PostMapping("/{orderId}/items")
    public ResponseEntity<RestaurantOrder> addItems(@PathVariable Long orderId, @RequestBody List<OrderItemRequest> items) {
        return ResponseEntity.ok(orderService.addItemsToOrder(orderId, items));
    }

    @PutMapping("/{id}/items")
    public ResponseEntity<RestaurantOrder> updateItems(@PathVariable Long id, @RequestBody List<OrderItemRequest> items) {
        return ResponseEntity.ok(orderService.updateOrderItemsByCustomer(id, items));
    }

    @GetMapping
    public ResponseEntity<List<RestaurantOrder>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantOrder> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RestaurantOrder> updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/{id}/status/reject")
    public ResponseEntity<RestaurantOrder> rejectOrder(@PathVariable Long id, @RequestBody RejectRequest request) {
        return ResponseEntity.ok(orderService.rejectOrder(id, request.getReason()));
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<Map<String, Object>> updatePayment(@PathVariable Long id, @RequestBody PaymentRequest request) {
        RestaurantOrder updatedOrder = orderService.updatePaymentStatus(
            id, 
            PaymentStatus.valueOf(request.getStatus()), 
            request.getPaymentMethod(),
            request.getDiscountAmount(),
            request.getTaxPercentage()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Payment updated successfully",
                "orderId", updatedOrder.getId(),
                "sessionId", updatedOrder.getSessionId(),
                "paymentStatus", updatedOrder.getPaymentStatus().toString(),
                "status", updatedOrder.getStatus().toString()
        ));
    }

    @GetMapping("/session")
    public ResponseEntity<List<RestaurantOrder>> getSessionOrders(@RequestParam Long tableId) {
        return ResponseEntity.ok(orderService.getSessionOrders(tableId));
    }
}
