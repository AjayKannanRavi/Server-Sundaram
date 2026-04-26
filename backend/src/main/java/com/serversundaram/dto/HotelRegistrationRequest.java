package com.serversundaram.dto;

import com.serversundaram.entity.Restaurant;
import lombok.Data;

@Data
public class HotelRegistrationRequest {
    private Restaurant restaurant;
    private String ownerEmail;
    private String adminUsername;
    private String adminPassword;
    private String kitchenUsername;
    private String kitchenPassword;
    private String captainUsername;
    private String captainPassword;
}
