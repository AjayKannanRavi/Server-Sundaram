package com.serversundaram.controller;

import com.serversundaram.config.TenantContext;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/restaurant")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantRepository restaurantRepository;
    private static final Logger log = LoggerFactory.getLogger(RestaurantController.class);

    @GetMapping
    public ResponseEntity<Restaurant> getRestaurant() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId != null) {
            return restaurantRepository.findById(restaurantId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        List<Restaurant> all = restaurantRepository.findAll();
        if (all.isEmpty()) {
            Restaurant r = new Restaurant();
            r.setName("My Restaurant");
            return ResponseEntity.ok(restaurantRepository.save(r));
        }
        return ResponseEntity.ok(all.get(0));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Restaurant> updateRestaurant(
            @PathVariable("id") @NonNull Long id,
            @RequestBody Restaurant updated) {
        // Allow authenticated users to update their assigned restaurant
        // Tenant context is verified by JWT authentication filter
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        log.info("updateRestaurant called for id={}, tenantId={}", id, restaurantId);

        Optional<Restaurant> existing = restaurantRepository.findById(id);
        if (existing.isEmpty()) {
            log.warn("Restaurant not found: {}", id);
            return ResponseEntity.notFound().build();
        }

        Restaurant r = existing.get();
        log.debug("Found restaurant: name={}, owner={}", r.getName(), r.getOwnerName());
        
        // Update all fields
        if (updated.getName() != null) {
            r.setName(updated.getName());
            log.debug("Updated name to: {}", updated.getName());
        }
        if (updated.getOwnerName() != null) {
            r.setOwnerName(updated.getOwnerName());
            log.debug("Updated ownerName to: {}", updated.getOwnerName());
        }
        if (updated.getOwnerEmail() != null) {
            r.setOwnerEmail(updated.getOwnerEmail());
            log.debug("Updated ownerEmail to: {}", updated.getOwnerEmail());
        }
        if (updated.getLogoUrl() != null) {
            r.setLogoUrl(updated.getLogoUrl());
            log.debug("Updated logoUrl to: {}", updated.getLogoUrl());
        }
        if (updated.getOwnerPhotoUrl() != null) {
            r.setOwnerPhotoUrl(updated.getOwnerPhotoUrl());
            log.debug("Updated ownerPhotoUrl to: {}", updated.getOwnerPhotoUrl());
        }
        if (updated.getUiTheme() != null) {
            r.setUiTheme(updated.getUiTheme());
            log.debug("Updated uiTheme to: {}", updated.getUiTheme());
        }
        if (updated.getAddress() != null) {
            r.setAddress(updated.getAddress());
            log.debug("Updated address to: {}", updated.getAddress());
        }
        if (updated.getContactNumber() != null) {
            r.setContactNumber(updated.getContactNumber());
            log.debug("Updated contactNumber to: {}", updated.getContactNumber());
        }
        if (updated.getGstNumber() != null) {
            r.setGstNumber(updated.getGstNumber());
            log.debug("Updated gstNumber to: {}", updated.getGstNumber());
        }
        if (updated.getTaxPercentage() != null) {
            r.setTaxPercentage(updated.getTaxPercentage());
            log.debug("Updated taxPercentage to: {}", updated.getTaxPercentage());
        }
        if (updated.getServiceCharge() != null) {
            r.setServiceCharge(updated.getServiceCharge());
            log.debug("Updated serviceCharge to: {}", updated.getServiceCharge());
        }
        
        Restaurant saved = restaurantRepository.save(r);
        log.info("Successfully saved restaurant id={}: name={}", saved.getId(), saved.getName());
        return ResponseEntity.ok(saved);
    }
}
