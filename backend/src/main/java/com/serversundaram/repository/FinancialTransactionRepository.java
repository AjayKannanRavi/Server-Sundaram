package com.serversundaram.repository;

import com.serversundaram.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId")
    List<FinancialTransaction> findByTenantId(Long tenantId);
    
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :restaurantId")
    List<FinancialTransaction> findByRestaurantId(Long restaurantId);
    
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.type = :type")
    List<FinancialTransaction> findByTypeAndTenantId(String type, Long tenantId);
    
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.category = :category")
    List<FinancialTransaction> findByCategoryAndTenantId(String category, Long tenantId);
    
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.date BETWEEN :startDate AND :endDate")
    List<FinancialTransaction> findByTenantIdAndDateBetween(Long tenantId, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.type = :type")
    Double getTotalByTypeAndTenantId(String type, Long tenantId);
    
    @Query("SELECT SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.category = :category")
    Double getTotalByCategoryAndTenantId(String category, Long tenantId);
    
    @Query("SELECT ft.category, SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId GROUP BY ft.category")
    List<Object[]> getTransactionsByCategoryAndTenantId(Long tenantId);
    
    void deleteAllByTenantId(Long tenantId);
}