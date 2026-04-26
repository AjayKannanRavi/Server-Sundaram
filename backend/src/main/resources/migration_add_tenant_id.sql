-- Migration script: Consolidate per-tenant databases into single database with explicit tenant_id
-- This script adds tenant_id column to all tables and migrates data from ss_hotel_* databases

-- Step 1: Add tenant_id column to all tables (if not exists)
-- This allows us to identify which tenant each row belongs to

ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE daily_usage_logs ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS tenant_id BIGINT AFTER id;

-- Step 2: Populate tenant_id from restaurant_id for existing records
-- For each table, set tenant_id equal to the restaurant_id value
UPDATE restaurant SET tenant_id = COALESCE(id) WHERE tenant_id IS NULL;
UPDATE staff SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE categories SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE menu_items SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE restaurant_tables SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE restaurant_orders SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE order_items SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE payments SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE reviews SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE customers SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE raw_materials SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE daily_usage_logs SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE suppliers SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE purchase_invoices SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE invoice_items SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;
UPDATE financial_transactions SET tenant_id = COALESCE(restaurant_id) WHERE tenant_id IS NULL;

-- Step 3: Create indexes on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tenant_id ON restaurant(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_tenant_id ON restaurant_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_tenant_id ON restaurant_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_tenant_id ON raw_materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_logs_tenant_id ON daily_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON purchase_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_id ON invoice_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON financial_transactions(tenant_id);

-- Step 4: Migration from per-tenant databases
-- NOTE: This part requires executing separate queries to migrate data from ss_hotel_* databases
-- The following is a template that should be run for each tenant that had a separate database
-- Replace {TENANT_ID} with the actual tenant ID

-- Example: For tenant 1
-- INSERT INTO servesmart.restaurant SELECT * FROM ss_hotel_1.restaurant WHERE id = {TENANT_ID};
-- INSERT INTO servesmart.staff SELECT * FROM ss_hotel_1.staff WHERE restaurant_id = {TENANT_ID};
-- ... and so on for all tables

-- After migration completes, drop the per-tenant databases:
-- DROP DATABASE IF EXISTS ss_hotel_1;
-- DROP DATABASE IF EXISTS ss_hotel_5;
-- ... and any other ss_hotel_* databases

-- Step 5: Enforce NOT NULL constraint on tenant_id after backfill
ALTER TABLE restaurant MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE staff MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE categories MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE menu_items MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE restaurant_tables MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE restaurant_orders MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE order_items MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE payments MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE reviews MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE customers MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE raw_materials MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE daily_usage_logs MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE suppliers MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE purchase_invoices MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE invoice_items MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE financial_transactions MODIFY COLUMN tenant_id BIGINT NOT NULL;
