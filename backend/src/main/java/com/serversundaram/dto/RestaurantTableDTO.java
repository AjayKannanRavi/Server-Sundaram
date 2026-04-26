package com.serversundaram.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantTableDTO {
    private Long id;
    private Integer tableNumber;
    private String status;
    private String qrCodeUrl;
    private String currentSessionId;
    private Boolean qrGenerated;
    private Long restaurantId;
}
