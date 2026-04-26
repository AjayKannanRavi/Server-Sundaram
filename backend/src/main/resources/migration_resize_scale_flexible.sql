-- Flexible Resize + Scale Migration (MySQL 8+)
-- Purpose:
-- 1) Resize columns for growth (emails, phones, URLs, payload text)
-- 2) Convert money/quantity from DOUBLE to DECIMAL for correctness at scale
-- 3) Add high-value indexes for tenant/restaurant/time/status query patterns
--
-- Safe usage:
-- - Run in staging first.
-- - Take backup before production execution.
-- - This script is idempotent for indexes via INFORMATION_SCHEMA checks.

SET @old_sql_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_resize_scale_flexible $$
CREATE PROCEDURE sp_resize_scale_flexible()
BEGIN
    -- =====================
    -- restaurant
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'restaurant') THEN
        ALTER TABLE restaurant
            MODIFY COLUMN name VARCHAR(300) NOT NULL,
            MODIFY COLUMN owner_name VARCHAR(255) NULL,
            MODIFY COLUMN owner_email VARCHAR(320) NULL,
            MODIFY COLUMN owner_password VARCHAR(512) NULL,
            MODIFY COLUMN contact_number VARCHAR(32) NULL,
            MODIFY COLUMN logo_url VARCHAR(1200) NULL,
            MODIFY COLUMN owner_photo_url VARCHAR(1200) NULL,
            MODIFY COLUMN ui_theme VARCHAR(80) NULL,
            MODIFY COLUMN address MEDIUMTEXT NULL,
            MODIFY COLUMN gst_number VARCHAR(64) NULL,
            MODIFY COLUMN plan_type VARCHAR(64) NOT NULL DEFAULT 'STARTER',
            MODIFY COLUMN tax_percentage DECIMAL(7,4) NULL DEFAULT 5.0000,
            MODIFY COLUMN service_charge DECIMAL(10,2) NULL DEFAULT 0.00;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant' AND index_name = 'idx_restaurant_plan_active') THEN
            CREATE INDEX idx_restaurant_plan_active ON restaurant(plan_type, is_active);
        END IF;
    END IF;

    -- =====================
    -- staff
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'staff') THEN
        ALTER TABLE staff
            MODIFY COLUMN name VARCHAR(255) NOT NULL,
            MODIFY COLUMN role VARCHAR(64) NOT NULL,
            MODIFY COLUMN username VARCHAR(191) NOT NULL,
            MODIFY COLUMN phone VARCHAR(32) NOT NULL,
            MODIFY COLUMN password VARCHAR(512) NOT NULL,
            MODIFY COLUMN photo_url VARCHAR(1200) NULL,
            MODIFY COLUMN ui_theme VARCHAR(80) NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'staff' AND index_name = 'idx_staff_restaurant_role') THEN
            CREATE INDEX idx_staff_restaurant_role ON staff(restaurant_id, role);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'staff' AND index_name = 'idx_staff_tenant_username') THEN
            CREATE INDEX idx_staff_tenant_username ON staff(tenant_id, username);
        END IF;
    END IF;

    -- =====================
    -- categories
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'categories') THEN
        ALTER TABLE categories
            MODIFY COLUMN name VARCHAR(191) NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'categories' AND index_name = 'idx_categories_tenant_name') THEN
            CREATE INDEX idx_categories_tenant_name ON categories(tenant_id, name);
        END IF;
    END IF;

    -- =====================
    -- menu_items
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'menu_items') THEN
        ALTER TABLE menu_items
            MODIFY COLUMN name VARCHAR(255) NOT NULL,
            MODIFY COLUMN description MEDIUMTEXT NULL,
            MODIFY COLUMN price DECIMAL(13,2) NOT NULL,
            MODIFY COLUMN cost_price DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN stock_quantity INT NOT NULL DEFAULT 0,
            MODIFY COLUMN image_url VARCHAR(1200) NULL,
            MODIFY COLUMN is_veg BOOLEAN NOT NULL DEFAULT TRUE;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'menu_items' AND index_name = 'idx_menu_restaurant_category') THEN
            CREATE INDEX idx_menu_restaurant_category ON menu_items(restaurant_id, category_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'menu_items' AND index_name = 'idx_menu_tenant_available') THEN
            CREATE INDEX idx_menu_tenant_available ON menu_items(tenant_id, available);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'menu_items' AND index_name = 'idx_menu_restaurant_veg') THEN
            CREATE INDEX idx_menu_restaurant_veg ON menu_items(restaurant_id, is_veg);
        END IF;
    END IF;

    -- =====================
    -- restaurant_tables
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'restaurant_tables') THEN
        ALTER TABLE restaurant_tables
            MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
            MODIFY COLUMN current_session_id VARCHAR(255) NULL,
            MODIFY COLUMN qr_code_url VARCHAR(1200) NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_tables' AND index_name = 'idx_tables_restaurant_status') THEN
            CREATE INDEX idx_tables_restaurant_status ON restaurant_tables(restaurant_id, status);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_tables' AND index_name = 'idx_tables_restaurant_session') THEN
            CREATE INDEX idx_tables_restaurant_session ON restaurant_tables(restaurant_id, current_session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_tables' AND index_name = 'idx_tables_tenant_table_number') THEN
            CREATE INDEX idx_tables_tenant_table_number ON restaurant_tables(tenant_id, table_number);
        END IF;
    END IF;

    -- =====================
    -- restaurant_orders
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders') THEN
        ALTER TABLE restaurant_orders
            MODIFY COLUMN session_id VARCHAR(255) NULL,
            MODIFY COLUMN customer_name VARCHAR(255) NULL,
            MODIFY COLUMN customer_phone VARCHAR(32) NULL,
            MODIFY COLUMN status VARCHAR(64) NOT NULL,
            MODIFY COLUMN total_amount DECIMAL(13,2) NOT NULL,
            MODIFY COLUMN payment_status VARCHAR(64) NOT NULL DEFAULT 'UNPAID',
            MODIFY COLUMN payment_method VARCHAR(64) NULL,
            MODIFY COLUMN rejection_reason MEDIUMTEXT NULL,
            MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND column_name = 'discount_amount') THEN
            ALTER TABLE restaurant_orders MODIFY COLUMN discount_amount DECIMAL(13,2) NULL DEFAULT 0.00;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_restaurant_created') THEN
            CREATE INDEX idx_orders_restaurant_created ON restaurant_orders(restaurant_id, created_at);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_restaurant_payment_created') THEN
            CREATE INDEX idx_orders_restaurant_payment_created ON restaurant_orders(restaurant_id, payment_status, created_at);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_restaurant_status_created') THEN
            CREATE INDEX idx_orders_restaurant_status_created ON restaurant_orders(restaurant_id, status, created_at);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_table_active') THEN
            CREATE INDEX idx_orders_table_active ON restaurant_orders(table_id, is_active);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_session_restaurant') THEN
            CREATE INDEX idx_orders_session_restaurant ON restaurant_orders(session_id, restaurant_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'restaurant_orders' AND index_name = 'idx_orders_tenant_created') THEN
            CREATE INDEX idx_orders_tenant_created ON restaurant_orders(tenant_id, created_at);
        END IF;
    END IF;

    -- Backward compatibility table if present in any environment.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_legacy_restaurant_payment_created') THEN
            CREATE INDEX idx_orders_legacy_restaurant_payment_created ON orders(restaurant_id, payment_status, created_at);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_legacy_table_active') THEN
            CREATE INDEX idx_orders_legacy_table_active ON orders(table_id, is_active);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_legacy_session_restaurant') THEN
            CREATE INDEX idx_orders_legacy_session_restaurant ON orders(session_id, restaurant_id);
        END IF;
    END IF;

    -- =====================
    -- order_items
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'order_items') THEN
        ALTER TABLE order_items
            MODIFY COLUMN quantity INT NOT NULL,
            MODIFY COLUMN price DECIMAL(13,2) NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_order') THEN
            CREATE INDEX idx_order_items_order ON order_items(order_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_menu') THEN
            CREATE INDEX idx_order_items_menu ON order_items(menu_item_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_restaurant') THEN
            CREATE INDEX idx_order_items_restaurant ON order_items(restaurant_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_tenant') THEN
            CREATE INDEX idx_order_items_tenant ON order_items(tenant_id);
        END IF;
    END IF;

    -- =====================
    -- payments
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payments') THEN
        ALTER TABLE payments
            MODIFY COLUMN session_id VARCHAR(255) NULL,
            MODIFY COLUMN subtotal DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN tax_amount DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN service_charge DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN total_amount DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN payment_method VARCHAR(64) NULL,
            MODIFY COLUMN payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'discount_amount') THEN
            ALTER TABLE payments MODIFY COLUMN discount_amount DECIMAL(13,2) NULL DEFAULT 0.00;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'tax_details') THEN
            ALTER TABLE payments MODIFY COLUMN tax_details MEDIUMTEXT NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_restaurant_date') THEN
            CREATE INDEX idx_payments_restaurant_date ON payments(restaurant_id, payment_date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_session') THEN
            CREATE INDEX idx_payments_session ON payments(session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_method_date') THEN
            CREATE INDEX idx_payments_method_date ON payments(payment_method, payment_date);
        END IF;
    END IF;

    -- =====================
    -- reviews
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reviews') THEN
        ALTER TABLE reviews
            MODIFY COLUMN session_id VARCHAR(255) NOT NULL,
            MODIFY COLUMN customer_name VARCHAR(255) NULL,
            MODIFY COLUMN customer_phone VARCHAR(32) NULL,
            MODIFY COLUMN item_ratings_json LONGTEXT NULL,
            MODIFY COLUMN comment MEDIUMTEXT NULL,
            MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_restaurant_created') THEN
            CREATE INDEX idx_reviews_restaurant_created ON reviews(restaurant_id, created_at);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_session_restaurant') THEN
            CREATE INDEX idx_reviews_session_restaurant ON reviews(session_id, restaurant_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_restaurant_rating') THEN
            CREATE INDEX idx_reviews_restaurant_rating ON reviews(restaurant_id, overall_rating);
        END IF;
    END IF;

    -- =====================
    -- customers
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'customers') THEN
        ALTER TABLE customers
            MODIFY COLUMN name VARCHAR(255) NULL,
            MODIFY COLUMN mobile_number VARCHAR(32) NOT NULL,
            MODIFY COLUMN current_otp VARCHAR(12) NULL,
            MODIFY COLUMN last_table_used VARCHAR(64) NULL;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'customers' AND column_name = 'loyalty_points') THEN
            ALTER TABLE customers MODIFY COLUMN loyalty_points DECIMAL(13,2) NULL DEFAULT 0.00;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'customers' AND column_name = 'total_spend') THEN
            ALTER TABLE customers MODIFY COLUMN total_spend DECIMAL(13,2) NULL DEFAULT 0.00;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'customers' AND index_name = 'idx_customers_restaurant_last_visited') THEN
            CREATE INDEX idx_customers_restaurant_last_visited ON customers(restaurant_id, last_visited_date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'customers' AND index_name = 'idx_customers_restaurant_name') THEN
            CREATE INDEX idx_customers_restaurant_name ON customers(restaurant_id, name);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'customers' AND index_name = 'idx_customers_tenant_mobile') THEN
            CREATE INDEX idx_customers_tenant_mobile ON customers(tenant_id, mobile_number);
        END IF;
    END IF;

    -- =====================
    -- raw_materials
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'raw_materials') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'raw_materials' AND column_name = 'tenant_id') THEN
            ALTER TABLE raw_materials ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE raw_materials
            MODIFY COLUMN name VARCHAR(255) NOT NULL,
            MODIFY COLUMN quantity DECIMAL(13,3) NOT NULL,
            MODIFY COLUMN unit VARCHAR(32) NULL,
            MODIFY COLUMN min_threshold DECIMAL(13,3) NULL;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'raw_materials' AND column_name = 'cost_per_unit') THEN
            ALTER TABLE raw_materials MODIFY COLUMN cost_per_unit DECIMAL(13,2) NULL DEFAULT 0.00;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'raw_materials' AND index_name = 'idx_raw_materials_restaurant_name') THEN
            CREATE INDEX idx_raw_materials_restaurant_name ON raw_materials(restaurant_id, name);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'raw_materials' AND index_name = 'idx_raw_materials_restaurant_threshold') THEN
            CREATE INDEX idx_raw_materials_restaurant_threshold ON raw_materials(restaurant_id, min_threshold);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'raw_materials' AND index_name = 'idx_raw_materials_tenant') THEN
            CREATE INDEX idx_raw_materials_tenant ON raw_materials(tenant_id);
        END IF;
    END IF;

    -- =====================
    -- daily_usage_logs
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'daily_usage_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'daily_usage_logs' AND column_name = 'tenant_id') THEN
            ALTER TABLE daily_usage_logs ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE daily_usage_logs
            MODIFY COLUMN material_name VARCHAR(255) NOT NULL,
            MODIFY COLUMN used_quantity DECIMAL(13,3) NOT NULL,
            MODIFY COLUMN remaining_quantity DECIMAL(13,3) NOT NULL,
            MODIFY COLUMN unit VARCHAR(32) NULL,
            MODIFY COLUMN date DATETIME NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'daily_usage_logs' AND index_name = 'idx_daily_usage_restaurant_date') THEN
            CREATE INDEX idx_daily_usage_restaurant_date ON daily_usage_logs(restaurant_id, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'daily_usage_logs' AND index_name = 'idx_daily_usage_material_date') THEN
            CREATE INDEX idx_daily_usage_material_date ON daily_usage_logs(restaurant_id, material_name, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'daily_usage_logs' AND index_name = 'idx_daily_usage_tenant_date') THEN
            CREATE INDEX idx_daily_usage_tenant_date ON daily_usage_logs(tenant_id, date);
        END IF;
    END IF;

    -- =====================
    -- suppliers
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'suppliers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'suppliers' AND column_name = 'tenant_id') THEN
            ALTER TABLE suppliers ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE suppliers
            MODIFY COLUMN name VARCHAR(255) NOT NULL,
            MODIFY COLUMN contact_person VARCHAR(255) NULL,
            MODIFY COLUMN phone VARCHAR(32) NULL,
            MODIFY COLUMN email VARCHAR(320) NULL,
            MODIFY COLUMN bank_details MEDIUMTEXT NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'suppliers' AND index_name = 'idx_suppliers_restaurant_name') THEN
            CREATE INDEX idx_suppliers_restaurant_name ON suppliers(restaurant_id, name);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'suppliers' AND index_name = 'idx_suppliers_restaurant_email') THEN
            CREATE INDEX idx_suppliers_restaurant_email ON suppliers(restaurant_id, email);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'suppliers' AND index_name = 'idx_suppliers_tenant_name') THEN
            CREATE INDEX idx_suppliers_tenant_name ON suppliers(tenant_id, name);
        END IF;
    END IF;

    -- =====================
    -- purchase_invoices
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND column_name = 'tenant_id') THEN
            ALTER TABLE purchase_invoices ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE purchase_invoices
            MODIFY COLUMN invoice_number VARCHAR(128) NULL,
            MODIFY COLUMN date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY COLUMN total_amount DECIMAL(13,2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN tax_amount DECIMAL(13,2) NULL DEFAULT 0.00,
            MODIFY COLUMN status VARCHAR(32) NULL DEFAULT 'PENDING',
            MODIFY COLUMN paid_status VARCHAR(32) NULL DEFAULT 'UNPAID';

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND index_name = 'idx_purchase_invoices_restaurant_date') THEN
            CREATE INDEX idx_purchase_invoices_restaurant_date ON purchase_invoices(restaurant_id, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND index_name = 'idx_purchase_invoices_restaurant_status_date') THEN
            CREATE INDEX idx_purchase_invoices_restaurant_status_date ON purchase_invoices(restaurant_id, status, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND index_name = 'idx_purchase_invoices_supplier_date') THEN
            CREATE INDEX idx_purchase_invoices_supplier_date ON purchase_invoices(supplier_id, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND index_name = 'idx_purchase_invoices_restaurant_number') THEN
            CREATE INDEX idx_purchase_invoices_restaurant_number ON purchase_invoices(restaurant_id, invoice_number);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_invoices' AND index_name = 'idx_purchase_invoices_tenant_date') THEN
            CREATE INDEX idx_purchase_invoices_tenant_date ON purchase_invoices(tenant_id, date);
        END IF;
    END IF;

    -- =====================
    -- invoice_items
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'invoice_items') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'invoice_items' AND column_name = 'tenant_id') THEN
            ALTER TABLE invoice_items ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE invoice_items
            MODIFY COLUMN quantity DECIMAL(13,3) NOT NULL,
            MODIFY COLUMN unit_price DECIMAL(13,2) NOT NULL,
            MODIFY COLUMN total_price DECIMAL(13,2) NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'invoice_items' AND index_name = 'idx_invoice_items_invoice') THEN
            CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'invoice_items' AND index_name = 'idx_invoice_items_raw_material') THEN
            CREATE INDEX idx_invoice_items_raw_material ON invoice_items(raw_material_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'invoice_items' AND index_name = 'idx_invoice_items_tenant') THEN
            CREATE INDEX idx_invoice_items_tenant ON invoice_items(tenant_id);
        END IF;
    END IF;

    -- =====================
    -- financial_transactions
    -- =====================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'financial_transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'financial_transactions' AND column_name = 'tenant_id') THEN
            ALTER TABLE financial_transactions ADD COLUMN tenant_id BIGINT NULL;
        END IF;

        ALTER TABLE financial_transactions
            MODIFY COLUMN type VARCHAR(64) NOT NULL,
            MODIFY COLUMN category VARCHAR(64) NULL,
            MODIFY COLUMN amount DECIMAL(13,2) NOT NULL,
            MODIFY COLUMN description MEDIUMTEXT NULL,
            MODIFY COLUMN date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'financial_transactions' AND index_name = 'idx_financial_restaurant_date') THEN
            CREATE INDEX idx_financial_restaurant_date ON financial_transactions(restaurant_id, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'financial_transactions' AND index_name = 'idx_financial_restaurant_type_date') THEN
            CREATE INDEX idx_financial_restaurant_type_date ON financial_transactions(restaurant_id, type, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'financial_transactions' AND index_name = 'idx_financial_restaurant_category_date') THEN
            CREATE INDEX idx_financial_restaurant_category_date ON financial_transactions(restaurant_id, category, date);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'financial_transactions' AND index_name = 'idx_financial_tenant_date') THEN
            CREATE INDEX idx_financial_tenant_date ON financial_transactions(tenant_id, date);
        END IF;
    END IF;

END $$

CALL sp_resize_scale_flexible() $$
DROP PROCEDURE sp_resize_scale_flexible $$

DELIMITER ;

SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
