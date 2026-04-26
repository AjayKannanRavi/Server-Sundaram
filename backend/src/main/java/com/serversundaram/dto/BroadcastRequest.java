package com.serversundaram.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastRequest {
    private String title;
    private String message;
    private String imageUrl;
    private String audienceType;
    private Double minLoyaltyPoints;
}
