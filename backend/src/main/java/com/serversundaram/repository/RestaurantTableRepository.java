package com.serversundaram.repository;

import com.serversundaram.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    @Query("SELECT t FROM RestaurantTable t WHERE t.restaurant.id = :restaurantId")
    List<RestaurantTable> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(t) FROM RestaurantTable t WHERE t.restaurant.id = :restaurantId")
    long countByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT t FROM RestaurantTable t WHERE t.tableNumber = :tableNumber AND t.restaurant.id = :restaurantId")
    Optional<RestaurantTable> findByTableNumberAndRestaurantId(@Param("tableNumber") Integer tableNumber, @Param("restaurantId") Long restaurantId);
}
