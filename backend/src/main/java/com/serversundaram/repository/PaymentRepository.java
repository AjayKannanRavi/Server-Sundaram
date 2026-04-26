package com.serversundaram.repository;

import com.serversundaram.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @Query("SELECT p FROM Payment p WHERE (:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId)")
    List<Payment> findByRestaurantId(Long restaurantId);

    @Query("SELECT p FROM Payment p WHERE p.paymentDate >= :since AND ((:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId))")
    List<Payment> findByCreatedAtAfterAndRestaurantId(LocalDateTime since, Long restaurantId);

    @Query("SELECT SUM(p.totalAmount) FROM Payment p WHERE p.paymentDate >= :since AND ((:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId))")
    Double getTotalRevenueSince(LocalDateTime since, Long restaurantId);

    @Query("SELECT SUM(p.totalAmount) FROM Payment p")
    Double getTotalPlatformRevenue();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentDate >= :since AND ((:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId))")
    Long getTotalOrdersSince(LocalDateTime since, Long restaurantId);

    @Query("SELECT CAST(p.paymentDate AS date), SUM(p.totalAmount) " +
           "FROM Payment p WHERE (:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId) " +
           "GROUP BY CAST(p.paymentDate AS date) " +
           "ORDER BY CAST(p.paymentDate AS date) ASC")
    List<Object[]> getDailyRevenueTrend(Long restaurantId);

    @Query("SELECT p.paymentMethod, SUM(p.totalAmount), COUNT(p) FROM Payment p WHERE p.paymentDate BETWEEN :start AND :end AND ((:restaurantId IS NULL AND p.restaurant IS NULL) OR (p.restaurant.id = :restaurantId)) GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodsBreakdownBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);
}
