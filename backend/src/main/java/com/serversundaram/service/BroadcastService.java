package com.serversundaram.service;

import com.serversundaram.dto.BroadcastRequest;
import com.serversundaram.dto.BroadcastResult;
import com.serversundaram.entity.Customer;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.repository.CustomerRepository;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastService {

    private final RestaurantRepository restaurantRepository;
    private final CustomerRepository customerRepository;

    public BroadcastResult processBroadcast(Long restaurantId, BroadcastRequest request) {
        Restaurant restaurant = restaurantRepository.findById(Objects.requireNonNull(restaurantId))
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!"PREMIUM".equals(restaurant.getPlanType())) {
            throw new RuntimeException("Broadcast feature is only available for PREMIUM plans.");
        }

        List<Customer> customers = customerRepository.findByRestaurantId(Objects.requireNonNull(restaurantId));

        String audienceType = normalizeAudienceType(request.getAudienceType());
        Double minLoyaltyPoints = request.getMinLoyaltyPoints();

        if ("LOYALTY_THRESHOLD".equals(audienceType) && minLoyaltyPoints == null) {
            throw new RuntimeException("Minimum loyalty points are required for loyalty threshold targeting.");
        }

        List<Customer> targetedCustomers = customers;
        if ("LOYALTY_THRESHOLD".equals(audienceType)) {
            double threshold = Math.max(0.0, minLoyaltyPoints);
            targetedCustomers = customers.stream()
                    .filter(c -> c.getLoyaltyPoints() != null && c.getLoyaltyPoints() >= threshold)
                    .collect(Collectors.toList());
            minLoyaltyPoints = threshold;
        }
        
        log.info("Starting Broadcast for Restaurant: {} ({})", restaurant.getName(), restaurantId);
        log.info("Offer Details - Title: {}, Message: {}, Image: {}", 
                request.getTitle(), request.getMessage(), request.getImageUrl());
        log.info("Audience Type: {}", audienceType);
        if ("LOYALTY_THRESHOLD".equals(audienceType)) {
            log.info("Loyalty Threshold: {} points", minLoyaltyPoints);
        }
        log.info("Target Audience Size: {} customers", targetedCustomers.size());

        int sentCount = 0;
        int skippedCount = 0;

        for (Customer customer : targetedCustomers) {
            String phone = customer.getMobileNumber();
            if (phone != null && !phone.isEmpty()) {
                // Simulate sending message
                log.info("--- [SIMULATED SMS/WHATSAPP] ---");
                log.info("To: {}", phone);
                log.info("Body: {} - {}", request.getTitle(), request.getMessage());
                if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
                    log.info("Attachment: {}", request.getImageUrl());
                }
                log.info("--------------------------------");
                sentCount++;
            } else {
                skippedCount++;
            }
        }
        
        log.info("Broadcast completed successfully for restaurant {}", restaurantId);

        return new BroadcastResult(
                restaurantId,
                audienceType,
                minLoyaltyPoints,
                targetedCustomers.size(),
                sentCount,
                skippedCount,
                "Broadcast processed successfully"
        );
    }

    private String normalizeAudienceType(String input) {
        if (input == null || input.isBlank()) {
            return "ALL";
        }
        String normalized = input.trim().toUpperCase();
        if ("LOYALTY_THRESHOLD".equals(normalized)) {
            return normalized;
        }
        return "ALL";
    }
}
