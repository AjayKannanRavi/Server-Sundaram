package com.servesmart.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DatabaseProvisioner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseProvisioner.class);

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

    public void dropTenantDatabase(String tenantId) {
        String dbName = "ss_hotel_" + tenantId;
        String rootUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        
        try {
            log.info("ATTEMPTING TO DROP DATABASE FOR TENANT: {}", tenantId);
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            try (Connection conn = DriverManager.getConnection(rootUrl, dbUser, dbPass);
                 Statement stmt = conn.createStatement()) {
                
                log.info("Dropping database {}...", dbName);
                stmt.executeUpdate("DROP DATABASE IF EXISTS " + dbName);
                log.info("Database {} dropped successfully.", dbName);
            }
        } catch (Exception e) {
            log.error("FAILED to drop database for tenant {}: {}", tenantId, e.getMessage());
            throw new RuntimeException("Failed to drop database for tenant: " + tenantId, e);
        }
    }

    public void createTenantDatabase(String tenantId) {
        String dbName = "ss_hotel_" + tenantId;
        String rootUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        
        try {
            log.info("STARTING PROVISIONING FOR TENANT: {}", tenantId);
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            try (Connection conn = DriverManager.getConnection(rootUrl, dbUser, dbPass);
                 Statement stmt = conn.createStatement()) {
                
                log.info("Checking if database {} exists...", dbName);
                stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS " + dbName);
                
                // Initialize the schema
                String tenantUrl = buildTenantJdbcUrl(dbName, true);
                try (Connection tenantConn = DriverManager.getConnection(tenantUrl, dbUser, dbPass)) {
                    String schemaSql = loadSchemaSql();
                    log.info("Ensuring schema synchronization (executing CREATE TABLE IF NOT EXISTS statements)...");
                    try (Statement tenantStmt = tenantConn.createStatement()) {
                        String[] statements = schemaSql.split(";");
                        int count = 0;
                        for (String sql : statements) {
                            if (!sql.trim().isEmpty()) {
                                try {
                                    tenantStmt.execute(sql.trim());
                                    count++;
                                } catch (Exception se) {
                                    log.warn("Statement failed (might be expected for initial setup): {}", se.getMessage());
                                }
                            }
                        }
                        log.info("Schema synchronization check finished for {} ({} statements attempted).", dbName, count);
                        
                        // UNIVERSAL FIX: Sync Customers table columns for OTP
                        syncCustomerSchema(tenantConn);

                        // SEED: Default Tables 1-10
                        seedDefaultTables(tenantConn, tenantId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("CRITICAL ERROR during tenant provisioning for {}: {}", tenantId, e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to provision database for tenant: " + tenantId, e);
        }
    }

    private void syncCustomerSchema(Connection conn) throws Exception {
        log.info("Synchronizing 'customers' table schema...");
        DatabaseMetaData meta = conn.getMetaData();
        
        addColumnIfMissing(conn, meta, "customers", "mobile_number", "VARCHAR(20)");
        addColumnIfMissing(conn, meta, "customers", "created_at", "DATETIME");
        addColumnIfMissing(conn, meta, "customers", "visit_count", "INT DEFAULT 0");
        addColumnIfMissing(conn, meta, "customers", "last_visited_date", "DATETIME");
        addColumnIfMissing(conn, meta, "customers", "last_table_used", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "customers", "current_otp", "VARCHAR(20)");
        addColumnIfMissing(conn, meta, "customers", "otp_generated_at", "DATETIME");
        
        log.info("'customers' table schema is now synchronized.");
    }

    private void addColumnIfMissing(Connection conn, DatabaseMetaData meta, String tableName, String colName, String colDef) throws Exception {
        try (ResultSet rs = meta.getColumns(null, null, tableName, colName)) {
            if (!rs.next()) {
                log.info("Adding missing column '{}' to table '{}'...", colName, tableName);
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("ALTER TABLE " + tableName + " ADD COLUMN " + colName + " " + colDef);
                }
            }
        }
    }

    public void syncTenantRestaurant(String tenantId) {
        String dbName = "ss_hotel_" + tenantId;
        String masterUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/servesmart_db?" + dbParams;
        String tenantUrl = buildTenantJdbcUrl(dbName, false);
        
        log.info("Syncing restaurant record for tenant {} from master DB...", tenantId);
        
        try (Connection masterConn = DriverManager.getConnection(masterUrl, dbUser, dbPass);
             Connection tenantConn = DriverManager.getConnection(tenantUrl, dbUser, dbPass);
             Statement masterStmt = masterConn.createStatement();
             ResultSet rs = masterStmt.executeQuery("SELECT * FROM restaurant WHERE id = " + tenantId)) {
            
            if (rs.next()) {
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
                
                try (java.sql.PreparedStatement ps = tenantConn.prepareStatement(sql)) {
                    ps.setLong(1, rs.getLong("id"));
                    ps.setString(2, rs.getString("name"));
                    ps.setString(3, rs.getString("owner_name"));
                    ps.setString(4, rs.getString("owner_email"));
                    ps.setString(5, rs.getString("owner_password"));
                    ps.setString(6, rs.getString("contact_number"));
                    ps.setString(7, rs.getString("logo_url"));
                    ps.setString(8, rs.getString("address"));
                    ps.setString(9, rs.getString("gst_number"));
                    ps.setString(10, rs.getString("plan_type"));
                    ps.setTimestamp(11, rs.getTimestamp("plan_expiry"));
                    ps.setBoolean(12, rs.getBoolean("is_active"));
                    ps.setDouble(13, rs.getDouble("tax_percentage"));
                    ps.setDouble(14, rs.getDouble("service_charge"));
                    ps.executeUpdate();
                    log.info("Restaurant record synced successfully for tenant {}.", tenantId);
                }
            } else {
                log.warn("No restaurant record found in master DB for ID: {}", tenantId);
            }
        } catch (Exception e) {
            log.error("Failed to sync restaurant record for tenant {}: {}", tenantId, e.getMessage());
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

        try (Connection tenantConn = DriverManager.getConnection(
                buildTenantJdbcUrl(dbName, false),
                dbUser, dbPass);
             java.sql.PreparedStatement ps = tenantConn.prepareStatement(sql)) {

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

    private void seedDefaultTables(Connection conn, String tenantId) {
        log.info("Seeding default tables (1-10) for tenant {}...", tenantId);
        try (Statement stmt = conn.createStatement()) {
            // Check if any tables exist
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM restaurant_tables")) {
                if (rs.next() && rs.getInt(1) > 0) {
                    log.info("Tables already exist for tenant {}. Skipping default seed.", tenantId);
                    return;
                }
            }

            for (int i = 1; i <= 10; i++) {
                String sql = String.format(
                    "INSERT INTO restaurant_tables (table_number, status, qr_generated, restaurant_id, qr_code_url) VALUES (%d, 'AVAILABLE', false, %s, '')",
                    i, tenantId
                );
                try {
                    stmt.execute(sql);
                } catch (Exception se) {
                    if (se.getMessage().contains("Duplicate entry")) {
                        log.warn("Table {} already exists for tenant {}. Skipping.", i, tenantId);
                    } else {
                        throw se;
                    }
                }
            }
            log.info("Successfully seeded Tables 1-10 for tenant {}.", tenantId);
        } catch (Exception e) {
            log.error("CRITICAL SEEDING FAILURE for tenant {}: {}", tenantId, e.getMessage());
            e.printStackTrace();
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
