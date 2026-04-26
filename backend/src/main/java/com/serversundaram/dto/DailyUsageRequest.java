package com.serversundaram.dto;

import lombok.Data;
import java.util.List;

@Data
public class DailyUsageRequest {
    private List<UsageEntry> usages;
}
