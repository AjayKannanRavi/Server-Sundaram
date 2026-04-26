package com.serversundaram.controller;

import com.serversundaram.config.TenantContext;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.repository.RawMaterialRepository;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/raw-materials")
@RequiredArgsConstructor
public class RawMaterialController {

    private final RawMaterialRepository repository;
    private final RestaurantRepository restaurantRepository;

    @GetMapping
    public List<RawMaterial> getAll() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return restaurantId != null
                ? repository.findByRestaurantId(restaurantId)
                : repository.findAll();
    }

    @PostMapping
    public RawMaterial create(@RequestBody RawMaterial rawMaterial) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId != null) {
            Optional<Restaurant> restaurant = restaurantRepository.findById(restaurantId);
            restaurant.ifPresent(rawMaterial::setRestaurant);
        }
        return repository.save(rawMaterial);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RawMaterial> update(@PathVariable Long id, @RequestBody RawMaterial details) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (id == null) return ResponseEntity.badRequest().build();
        Optional<RawMaterial> existing = repository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        RawMaterial material = existing.get();
        if (restaurantId != null && material.getRestaurant() != null
                && !restaurantId.equals(material.getRestaurant().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        material.setName(details.getName());
        material.setQuantity(details.getQuantity());
        material.setUnit(details.getUnit());
        if (details.getMinThreshold() != null) {
            material.setMinThreshold(details.getMinThreshold());
        }
        return ResponseEntity.ok(repository.save(material));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Optional<RawMaterial> existing = repository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        RawMaterial material = existing.get();
        if (restaurantId != null && material.getRestaurant() != null
                && !restaurantId.equals(material.getRestaurant().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        repository.delete(material);
        return ResponseEntity.noContent().build();
    }
}
