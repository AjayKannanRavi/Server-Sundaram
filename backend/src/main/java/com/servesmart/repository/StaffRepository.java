package com.servesmart.repository;

import com.servesmart.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    @Query("SELECT s FROM Staff s WHERE (:restaurantId IS NULL AND s.restaurant IS NULL) OR (s.restaurant.id = :restaurantId)")
    List<Staff> findByRestaurantId(Long restaurantId);

    @Query("SELECT s FROM Staff s WHERE s.username = :username AND ((:restaurantId IS NULL AND s.restaurant IS NULL) OR (s.restaurant.id = :restaurantId))")
    Optional<Staff> findByUsernameAndRestaurantId(String username, Long restaurantId);

    void deleteAllByRestaurantId(Long restaurantId);
}
