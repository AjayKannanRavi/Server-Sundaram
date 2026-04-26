package com.serversundaram.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BroadcastResult {
    private Long restaurantId;
    private String audienceType;
    private Double minLoyaltyPoints;
    private int targetedCount;
    private int sentCount;
    private int skippedCount;
    private String message;
}
