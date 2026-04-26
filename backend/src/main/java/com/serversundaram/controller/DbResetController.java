package com.serversundaram.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
public class DbResetController {

    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/reset")
    public String resetDatabase() {
        String[] tables = {
            "order_items", "orders", "payments", "reviews", "customers",
            "daily_usage_logs", "raw_materials", "menu_items", "categories",
            "staff", "restaurant_tables", "restaurant"
        };

        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        for (String table : tables) {
            jdbcTemplate.execute("TRUNCATE TABLE " + table);
        }
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        
        return "Database reset successful.";
    }
}
