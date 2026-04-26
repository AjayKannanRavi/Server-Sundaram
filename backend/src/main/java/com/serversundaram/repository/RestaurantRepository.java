package com.serversundaram.repository;

import com.serversundaram.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    long countByIsActive(boolean isActive);
    boolean existsByOwnerEmailIgnoreCase(String ownerEmail);
    boolean existsByNameIgnoreCase(String name);
    Optional<Restaurant> findByOwnerEmailIgnoreCase(String ownerEmail);
    List<Restaurant> findAllByOwnerEmailIgnoreCaseOrderByIdDesc(String ownerEmail);
}
