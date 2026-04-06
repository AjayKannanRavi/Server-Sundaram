package com.servesmart.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DatabaseProvisioner {

    private final DataSource dataSource;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPass;

    @Value("${app.database.host:localhost}")
    private String dbHost;

    @Value("${app.database.port:3306}")
    private String dbPort;

    @Value("${app.database.params:useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}")
    private String dbParams;

    public void createTenantDatabase(String tenantId) {
        String dbName = "ss_hotel_" + tenantId;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            // Create the database (Drop first for development to ensure schema sync)
            stmt.executeUpdate("DROP DATABASE IF EXISTS " + dbName);
            stmt.executeUpdate("CREATE DATABASE " + dbName);
            System.out.println("Database dropped and recreated: " + dbName);


            // Initialize the schema
            try (Connection tenantConn = java.sql.DriverManager.getConnection(
                    buildTenantJdbcUrl(dbName, true),
                    dbUser, dbPass)) {
                
                String schemaSql = loadSchemaSql();
                try (Statement tenantStmt = tenantConn.createStatement()) {
                    tenantStmt.execute(schemaSql);
                    System.out.println("Schema initialized for: " + dbName);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to provision database for tenant: " + tenantId, e);
        }
    }

    public void seedTenantRestaurant(com.servesmart.entity.Restaurant restaurant) {
        if (restaurant == null || restaurant.getId() == null) {
            throw new RuntimeException("Cannot seed tenant restaurant without a valid restaurant id");
        }

        String dbName = "ss_hotel_" + restaurant.getId();
        String sql = "INSERT INTO restaurant ("
                + "id, name, owner_name, owner_email, owner_password, contact_number, logo_url, "
                + "address, gst_number, plan_type, plan_expiry, is_active, tax_percentage, service_charge"
                + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE "
                + "name = VALUES(name), owner_name = VALUES(owner_name), owner_email = VALUES(owner_email), "
                + "owner_password = VALUES(owner_password), contact_number = VALUES(contact_number), logo_url = VALUES(logo_url), "
                + "address = VALUES(address), gst_number = VALUES(gst_number), plan_type = VALUES(plan_type), "
                + "plan_expiry = VALUES(plan_expiry), is_active = VALUES(is_active), "
                + "tax_percentage = VALUES(tax_percentage), service_charge = VALUES(service_charge)";

        try (Connection tenantConn = java.sql.DriverManager.getConnection(
        buildTenantJdbcUrl(dbName, false),
                dbUser, dbPass);
             PreparedStatement ps = tenantConn.prepareStatement(sql)) {

            ps.setLong(1, restaurant.getId());
            ps.setString(2, restaurant.getName());
            ps.setString(3, restaurant.getOwnerName());
            ps.setString(4, restaurant.getOwnerEmail());
            ps.setString(5, restaurant.getOwnerPassword());
            ps.setString(6, restaurant.getContactNumber());
            ps.setString(7, restaurant.getLogoUrl());
            ps.setString(8, restaurant.getAddress());
            ps.setString(9, restaurant.getGstNumber());
            ps.setString(10, restaurant.getPlanType());
            if (restaurant.getPlanExpiry() != null) {
                ps.setTimestamp(11, Timestamp.valueOf(restaurant.getPlanExpiry()));
            } else {
                ps.setTimestamp(11, null);
            }
            ps.setBoolean(12, restaurant.getIsActive() != null ? restaurant.getIsActive() : true);
            ps.setDouble(13, restaurant.getTaxPercentage() != null ? restaurant.getTaxPercentage() : 5.0);
            ps.setDouble(14, restaurant.getServiceCharge() != null ? restaurant.getServiceCharge() : 0.0);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("Failed to seed tenant restaurant for tenant: " + restaurant.getId(), e);
        }
    }

    private String loadSchemaSql() throws Exception {
        InputStream is = getClass().getClassLoader().getResourceAsStream("tenant-schema.sql");
        if (is == null) throw new RuntimeException("tenant-schema.sql not found!");
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }

    private String buildTenantJdbcUrl(String dbName, boolean allowMultiQueries) {
        String params = dbParams == null ? "" : dbParams.trim();
        if (allowMultiQueries && !params.contains("allowMultiQueries=")) {
            params = params.isEmpty() ? "allowMultiQueries=true" : params + "&allowMultiQueries=true";
        }
        return "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName + (params.isEmpty() ? "" : "?" + params);
    }
}
