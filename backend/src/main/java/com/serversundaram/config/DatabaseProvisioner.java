package com.serversundaram.config;

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

                        // Align tenant schema with current entity model
                        syncTenantModelSchema(tenantConn);

                        // Fix any problematic unique constraints on restaurant_tables
                        fixRestaurantTablesConstraints(tenantConn);

                        // Fix any problematic unique constraints on categories
                        fixCategoriesConstraints(tenantConn);

                        // SEEDING OF TABLES IS NOW MOVED TO A SEPARATE CALL AFTER RESTAURANT RECORD IS SYNCED
                    }
                }
            }
        } catch (Exception e) {
            log.error("CRITICAL ERROR during tenant provisioning for {}: {}", tenantId, e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to provision database for tenant: " + tenantId, e);
        }
    }

    public void seedTenantTables(String tenantId) {
        String dbName = "ss_hotel_" + tenantId;
        String tenantUrl = buildTenantJdbcUrl(dbName, false);
        try (Connection conn = DriverManager.getConnection(tenantUrl, dbUser, dbPass)) {
            seedDefaultTables(conn, tenantId);
        } catch (Exception e) {
            log.error("Failed to seed tables for tenant {}: {}", tenantId, e.getMessage());
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

    private void fixRestaurantTablesConstraints(Connection conn) throws Exception {
        log.info("Fixing restaurant_tables unique constraints...");
        try (Statement stmt = conn.createStatement()) {
            String catalog = conn.getCatalog();
            DatabaseMetaData meta = conn.getMetaData();
            
            // Get all unique constraints on restaurant_tables
            try (ResultSet constraints = meta.getIndexInfo(catalog, null, "restaurant_tables", true, false)) {
                while (constraints.next()) {
                    String constraintName = constraints.getString("INDEX_NAME");
                    String columnName = constraints.getString("COLUMN_NAME");
                    
                    // Drop any unique constraints that aren't the proper one we defined
                    if (constraintName != null && !constraintName.equals("PRIMARY") &&
                        !constraintName.equals("uk_table_number_per_restaurant")) {
                        log.warn("Dropping problematic constraint: {}", constraintName);
                        try {
                            stmt.executeUpdate("ALTER TABLE restaurant_tables DROP INDEX " + constraintName);
                        } catch (Exception e) {
                            log.warn("Could not drop constraint {}: {}", constraintName, e.getMessage());
                        }
                    }
                }
            }
            
            // Ensure the proper unique constraint exists
            boolean hasProperConstraint = false;
            try (ResultSet constraints = meta.getIndexInfo(catalog, null, "restaurant_tables", true, false)) {
                while (constraints.next()) {
                    if ("uk_table_number_per_restaurant".equals(constraints.getString("INDEX_NAME"))) {
                        hasProperConstraint = true;
                        break;
                    }
                }
            }
            
            if (!hasProperConstraint) {
                log.info("Adding proper unique constraint on restaurant_tables...");
                try {
                    stmt.executeUpdate("ALTER TABLE restaurant_tables ADD UNIQUE KEY uk_table_number_per_restaurant (restaurant_id, table_number)");
                } catch (Exception e) {
                    if (!e.getMessage().contains("Duplicate entry")) {
                        log.warn("Could not add unique constraint: {}", e.getMessage());
                    }
                }
            }
            
            // Remove any duplicate (restaurant_id, table_number) combinations, keeping the first
            log.info("Cleaning up duplicate table entries...");
            try {
                stmt.executeUpdate(
                    "DELETE FROM restaurant_tables WHERE id NOT IN (" +
                    "  SELECT MIN(id) as id FROM (" +
                    "    SELECT MIN(id) FROM restaurant_tables " +
                    "    GROUP BY COALESCE(restaurant_id, 0), table_number" +
                    "  ) as keep_rows" +
                    ")"
                );
            } catch (Exception e) {
                log.warn("Could not clean duplicate entries: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to fix restaurant_tables constraints: {}", e.getMessage());
            throw e;
        }
    }

    private void fixCategoriesConstraints(Connection conn) throws Exception {
        log.info("Fixing categories unique constraints...");
        try (Statement stmt = conn.createStatement()) {
            String catalog = conn.getCatalog();
            DatabaseMetaData meta = conn.getMetaData();

            try (ResultSet constraints = meta.getIndexInfo(catalog, null, "categories", true, false)) {
                while (constraints.next()) {
                    String constraintName = constraints.getString("INDEX_NAME");
                    if (constraintName != null && !constraintName.equals("PRIMARY")
                            && !constraintName.equals("uk_category_name_per_restaurant")) {
                        log.warn("Dropping problematic category constraint: {}", constraintName);
                        try {
                            stmt.executeUpdate("ALTER TABLE categories DROP INDEX " + constraintName);
                        } catch (Exception e) {
                            log.warn("Could not drop category constraint {}: {}", constraintName, e.getMessage());
                        }
                    }
                }
            }

            boolean hasProperConstraint = false;
            try (ResultSet constraints = meta.getIndexInfo(catalog, null, "categories", true, false)) {
                while (constraints.next()) {
                    if ("uk_category_name_per_restaurant".equals(constraints.getString("INDEX_NAME"))) {
                        hasProperConstraint = true;
                        break;
                    }
                }
            }

            if (!hasProperConstraint) {
                log.info("Adding proper unique constraint on categories...");
                try {
                    stmt.executeUpdate("ALTER TABLE categories ADD UNIQUE KEY uk_category_name_per_restaurant (restaurant_id, name)");
                } catch (Exception e) {
                    if (!e.getMessage().contains("Duplicate entry")) {
                        log.warn("Could not add category unique constraint: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fix categories constraints: {}", e.getMessage());
            throw e;
        }
    }

    private void syncTenantModelSchema(Connection conn) throws Exception {
        log.info("Synchronizing tenant schema with entity models...");
        DatabaseMetaData meta = conn.getMetaData();

        // Tenant isolation columns required by Hibernate filters.
        addColumnIfMissing(conn, meta, "restaurant", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "staff", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "customers", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "categories", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "menu_items", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "restaurant_orders", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "order_items", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "restaurant_tables", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "payments", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "reviews", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "raw_materials", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "recipe_items", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "suppliers", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "purchase_invoices", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "invoice_items", "tenant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "financial_transactions", "tenant_id", "BIGINT");

        // Restaurant
        addColumnIfMissing(conn, meta, "restaurant", "owner_name", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "owner_email", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "owner_password", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "contact_number", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "logo_url", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "owner_photo_url", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "ui_theme", "VARCHAR(50)");
        addColumnIfMissing(conn, meta, "restaurant", "address", "TEXT");
        addColumnIfMissing(conn, meta, "restaurant", "gst_number", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant", "plan_type", "VARCHAR(50) NOT NULL DEFAULT 'STARTER'");
        addColumnIfMissing(conn, meta, "restaurant", "plan_expiry", "DATETIME");
        addColumnIfMissing(conn, meta, "restaurant", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");
        addColumnIfMissing(conn, meta, "restaurant", "tax_percentage", "DOUBLE DEFAULT 5.0");
        addColumnIfMissing(conn, meta, "restaurant", "service_charge", "DOUBLE DEFAULT 0.0");

        addColumnIfMissing(conn, meta, "staff", "password", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "staff", "photo_url", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "staff", "ui_theme", "VARCHAR(50)");
        addColumnIfMissing(conn, meta, "staff", "restaurant_id", "BIGINT");

        // Recipe Items (Ingredient mapping)
        if (!tableExists(conn, meta, "recipe_items")) {
            log.info("Creating 'recipe_items' table...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE recipe_items (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                        "menu_item_id BIGINT NOT NULL, " +
                        "raw_material_id BIGINT NOT NULL, " +
                        "quantity_required DOUBLE NOT NULL, " +
                        "unit VARCHAR(50), " +
                        "restaurant_id BIGINT, " +
                        "FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE, " +
                        "FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE" +
                        ")");
            }
        }

        // Categories
        addColumnIfMissing(conn, meta, "categories", "name", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "categories", "restaurant_id", "BIGINT");

        // Menu items
        addColumnIfMissing(conn, meta, "menu_items", "name", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "menu_items", "description", "TEXT");
        addColumnIfMissing(conn, meta, "menu_items", "price", "DOUBLE NOT NULL");
        addColumnIfMissing(conn, meta, "menu_items", "cost_price", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "menu_items", "stock_quantity", "INT NOT NULL DEFAULT 0");
        addColumnIfMissing(conn, meta, "menu_items", "category_id", "BIGINT");
        addColumnIfMissing(conn, meta, "menu_items", "image_url", "VARCHAR(500)");
        addColumnIfMissing(conn, meta, "menu_items", "is_available", "BOOLEAN NOT NULL DEFAULT TRUE");
        addColumnIfMissing(conn, meta, "menu_items", "is_veg", "BOOLEAN NOT NULL DEFAULT TRUE");
        addColumnIfMissing(conn, meta, "menu_items", "is_chef_special", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing(conn, meta, "menu_items", "is_best_seller", "BOOLEAN NOT NULL DEFAULT FALSE");
        addColumnIfMissing(conn, meta, "menu_items", "restaurant_id", "BIGINT");

        // Tables
        addColumnIfMissing(conn, meta, "restaurant_tables", "table_number", "INT NOT NULL");
        addColumnIfMissing(conn, meta, "restaurant_tables", "qr_code_url", "VARCHAR(500)");
        addColumnIfMissing(conn, meta, "restaurant_tables", "current_session_id", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant_tables", "restaurant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "restaurant_tables", "status", "VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'");
        addColumnIfMissing(conn, meta, "restaurant_tables", "qr_generated", "BOOLEAN NOT NULL DEFAULT FALSE");

        // Orders
        addColumnIfMissing(conn, meta, "restaurant_orders", "customer_id", "BIGINT");
        addColumnIfMissing(conn, meta, "restaurant_orders", "table_id", "BIGINT");
        addColumnIfMissing(conn, meta, "restaurant_orders", "session_id", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant_orders", "customer_name", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "restaurant_orders", "customer_phone", "VARCHAR(20)");
        addColumnIfMissing(conn, meta, "restaurant_orders", "status", "VARCHAR(50) NOT NULL");
        addColumnIfMissing(conn, meta, "restaurant_orders", "total_amount", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "restaurant_orders", "payment_status", "VARCHAR(50) NOT NULL DEFAULT 'UNPAID'");
        addColumnIfMissing(conn, meta, "restaurant_orders", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");
        addColumnIfMissing(conn, meta, "restaurant_orders", "rejection_reason", "TEXT");
        addColumnIfMissing(conn, meta, "restaurant_orders", "payment_method", "VARCHAR(50)");
        addColumnIfMissing(conn, meta, "restaurant_orders", "discount_amount", "DOUBLE DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "restaurant_orders", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        addColumnIfMissing(conn, meta, "restaurant_orders", "restaurant_id", "BIGINT");

        // Order items
        addColumnIfMissing(conn, meta, "order_items", "order_id", "BIGINT");
        addColumnIfMissing(conn, meta, "order_items", "menu_item_id", "BIGINT");
        addColumnIfMissing(conn, meta, "order_items", "quantity", "INT NOT NULL");
        addColumnIfMissing(conn, meta, "order_items", "price", "DOUBLE NOT NULL");
        addColumnIfMissing(conn, meta, "order_items", "restaurant_id", "BIGINT");

        // Payments
        addColumnIfMissing(conn, meta, "payments", "session_id", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "payments", "subtotal", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "payments", "tax_amount", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "payments", "service_charge", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "payments", "total_amount", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "payments", "payment_date", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        addColumnIfMissing(conn, meta, "payments", "payment_method", "VARCHAR(50)");
        addColumnIfMissing(conn, meta, "payments", "discount_amount", "DOUBLE DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "payments", "tax_details", "TEXT");
        addColumnIfMissing(conn, meta, "payments", "restaurant_id", "BIGINT");

        // Reviews
        addColumnIfMissing(conn, meta, "reviews", "session_id", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "reviews", "customer_name", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "reviews", "customer_phone", "VARCHAR(255)");
        addColumnIfMissing(conn, meta, "reviews", "table_id", "BIGINT NOT NULL");
        addColumnIfMissing(conn, meta, "reviews", "overall_rating", "INT NOT NULL");
        addColumnIfMissing(conn, meta, "reviews", "comment", "TEXT");
        addColumnIfMissing(conn, meta, "reviews", "item_ratings_json", "TEXT");
        addColumnIfMissing(conn, meta, "reviews", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        addColumnIfMissing(conn, meta, "reviews", "restaurant_id", "BIGINT");

        // Raw materials
        addColumnIfMissing(conn, meta, "raw_materials", "name", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "raw_materials", "quantity", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "raw_materials", "unit", "VARCHAR(50) NOT NULL");
        addColumnIfMissing(conn, meta, "raw_materials", "min_threshold", "DOUBLE");
        addColumnIfMissing(conn, meta, "raw_materials", "cost_per_unit", "DOUBLE DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "raw_materials", "restaurant_id", "BIGINT");

        // Daily usage logs
        addColumnIfMissing(conn, meta, "daily_usage_logs", "date", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "restaurant_id", "BIGINT");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "material_name", "VARCHAR(255) NOT NULL");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "used_quantity", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "remaining_quantity", "DOUBLE NOT NULL DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "daily_usage_logs", "unit", "VARCHAR(50) NOT NULL");

        // Customer loyalty
        addColumnIfMissing(conn, meta, "customers", "loyalty_points", "DOUBLE DEFAULT 0.0");
        addColumnIfMissing(conn, meta, "customers", "total_spend", "DOUBLE DEFAULT 0.0");

        // --- NEW PROFESSIONAL DASHBOARD & BANKING LAYER ---

        // Suppliers Table
        if (!tableExists(conn, meta, "suppliers")) {
            log.info("Creating 'suppliers' table...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE suppliers (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                        "name VARCHAR(255) NOT NULL, " +
                        "contact_person VARCHAR(255), " +
                        "phone VARCHAR(20), " +
                        "email VARCHAR(255), " +
                        "bank_details TEXT, " +
                        "restaurant_id BIGINT, " +
                        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                        ")");
            }
        }

        // Purchase Invoices Table
        if (!tableExists(conn, meta, "purchase_invoices")) {
            log.info("Creating 'purchase_invoices' table...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE purchase_invoices (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                        "invoice_number VARCHAR(100), " +
                        "supplier_id BIGINT, " +
                        "date DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                        "total_amount DOUBLE NOT NULL DEFAULT 0.0, " +
                        "tax_amount DOUBLE DEFAULT 0.0, " +
                        "status VARCHAR(50) DEFAULT 'PENDING', " + // PENDING, REVIEWED, REJECTED
                        "paid_status VARCHAR(50) DEFAULT 'UNPAID', " + // UNPAID, PARTIAL, PAID
                        "restaurant_id BIGINT, " +
                        "FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL" +
                        ")");
            }
        }

        // Invoice Items Table
        if (!tableExists(conn, meta, "invoice_items")) {
            log.info("Creating 'invoice_items' table...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE invoice_items (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                        "invoice_id BIGINT NOT NULL, " +
                        "raw_material_id BIGINT, " +
                        "quantity DOUBLE NOT NULL, " +
                        "unit_price DOUBLE NOT NULL, " +
                        "total_price DOUBLE NOT NULL, " +
                        "restaurant_id BIGINT, " +
                        "FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE, " +
                        "FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL" +
                        ")");
            }
        }

        // Financial Transactions Table
        if (!tableExists(conn, meta, "financial_transactions")) {
            log.info("Creating 'financial_transactions' table...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE financial_transactions (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                        "type VARCHAR(50) NOT NULL, " + // DEBIT, CREDIT
                        "category VARCHAR(50), " + // SUPPLIER, UTILITY, TAX, STAFF, OTHER
                        "amount DOUBLE NOT NULL, " +
                        "description TEXT, " +
                        "date DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                        "payment_method VARCHAR(50), " +
                        "restaurant_id BIGINT" +
                        ")");
            }
        }

        fixOrderItemsForeignKey(conn, meta);

        log.info("Tenant schema synchronization completed.");
    }

    private void fixOrderItemsForeignKey(Connection conn, DatabaseMetaData meta) throws Exception {
        if (!tableExists(conn, meta, "order_items") || !tableExists(conn, meta, "restaurant_orders")) {
            return;
        }

        log.info("Validating order_items.order_id foreign key target...");
        String catalog = conn.getCatalog();
        boolean hasCorrectConstraint = false;

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME " +
                     "FROM information_schema.KEY_COLUMN_USAGE " +
                     "WHERE TABLE_SCHEMA = '" + catalog + "' " +
                     "AND TABLE_NAME = 'order_items' " +
                     "AND COLUMN_NAME = 'order_id' " +
                     "AND REFERENCED_TABLE_NAME IS NOT NULL")) {
            while (rs.next()) {
                String constraintName = rs.getString("CONSTRAINT_NAME");
                String referencedTable = rs.getString("REFERENCED_TABLE_NAME");
                if ("restaurant_orders".equalsIgnoreCase(referencedTable)) {
                    hasCorrectConstraint = true;
                    continue;
                }

                log.warn("Dropping legacy FK {} on order_items.order_id referencing {}", constraintName, referencedTable);
                try {
                    stmt.executeUpdate("ALTER TABLE order_items DROP FOREIGN KEY `" + constraintName + "`");
                } catch (Exception e) {
                    log.warn("Unable to drop FK {}: {}", constraintName, e.getMessage());
                }
            }
        }

        if (!hasCorrectConstraint) {
            try (Statement stmt = conn.createStatement()) {
                // Remove orphan rows before adding a strict FK to the current orders table.
                stmt.executeUpdate(
                        "DELETE oi FROM order_items oi " +
                        "LEFT JOIN restaurant_orders ro ON ro.id = oi.order_id " +
                        "WHERE oi.order_id IS NOT NULL AND ro.id IS NULL");

                stmt.executeUpdate(
                        "ALTER TABLE order_items " +
                        "ADD CONSTRAINT fk_order_items_restaurant_orders " +
                        "FOREIGN KEY (order_id) REFERENCES restaurant_orders(id) ON DELETE CASCADE");
                log.info("Added FK fk_order_items_restaurant_orders on order_items(order_id) -> restaurant_orders(id)");
            } catch (Exception e) {
                if (!e.getMessage().contains("Duplicate") && !e.getMessage().contains("already exists")) {
                    log.warn("Unable to add order_items FK to restaurant_orders: {}", e.getMessage());
                }
            }
        }
    }

    private boolean tableExists(Connection conn, DatabaseMetaData meta, String tableName) throws Exception {
        String catalog = conn.getCatalog();
        try (ResultSet rs = meta.getTables(catalog, null, tableName, null)) {
            return rs.next();
        }
    }

    public void ensureMasterSchema() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS restaurant (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "owner_name VARCHAR(255), " +
                    "owner_email VARCHAR(255), " +
                    "owner_password VARCHAR(255), " +
                    "contact_number VARCHAR(255), " +
                    "logo_url VARCHAR(255), " +
                    "owner_photo_url VARCHAR(255), " +
                    "ui_theme VARCHAR(50), " +
                    "address TEXT, " +
                    "gst_number VARCHAR(255), " +
                    "plan_type VARCHAR(50) NOT NULL DEFAULT 'STARTER', " +
                    "plan_expiry DATETIME, " +
                    "is_active BOOLEAN NOT NULL DEFAULT TRUE, " +
                    "tax_percentage DOUBLE DEFAULT 5.0, " +
                    "service_charge DOUBLE DEFAULT 0.0" +
                    ")");

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS saas_settings (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "platform_name VARCHAR(255) DEFAULT 'Vitteno Technologies', " +
                    "premium_monthly_price DOUBLE DEFAULT 49.99, " +
                    "maintenance_mode BOOLEAN DEFAULT FALSE, " +
                    "free_plan_limit INT DEFAULT 10" +
                    ")");

                stmt.executeUpdate("CREATE TABLE IF NOT EXISTS staff (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "tenant_id BIGINT, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "role VARCHAR(50) NOT NULL, " +
                    "username VARCHAR(255) NOT NULL, " +
                    "phone VARCHAR(255) NOT NULL, " +
                    "password VARCHAR(255) NOT NULL, " +
                    "photo_url VARCHAR(255), " +
                    "ui_theme VARCHAR(50), " +
                    "restaurant_id BIGINT, " +
                    "UNIQUE KEY uk_staff_username_restaurant (username, restaurant_id)" +
                    ")");

            // Ensure all operational tables exist in single-database mode.
            String schemaSql = loadSchemaSql();
            String[] statements = schemaSql.split(";");
            for (String sql : statements) {
                String trimmed = sql.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                try {
                    stmt.execute(trimmed);
                } catch (Exception se) {
                    log.debug("Skipping schema statement during ensureMasterSchema: {}", se.getMessage());
                }
            }

            // Backfill columns for existing master schemas created before these fields existed.
            DatabaseMetaData meta = conn.getMetaData();
            addColumnIfMissing(conn, meta, "restaurant", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "restaurant", "owner_name", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "owner_email", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "owner_password", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "contact_number", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "logo_url", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "owner_photo_url", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "ui_theme", "VARCHAR(50)");
            addColumnIfMissing(conn, meta, "restaurant", "address", "TEXT");
            addColumnIfMissing(conn, meta, "restaurant", "gst_number", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "restaurant", "plan_type", "VARCHAR(50) NOT NULL DEFAULT 'STARTER'");
            addColumnIfMissing(conn, meta, "restaurant", "plan_expiry", "DATETIME");
            addColumnIfMissing(conn, meta, "restaurant", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");
            addColumnIfMissing(conn, meta, "restaurant", "tax_percentage", "DOUBLE DEFAULT 5.0");
            addColumnIfMissing(conn, meta, "restaurant", "service_charge", "DOUBLE DEFAULT 0.0");

            // Backfill tenant columns for shared single-database model.
            addColumnIfMissing(conn, meta, "staff", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "staff", "name", "VARCHAR(255) NOT NULL DEFAULT 'Staff'");
            addColumnIfMissing(conn, meta, "staff", "role", "VARCHAR(50) NOT NULL DEFAULT 'WAITER'");
            addColumnIfMissing(conn, meta, "staff", "username", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "staff", "phone", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "staff", "password", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "staff", "photo_url", "VARCHAR(255)");
            addColumnIfMissing(conn, meta, "staff", "ui_theme", "VARCHAR(50)");
            addColumnIfMissing(conn, meta, "staff", "restaurant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "customers", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "categories", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "menu_items", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "restaurant_orders", "tenant_id", "BIGINT");
            addColumnIfMissing(conn, meta, "order_items", "tenant_id", "BIGINT");

            // In single-database mode, also backfill operational table columns.
            syncTenantModelSchema(conn);
            
            // Fix any problematic unique constraints on restaurant_tables
            fixRestaurantTablesConstraints(conn);

            // Fix any problematic unique constraints on categories
            fixCategoriesConstraints(conn);
        } catch (Exception e) {
            throw new RuntimeException("Failed to ensure master schema tables exist", e);
        }
    }

    private void addColumnIfMissing(Connection conn, DatabaseMetaData meta, String tableName, String colName, String colDef) throws Exception {
        if (!tableExists(conn, meta, tableName)) {
            log.debug("Skipping column check for '{}.{}' because table does not exist yet.", tableName, colName);
            return;
        }

        String catalog = conn.getCatalog();
        try (ResultSet rs = meta.getColumns(catalog, null, tableName, colName)) {
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
        String masterUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/servesmart?" + dbParams;
        String tenantUrl = buildTenantJdbcUrl(dbName, false);
        
        log.info("Syncing restaurant record for tenant {} from master DB...", tenantId);
        
        try (Connection masterConn = DriverManager.getConnection(masterUrl, dbUser, dbPass);
             Connection tenantConn = DriverManager.getConnection(tenantUrl, dbUser, dbPass);
             Statement masterStmt = masterConn.createStatement();
             ResultSet rs = masterStmt.executeQuery("SELECT * FROM restaurant WHERE id = " + tenantId)) {
            
            if (rs.next()) {
                String sql = "INSERT INTO restaurant ("
                    + "id, name, owner_name, owner_email, owner_password, contact_number, logo_url, owner_photo_url, ui_theme, "
                    + "address, gst_number, plan_type, plan_expiry, is_active, tax_percentage, service_charge"
                    + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                    + "ON DUPLICATE KEY UPDATE "
                    + "name = VALUES(name), owner_name = VALUES(owner_name), owner_email = VALUES(owner_email), "
                    + "owner_password = VALUES(owner_password), contact_number = VALUES(contact_number), logo_url = VALUES(logo_url), owner_photo_url = VALUES(owner_photo_url), ui_theme = VALUES(ui_theme), "
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
                    ps.setString(8, rs.getString("owner_photo_url"));
                    ps.setString(9, rs.getString("ui_theme"));
                    ps.setString(10, rs.getString("address"));
                    ps.setString(11, rs.getString("gst_number"));
                    ps.setString(12, rs.getString("plan_type"));
                    ps.setTimestamp(13, rs.getTimestamp("plan_expiry"));
                    ps.setBoolean(14, rs.getBoolean("is_active"));
                    ps.setDouble(15, rs.getDouble("tax_percentage"));
                    ps.setDouble(16, rs.getDouble("service_charge"));
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

    public void seedTenantRestaurant(com.serversundaram.entity.Restaurant restaurant) {
        if (restaurant == null || restaurant.getId() == null) {
            throw new RuntimeException("Cannot seed tenant restaurant without a valid restaurant id");
        }

        String dbName = "ss_hotel_" + restaurant.getId();
        String sql = "INSERT INTO restaurant ("
            + "id, name, owner_name, owner_email, owner_password, contact_number, logo_url, owner_photo_url, ui_theme, "
            + "address, gst_number, plan_type, plan_expiry, is_active, tax_percentage, service_charge"
            + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE "
                + "name = VALUES(name), owner_name = VALUES(owner_name), owner_email = VALUES(owner_email), "
            + "owner_password = VALUES(owner_password), contact_number = VALUES(contact_number), logo_url = VALUES(logo_url), owner_photo_url = VALUES(owner_photo_url), ui_theme = VALUES(ui_theme), "
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
            ps.setString(8, restaurant.getOwnerPhotoUrl());
            ps.setString(9, restaurant.getUiTheme());
            ps.setString(10, restaurant.getAddress());
            ps.setString(11, restaurant.getGstNumber());
            ps.setString(12, restaurant.getPlanType());
            if (restaurant.getPlanExpiry() != null) {
                ps.setTimestamp(13, Timestamp.valueOf(restaurant.getPlanExpiry()));
            } else {
                ps.setTimestamp(13, null);
            }
            ps.setBoolean(14, restaurant.getIsActive() != null ? restaurant.getIsActive() : true);
            ps.setDouble(15, restaurant.getTaxPercentage() != null ? restaurant.getTaxPercentage() : 5.0);
            ps.setDouble(16, restaurant.getServiceCharge() != null ? restaurant.getServiceCharge() : 0.0);
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

    public void seedDefaultTables(Connection conn, String tenantId) {
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
