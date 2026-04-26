package com.serversundaram.service;

import com.serversundaram.config.TenantContext;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.entity.DailyUsageLog;
import com.serversundaram.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final DailyUsageLogRepository dailyUsageLogRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final MenuItemRepository menuItemRepository;

    public Map<String, Object> getSummary(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Map<String, Object> summary = new HashMap<>();
        Double revenue = orderRepository.getTotalRevenueBetween(start, end, restaurantId);
        Long orders = orderRepository.getTotalOrdersBetween(start, end, restaurantId);
        Double avgValue = orderRepository.getAverageOrderValueBetween(start, end, restaurantId);
        summary.put("dailyRevenue", revenue != null ? revenue : 0.0);
        summary.put("totalRevenue", revenue != null ? revenue : 0.0);
        summary.put("totalOrders", orders != null ? orders : 0L);
        summary.put("avgOrderValue", avgValue != null ? avgValue : 0.0);
        List<Object[]> statusResults = orderRepository.getOrderStatusCountsBetween(start, end, restaurantId);
        Map<String, Long> statusBreakdown = new HashMap<>();
        for (Object[] res : statusResults) {
            statusBreakdown.put(res[0].toString(), (Long) res[1]);
        }
        summary.put("orderStatusBreakdown", statusBreakdown);
        return summary;
    }

    public Map<String, Object> getYearlySummary() {
        LocalDateTime start = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end = LocalDateTime.now();
        return getSummary(start, end);
    }

    public List<Map<String, Object>> getTopDishes(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(orderItemRepository.getTopDishesBetween(start, end, restaurantId), "name", "quantity", "revenue");
    }

    public List<Map<String, Object>> getBottomDishes(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(orderItemRepository.getBottomDishesBetween(start, end, restaurantId), "name", "quantity", "revenue");
    }

    public List<Map<String, Object>> getCategoryRevenue(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(orderItemRepository.getCategoryRevenueBetween(start, end, restaurantId), "category", "revenue");
    }

    public List<Map<String, Object>> getPeakHours(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(orderRepository.getOrdersByHourBetween(start, end, restaurantId), "hour", "count");
    }

    public List<Map<String, Object>> getPaymentInsights(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(paymentRepository.getPaymentMethodsBreakdownBetween(start, end, restaurantId), "method", "revenue", "count");
    }

    public List<Map<String, Object>> getDailyTrend(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return mapResults(orderRepository.getDailyRevenueTrendBetween(start, end, restaurantId), "date", "revenue");
    }

    public List<Map<String, Object>> getInventoryStatus() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        List<RawMaterial> materials = restaurantId != null ? rawMaterialRepository.findByRestaurantId(restaurantId) : rawMaterialRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();
        for (RawMaterial m : materials) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("stock", m.getQuantity());
            map.put("unit", m.getUnit());
            results.add(map);
        }
        return results;
    }

    public Map<String, Object> getReviewAnalytics() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        // reviewRepository needs updates for these custom queries too if strict isolation is needed.
        // For now, I'll assume they also need restaurantId.
        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", reviewRepository.getAverageRating(restaurantId));
        stats.put("totalReviews", reviewRepository.countByRestaurantId(restaurantId));
        stats.put("distribution", mapResults(reviewRepository.getRatingDistribution(restaurantId), "rating", "count"));
        return stats;
    }

    public List<Map<String, Object>> getDishMargins() {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        List<com.serversundaram.entity.MenuItem> items = menuItemRepository.findByRestaurantId(restaurantId);
        List<Map<String, Object>> margins = new ArrayList<>();

        for (com.serversundaram.entity.MenuItem item : items) {
            List<com.serversundaram.entity.RecipeItem> recipe = recipeItemRepository.findByMenuItemId(item.getId());
            double totalCost = 0.0;
            for (com.serversundaram.entity.RecipeItem r : recipe) {
                totalCost += (r.getQuantityRequired() * r.getRawMaterial().getCostPerUnit());
            }

            double margin = item.getPrice() - totalCost;
            double marginPercent = item.getPrice() > 0 ? (margin / item.getPrice()) * 100 : 0;

            Map<String, Object> map = new HashMap<>();
            map.put("name", item.getName());
            map.put("price", item.getPrice());
            map.put("cost", totalCost);
            map.put("margin", margin);
            map.put("percent", marginPercent);
            margins.add(map);
        }

        // Sort by margin percent descending
        margins.sort((a, b) -> Double.compare((Double) b.get("percent"), (Double) a.get("percent")));
        return margins;
    }

    private List<Map<String, Object>> mapResults(List<Object[]> results, String... keys) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] res : results) {
            Map<String, Object> map = new HashMap<>();
            for (int i = 0; i < keys.length && i < res.length; i++) {
                map.put(keys[i], res[i]);
            }
            list.add(map);
        }
        return list;
    }

    public byte[] exportToExcel(LocalDateTime start, LocalDateTime end) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Order History");
            Row header = sheet.createRow(0);
            String[] columns = {"Date", "Order ID", "Table", "Item Name", "Quantity", "Price", "Total Amount", "Status", "Payment Method"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            Long restaurantId = TenantContext.getCurrentTenantAsLong();
            List<com.serversundaram.entity.RestaurantOrder> orders = (restaurantId != null ? orderRepository.findAllByRestaurantId(restaurantId) : orderRepository.findAll()).stream()
                .filter(o -> o.getCreatedAt().isAfter(start) && o.getCreatedAt().isBefore(end))
                .toList();
            int rowIdx = 1;
            for (com.serversundaram.entity.RestaurantOrder order : orders) {
                for (com.serversundaram.entity.OrderItem item : order.getItems()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(order.getCreatedAt().toString());
                    row.createCell(1).setCellValue(order.getId());
                    row.createCell(2).setCellValue(order.getRestaurantTable() != null ? "Table " + order.getRestaurantTable().getTableNumber() : "N/A");
                    row.createCell(3).setCellValue(item.getMenuItem() != null ? item.getMenuItem().getName() : "N/A");
                    row.createCell(4).setCellValue(item.getQuantity());
                    row.createCell(5).setCellValue(item.getPrice());
                    row.createCell(6).setCellValue(item.getQuantity() * item.getPrice());
                    row.createCell(7).setCellValue(order.getStatus().toString());
                    row.createCell(8).setCellValue(order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A");
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public List<DailyUsageLog> getInventoryLogs(LocalDateTime start, LocalDateTime end) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return dailyUsageLogRepository.findByDateBetweenAndRestaurantIdOrderByDateDesc(start, end, restaurantId);
    }

    public byte[] exportInventoryToExcel(LocalDateTime start, LocalDateTime end) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Inventory Usage History");
            Row header = sheet.createRow(0);
            String[] columns = {"Date", "Material Name", "Used Quantity", "Remaining Stock", "Unit"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            Long restaurantId = TenantContext.getCurrentTenantAsLong();
            List<DailyUsageLog> logs = dailyUsageLogRepository.findByDateBetweenAndRestaurantIdOrderByDateDesc(start, end, restaurantId);
            int rowIdx = 1;
            for (DailyUsageLog log : logs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(log.getDate().toString());
                row.createCell(1).setCellValue(log.getMaterialName());
                row.createCell(2).setCellValue(log.getUsedQuantity());
                row.createCell(3).setCellValue(log.getRemainingQuantity());
                row.createCell(4).setCellValue(log.getUnit());
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportRejectedToExcel(LocalDateTime start, LocalDateTime end) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Rejected Orders");
            Row header = sheet.createRow(0);
            String[] columns = {"Date", "Order ID", "Table", "Item Details", "Total Impact", "Rejection Reason"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            Long restaurantId = TenantContext.getCurrentTenantAsLong();
            List<com.serversundaram.entity.RestaurantOrder> orders = (restaurantId != null ? orderRepository.findAllByRestaurantId(restaurantId) : orderRepository.findAll()).stream()
                .filter(o -> o.getStatus() == com.serversundaram.entity.OrderStatus.REJECTED)
                .filter(o -> o.getCreatedAt().isAfter(start) && o.getCreatedAt().isBefore(end))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
            
            int rowIdx = 1;
            for (com.serversundaram.entity.RestaurantOrder order : orders) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(order.getCreatedAt().toString());
                row.createCell(1).setCellValue(order.getId());
                row.createCell(2).setCellValue(order.getRestaurantTable() != null ? "Table " + order.getRestaurantTable().getTableNumber() : "N/A");
                
                StringBuilder items = new StringBuilder();
                for (com.serversundaram.entity.OrderItem item : order.getItems()) {
                    if (items.length() > 0) items.append(", ");
                    items.append(item.getQuantity()).append("Ã— ").append(item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown");
                }
                row.createCell(3).setCellValue(items.toString());
                row.createCell(4).setCellValue(order.getTotalAmount());
                row.createCell(5).setCellValue(order.getRejectionReason() != null ? order.getRejectionReason() : "No reason provided");
            }
            // Auto size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
