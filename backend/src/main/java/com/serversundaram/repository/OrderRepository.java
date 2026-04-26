package com.serversundaram.repository;

import com.serversundaram.entity.RestaurantOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<RestaurantOrder, Long> {
    @Query("SELECT o FROM RestaurantOrder o WHERE o.restaurantTable.id = :tableId AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    List<RestaurantOrder> findByRestaurantTableId(@Param("tableId") Long tableId, @Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.restaurantTable.id = :tableId AND o.isActive = true AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    Optional<RestaurantOrder> findByRestaurantTableIdAndIsActiveTrue(@Param("tableId") Long tableId, @Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.sessionId = :sessionId AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    List<RestaurantOrder> findBySessionId(@Param("sessionId") String sessionId, @Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId")
    List<RestaurantOrder> findAllByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.isActive = :isActive AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    List<RestaurantOrder> findAllByIsActiveAndRestaurantId(@Param("isActive") boolean isActive, @Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.sessionId = :sessionId AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    List<RestaurantOrder> findAllBySessionIdAndRestaurantId(@Param("sessionId") String sessionId, @Param("restaurantId") Long restaurantId);

    @Query("SELECT o FROM RestaurantOrder o WHERE o.restaurantTable.tableNumber = :tableNumber AND o.isActive = :isActive AND (o.tenantId = :restaurantId OR o.restaurant.id = :restaurantId)")
    List<RestaurantOrder> findAllByTableAndIsActiveAndRestaurantId(@Param("tableNumber") Integer tableNumber, @Param("isActive") boolean isActive, @Param("restaurantId") Long restaurantId);

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0.0) FROM restaurant_orders WHERE payment_status = 'PAID' AND created_at >= :since AND tenant_id = :restaurantId", nativeQuery = true)
    Double getTotalRevenueSince(LocalDateTime since, Long restaurantId);

    @Query(value = "SELECT COUNT(*) FROM restaurant_orders WHERE payment_status = 'PAID' AND created_at >= :since AND tenant_id = :restaurantId", nativeQuery = true)
    Long getTotalOrdersSince(LocalDateTime since, Long restaurantId);

    @Query(value = "SELECT DATE(created_at), SUM(total_amount) " +
           "FROM restaurant_orders WHERE payment_status = 'PAID' AND tenant_id = :restaurantId " +
           "GROUP BY DATE(created_at) " +
           "ORDER BY DATE(created_at) ASC", nativeQuery = true)
    List<Object[]> getDailyRevenueTrend(Long restaurantId);

    @Query("SELECT o.status, COUNT(o) FROM RestaurantOrder o WHERE o.tenantId = :restaurantId GROUP BY o.status")
    List<Object[]> getOrderStatusCounts(Long restaurantId);

    @Query(value = "SELECT HOUR(created_at) as hr, COUNT(*) as cnt FROM restaurant_orders WHERE tenant_id = :restaurantId GROUP BY hr ORDER BY hr", nativeQuery = true)
    List<Object[]> getOrdersByHour(Long restaurantId);

    @Query("SELECT AVG(o.totalAmount) FROM RestaurantOrder o WHERE o.paymentStatus = com.serversundaram.entity.PaymentStatus.PAID AND o.tenantId = :restaurantId")
    Double getAverageOrderValue(Long restaurantId);

    @Query("SELECT SUM(o.totalAmount) FROM RestaurantOrder o WHERE o.paymentStatus = com.serversundaram.entity.PaymentStatus.PAID AND o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId")
    Double getTotalRevenueBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT COUNT(o) FROM RestaurantOrder o WHERE o.status != com.serversundaram.entity.OrderStatus.REJECTED AND o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId")
    Long getTotalOrdersBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT CAST(o.createdAt AS date), SUM(o.totalAmount) FROM RestaurantOrder o WHERE o.paymentStatus = com.serversundaram.entity.PaymentStatus.PAID AND o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date) ASC")
    List<Object[]> getDailyRevenueTrendBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT o.status, COUNT(o) FROM RestaurantOrder o WHERE o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId GROUP BY o.status")
    List<Object[]> getOrderStatusCountsBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT HOUR(o.createdAt), COUNT(o) FROM RestaurantOrder o WHERE o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId GROUP BY HOUR(o.createdAt) ORDER BY HOUR(o.createdAt)")
    List<Object[]> getOrdersByHourBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);

    @Query("SELECT AVG(o.totalAmount) FROM RestaurantOrder o WHERE o.paymentStatus = com.serversundaram.entity.PaymentStatus.PAID AND o.createdAt BETWEEN :start AND :end AND o.tenantId = :restaurantId")
    Double getAverageOrderValueBetween(LocalDateTime start, LocalDateTime end, Long restaurantId);
}
