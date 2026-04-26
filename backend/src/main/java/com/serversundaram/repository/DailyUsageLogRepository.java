package com.serversundaram.repository;

import com.serversundaram.entity.DailyUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DailyUsageLogRepository extends JpaRepository<DailyUsageLog, Long> {
    @Query("SELECT d FROM DailyUsageLog d WHERE d.tenantId = :tenantId")
    List<DailyUsageLog> findByTenantId(Long tenantId);
    
    @Query("SELECT d FROM DailyUsageLog d WHERE d.tenantId = :restaurantId")
    List<DailyUsageLog> findByRestaurantId(Long restaurantId);

    @Query("SELECT d FROM DailyUsageLog d WHERE d.date BETWEEN :start AND :end AND d.tenantId = :tenantId ORDER BY d.date DESC")
    List<DailyUsageLog> findByDateBetweenAndTenantIdOrderByDateDesc(LocalDateTime start, LocalDateTime end, Long tenantId);
    
    @Query("SELECT d FROM DailyUsageLog d WHERE d.date BETWEEN :start AND :end AND d.tenantId = :restaurantId ORDER BY d.date DESC")
    List<DailyUsageLog> findByDateBetweenAndRestaurantIdOrderByDateDesc(LocalDateTime start, LocalDateTime end, Long restaurantId);
}
