package com.serversundaram.controller;

import com.serversundaram.config.TenantContext;
import com.serversundaram.dto.ReviewRequest;
import com.serversundaram.entity.Review;
import com.serversundaram.repository.RestaurantRepository;
import com.serversundaram.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Review> submitReview(@RequestBody ReviewRequest request) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();

        // Prevent duplicate review for the same session
        if (reviewRepository.findBySessionIdAndRestaurantId(request.getSessionId(), restaurantId).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Review review = new Review();
        review.setSessionId(request.getSessionId());
        review.setTableId(request.getTableId());
        review.setOverallRating(request.getOverallRating());
        review.setComment(request.getComment());
        review.setItemRatingsJson(request.getItemRatingsJson());

        if (restaurantId != null) {
            restaurantRepository.findById(restaurantId).ifPresent(review::setRestaurant);
        }

        Review saved = reviewRepository.save(review);

        // Broadcast for real-time admin updates
        if (restaurantId != null) {
            messagingTemplate.convertAndSend("/topic/" + restaurantId + "/reviews", saved);
        } else {
            messagingTemplate.convertAndSend("/topic/reviews", saved);
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Review> getReview(@PathVariable String sessionId) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Optional<Review> review = reviewRepository.findBySessionIdAndRestaurantId(sessionId, restaurantId);
        return review.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return ResponseEntity.ok(reviewRepository.findByRestaurantId(restaurantId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Optional<Review> reviewOpt = reviewRepository.findById(id);
        if (reviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Review review = reviewOpt.get();
        if (restaurantId != null && review.getRestaurant() != null
                && !restaurantId.equals(review.getRestaurant().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        reviewRepository.delete(review);
        return ResponseEntity.noContent().build();
    }
}
