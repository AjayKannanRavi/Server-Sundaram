package com.serversundaram.controller;

import com.serversundaram.dto.DailyUsageRequest;
import com.serversundaram.entity.DailyUsageLog;
import com.serversundaram.service.ClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/closing")
@RequiredArgsConstructor
public class ClosingController {

    private final ClosingService closingService;

    @PostMapping
    public ResponseEntity<List<DailyUsageLog>> performClosing(@RequestBody DailyUsageRequest request) {
        return ResponseEntity.ok(closingService.performDayClosing(request));
    }
}
