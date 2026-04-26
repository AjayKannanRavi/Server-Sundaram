package com.serversundaram.service;

import com.serversundaram.entity.*;
import com.serversundaram.repository.PaymentRepository;
import com.serversundaram.repository.RestaurantTableRepository;
import com.serversundaram.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final CustomerService customerService;
    private final InventoryService inventoryService;

    @Transactional
    public Payment processPayment(String sessionId, String paymentMethod, Double discountAmount, Double taxPercentage, Long restaurantId, Restaurant restaurant) {
        log.info("Processing payment for Session: {} at Restaurant: {}", sessionId, restaurantId);

        List<RestaurantOrder> sessionOrders = orderRepository.findAllBySessionIdAndRestaurantId(sessionId, restaurantId);
        if (sessionOrders.isEmpty()) {
            throw new RuntimeException("No orders found for session: " + sessionId);
        }

        double subtotal = 0.0;
        String customerPhone = null;
        double safeDiscountAmount = discountAmount != null ? discountAmount : 0.0;

        for (RestaurantOrder order : sessionOrders) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.COMPLETED);
            order.setPaymentMethod(paymentMethod != null ? paymentMethod.toUpperCase() : "CASH");
            order.setIsActive(false);
            order.setDiscountAmount(safeDiscountAmount > 0 ? safeDiscountAmount / sessionOrders.size() : 0.0); // Simple split
            orderRepository.save(order);
            
            subtotal += order.getTotalAmount();
            if (customerPhone == null) customerPhone = order.getCustomerPhone();

            // Do not fail payment completion if inventory recipe links are incomplete.
            try {
                inventoryService.deductStockForOrder(order);
            } catch (Exception inventoryEx) {
                log.error("Inventory deduction failed for Order #{} in Session {}", order.getId(), sessionId, inventoryEx);
            }
        }

        double finalSubtotal = Math.max(0, subtotal - safeDiscountAmount);
        double taxRate = (taxPercentage != null) ? taxPercentage : (restaurant != null ? restaurant.getTaxPercentageSafe() : 5.0);
        double serviceRate = (restaurant != null) ? restaurant.getServiceChargeSafe() : 0.0;

        double taxAmount = finalSubtotal * (taxRate / 100);
        double serviceCharge = finalSubtotal * (serviceRate / 100);
        double total = finalSubtotal + taxAmount + serviceCharge;

        Payment payment = new Payment();
        payment.setSessionId(sessionId);
        payment.setSubtotal(subtotal);
        payment.setTaxAmount(taxAmount);
        payment.setServiceCharge(serviceCharge);
        payment.setDiscountAmount(safeDiscountAmount);
        payment.setTotalAmount(total);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentMethod(paymentMethod != null ? paymentMethod.toUpperCase() : "CASH");
        payment.setRestaurant(restaurant);
        payment.setTenantId(restaurantId);
        payment.setTaxDetails(String.format("GST %.1f%%", taxRate));
        
        Payment savedPayment = paymentRepository.save(payment);

        // Award Loyalty Points
        if (customerPhone != null && !customerPhone.isEmpty()) {
            customerService.awardPoints(customerPhone, total, restaurantId);
        }

        // Release Table
        RestaurantOrder firstOrder = sessionOrders.get(0);
        RestaurantTable table = firstOrder.getRestaurantTable();
        if (table != null) {
            table.setCurrentSessionId(null);
            table.setStatus("AVAILABLE");
            tableRepository.save(table);
        }

        return savedPayment;
    }
}
