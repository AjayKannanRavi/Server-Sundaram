package com.serversundaram.controller;

import com.serversundaram.entity.DailyUsageLog;
import com.serversundaram.service.AnalyticsService;
import com.serversundaram.service.BroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final BroadcastService broadcastService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getSummary(dates[0], dates[1]));
    }

    @GetMapping("/yearly")
    public ResponseEntity<Map<String, Object>> getYearlySummary() {
        return ResponseEntity.ok(analyticsService.getYearlySummary());
    }

    @GetMapping("/dishes")
    public ResponseEntity<List<Map<String, Object>>> getDishes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getTopDishes(dates[0], dates[1]));
    }

    @GetMapping("/dishes/bottom")
    public ResponseEntity<List<Map<String, Object>>> getBottomDishes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getBottomDishes(dates[0], dates[1]));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getCategoryRevenue(dates[0], dates[1]));
    }

    @GetMapping("/trend")
    public ResponseEntity<List<Map<String, Object>>> getTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getDailyTrend(dates[0], dates[1]));
    }

    @GetMapping("/peak-hours")
    public ResponseEntity<List<Map<String, Object>>> getPeakHours(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getPeakHours(dates[0], dates[1]));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Map<String, Object>>> getPayments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getPaymentInsights(dates[0], dates[1]));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) throws Exception {
        LocalDateTime[] dates = resolveDates(start, end);
        byte[] excelContent = analyticsService.exportToExcel(dates[0], dates[1]);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=serversundaram_Report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelContent);
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<Map<String, Object>>> getInventory() {
        return ResponseEntity.ok(analyticsService.getInventoryStatus());
    }

    @GetMapping("/inventory/logs")
    public ResponseEntity<List<DailyUsageLog>> getInventoryLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        LocalDateTime[] dates = resolveDates(start, end);
        return ResponseEntity.ok(analyticsService.getInventoryLogs(dates[0], dates[1]));
    }

    @GetMapping("/inventory/export")
    public ResponseEntity<byte[]> exportInventoryUsage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) throws Exception {
        LocalDateTime[] dates = resolveDates(start, end);
        byte[] excelContent = analyticsService.exportInventoryToExcel(dates[0], dates[1]);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Inventory_Usage_Report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelContent);
    }

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getReviews() {
        return ResponseEntity.ok(analyticsService.getReviewAnalytics());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<com.serversundaram.dto.BroadcastResult> broadcastOffer(@RequestBody com.serversundaram.dto.BroadcastRequest request) {
        Long restaurantId = com.serversundaram.config.TenantContext.getCurrentTenantAsLong();
        return ResponseEntity.ok(broadcastService.processBroadcast(restaurantId, request));
    }

    @GetMapping("/rejected/export")
    public ResponseEntity<byte[]> exportRejectedOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) throws Exception {
        LocalDateTime[] dates = resolveDates(start, end);
        byte[] excelContent = analyticsService.exportRejectedToExcel(dates[0], dates[1]);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Rejected_Orders_Report.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelContent);
    }

    @GetMapping("/margins")
    public ResponseEntity<List<Map<String, Object>>> getMargins() {
        return ResponseEntity.ok(analyticsService.getDishMargins());
    }

    private LocalDateTime[] resolveDates(LocalDateTime start, LocalDateTime end) {
        if (start == null) start = LocalDateTime.now().minusDays(30);
        if (end == null) end = LocalDateTime.now();
        return new LocalDateTime[]{start, end};
    }
}
