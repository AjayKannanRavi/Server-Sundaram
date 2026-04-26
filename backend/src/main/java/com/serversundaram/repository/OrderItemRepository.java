package com.serversundaram.repository;

import com.serversundaram.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
       void deleteByRestaurantOrderId(Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.restaurant.id = :restaurantId")
    List<OrderItem> findByRestaurantId(Long restaurantId);

    @Query("SELECT mi.name, SUM(oi.quantity) as totalQty, SUM(oi.quantity * oi.price) as totalRev " +
           "FROM OrderItem oi JOIN oi.menuItem mi JOIN oi.restaurantOrder o " +
           "WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN :start AND :end AND o.restaurant.id = :restaurantId " +
           "GROUP BY mi.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> getTopDishesBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT c.name, SUM(oi.quantity * oi.price) as totalRev " +
           "FROM OrderItem oi JOIN oi.menuItem mi JOIN mi.category c JOIN oi.restaurantOrder o " +
           "WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN :start AND :end AND o.restaurant.id = :restaurantId " +
           "GROUP BY c.name")
    List<Object[]> getCategoryRevenueBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT mi.name, SUM(oi.quantity) as totalQty, SUM(oi.quantity * oi.price) as totalRev " +
           "FROM OrderItem oi JOIN oi.menuItem mi JOIN oi.restaurantOrder o " +
           "WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN :start AND :end AND o.restaurant.id = :restaurantId " +
           "GROUP BY mi.name " +
           "ORDER BY totalQty ASC")
    List<Object[]> getBottomDishesBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);
}
