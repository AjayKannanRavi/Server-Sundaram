package com.serversundaram.repository;

import com.serversundaram.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("SELECT r FROM Review r WHERE r.tenantId = :tenantId")
    List<Review> findByTenantId(Long tenantId);
    
    @Query("SELECT r FROM Review r WHERE r.tenantId = :restaurantId")
    List<Review> findByRestaurantId(Long restaurantId);

    @Query("SELECT r FROM Review r WHERE r.sessionId = :sessionId AND r.tenantId = :tenantId")
    Optional<Review> findBySessionIdAndTenantId(String sessionId, Long tenantId);

    @Query("SELECT r FROM Review r WHERE r.sessionId = :sessionId AND (r.tenantId = :restaurantId OR r.restaurant.id = :restaurantId)")
    Optional<Review> findBySessionIdAndRestaurantId(@Param("sessionId") String sessionId, @Param("restaurantId") Long restaurantId);

    @Query("SELECT r FROM Review r WHERE r.sessionId = :sessionId")
    Optional<Review> findBySessionId(String sessionId);

    boolean existsBySessionId(String sessionId);

    @Query("SELECT AVG(cast(r.overallRating as double)) FROM Review r WHERE r.tenantId = :tenantId")
    Double getAverageRatingByTenantId(Long tenantId);

    @Query("SELECT AVG(cast(r.overallRating as double)) FROM Review r WHERE r.tenantId = :restaurantId OR r.restaurant.id = :restaurantId")
    Double getAverageRating(@Param("restaurantId") Long restaurantId);

    @Query("SELECT r.overallRating, COUNT(r) FROM Review r WHERE r.tenantId = :tenantId GROUP BY r.overallRating ORDER BY r.overallRating DESC")
    List<Object[]> getRatingDistributionByTenantId(Long tenantId);

    @Query("SELECT r.overallRating, COUNT(r) FROM Review r WHERE r.tenantId = :restaurantId OR r.restaurant.id = :restaurantId GROUP BY r.overallRating ORDER BY r.overallRating DESC")
    List<Object[]> getRatingDistribution(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.tenantId = :tenantId")
    Long countByTenantId(Long tenantId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.tenantId = :restaurantId OR r.restaurant.id = :restaurantId")
    Long countByRestaurantId(@Param("restaurantId") Long restaurantId);
}
