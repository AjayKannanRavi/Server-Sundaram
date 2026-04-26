package com.serversundaram.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private String sessionId;
    private Long tableId;
    private Integer overallRating;
    private String comment;
    private String itemRatingsJson;
}
