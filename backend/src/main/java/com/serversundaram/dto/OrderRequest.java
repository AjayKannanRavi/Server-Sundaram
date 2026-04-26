package com.serversundaram.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private Long tableId;
    private String customerName;
    private String customerPhone;
    private List<OrderItemRequest> items;
}
