package com.serversundaram.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrderResponse {
    private Long id;
    private Long tableId;
    private String status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private String paymentStatus;
    private Boolean isActive;
    private String rejectionReason;
}
