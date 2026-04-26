package com.serversundaram.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String status;
    private String paymentMethod;
    private Double discountAmount = 0.0;
    private Double taxPercentage; // Optional, defaults to restaurant setting
}
