package com.serversundaram.repository;

import com.serversundaram.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :restaurantId")
    List<Customer> findByRestaurantId(Long restaurantId);

    @Query("SELECT c FROM Customer c WHERE c.mobileNumber = :mobileNumber AND c.tenantId = :restaurantId")
    Optional<Customer> findByMobileNumberAndRestaurantId(String mobileNumber, Long restaurantId);

    @Query("SELECT c FROM Customer c WHERE lower(c.name) LIKE lower(concat('%', :name, '%')) AND c.tenantId = :restaurantId")
    List<Customer> findByNameContainingIgnoreCaseAndRestaurantId(String name, Long restaurantId);
}
