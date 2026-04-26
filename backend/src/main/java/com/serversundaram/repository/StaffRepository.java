package com.serversundaram.repository;

import com.serversundaram.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    @Query("SELECT s FROM Staff s WHERE s.tenantId = :restaurantId OR s.restaurant.id = :restaurantId")
    List<Staff> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT s FROM Staff s WHERE s.username = :username AND (s.tenantId = :restaurantId OR s.restaurant.id = :restaurantId)")
    Optional<Staff> findByUsernameAndRestaurantId(@Param("username") String username, @Param("restaurantId") Long restaurantId);

    @Query("SELECT s FROM Staff s WHERE LOWER(s.username) = LOWER(:username) AND (s.tenantId = :restaurantId OR s.restaurant.id = :restaurantId)")
    Optional<Staff> findByUsernameIgnoreCaseAndRestaurantId(@Param("username") String username, @Param("restaurantId") Long restaurantId);
    
    Optional<Staff> findByUsername(String username);

    Optional<Staff> findByUsernameIgnoreCase(String username);

    @Modifying
    @Query("DELETE FROM Staff s WHERE s.tenantId = :restaurantId OR s.restaurant.id = :restaurantId")
    void deleteAllByRestaurantId(@Param("restaurantId") Long restaurantId);
}
