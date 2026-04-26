package com.serversundaram.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

/**
 * Response DTO for hotel registration that includes auto-generated staff credentials.
 * This ensures each restaurant gets unique staff usernames to avoid conflicts.
 */
@Data
@AllArgsConstructor
public class HotelRegistrationResponse {
    private Long hotelId;
    private String hotelName;
    private Map<String, String> generatedCredentials;
}
