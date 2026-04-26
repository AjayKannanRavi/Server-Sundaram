package com.serversundaram.dto;

import lombok.Data;

@Data
public class MenuItemRequest {
    private String name;
    private String description;
    private Double price;
    private Boolean available;
    private Long categoryId;
    private Boolean isVeg;
    private String imageUrl;
}
