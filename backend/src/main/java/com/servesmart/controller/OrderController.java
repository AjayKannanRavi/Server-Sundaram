package com.servesmart.controller;

import com.servesmart.dto.OrderItemRequest;
import com.servesmart.dto.OrderRequest;
import com.servesmart.dto.PaymentRequest;
import com.servesmart.dto.RejectRequest;
import com.servesmart.entity.RestaurantOrder;
import com.servesmart.entity.OrderStatus;
import com.servesmart.entity.PaymentStatus;
import com.servesmart.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<RestaurantOrder> updatePayment(@PathVariable Long id, @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(orderService.updatePaymentStatus(id, PaymentStatus.valueOf(request.getStatus()), request.getPaymentMethod()));
    }

    @GetMapping("/session")
    public ResponseEntity<List<RestaurantOrder>> getSessionOrders(@RequestParam Long tableId) {
        return ResponseEntity.ok(orderService.getSessionOrders(tableId));
    }
}
