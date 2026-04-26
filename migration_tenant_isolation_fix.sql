-- ============================================
-- TENANT ISOLATION FIX - MIGRATION SQL
-- ============================================
-- This migration adds tenant_id column to all tables missing multi-tenant support
-- Date: April 18, 2026
-- Purpose: Ensure complete tenant isolation across all entities

USE servesmart;

-- ============================================
-- STEP 1: ADD TENANT_ID COLUMN TO MISSING TABLES
-- ============================================

-- 1. raw_materials table
ALTER TABLE raw_materials 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

-- Create index for performance
CREATE INDEX idx_raw_materials_tenant_id ON raw_materials(tenant_id);

-- 2. suppliers table
ALTER TABLE suppliers 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);

-- 3. purchase_invoices table
ALTER TABLE purchase_invoices 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_purchase_invoices_tenant_id ON purchase_invoices(tenant_id);

-- 4. invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_invoice_items_tenant_id ON invoice_items(tenant_id);

-- 5. reviews table
ALTER TABLE reviews 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_reviews_tenant_id ON reviews(tenant_id);

-- 6. recipe_items table
ALTER TABLE recipe_items 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_recipe_items_tenant_id ON recipe_items(tenant_id);

-- 7. daily_usage_logs table
ALTER TABLE daily_usage_logs 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_daily_usage_logs_tenant_id ON daily_usage_logs(tenant_id);

-- 8. financial_transactions table
ALTER TABLE financial_transactions 
ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_financial_transactions_tenant_id ON financial_transactions(tenant_id);

-- ============================================
-- STEP 2: BACKFILL TENANT_ID WITH CORRECT VALUES
-- ============================================

-- Update raw_materials: get tenant_id from restaurant
UPDATE raw_materials rm
SET rm.tenant_id = (
    SELECT r.tenant_id FROM restaurant r 
    WHERE r.id = rm.restaurant_id
)
WHERE rm.restaurant_id IS NOT NULL;

-- Update suppliers: get tenant_id from restaurant
UPDATE suppliers s
SET s.tenant_id = (
    SELECT r.tenant_id FROM restaurant r 
    WHERE r.id = s.restaurant_id
)
WHERE s.restaurant_id IS NOT NULL;

-- Update purchase_invoices: get tenant_id from restaurant
UPDATE purchase_invoices pi
SET pi.tenant_id = (
    SELECT r.tenant_id FROM restaurant r 
    WHERE r.id = pi.restaurant_id
)
WHERE pi.restaurant_id IS NOT NULL;

-- Update invoice_items: get tenant_id from purchase_invoice
UPDATE invoice_items ii
SET ii.tenant_id = (
    SELECT pi.tenant_id FROM purchase_invoices pi 
    WHERE pi.id = ii.invoice_id
)
WHERE ii.invoice_id IS NOT NULL;

-- Update reviews: get tenant_id from restaurant
UPDATE reviews r
SET r.tenant_id = (
    SELECT res.tenant_id FROM restaurant res 
    WHERE res.id = r.restaurant_id
)
WHERE r.restaurant_id IS NOT NULL;

-- Update recipe_items: get tenant_id from menu_item
UPDATE recipe_items ri
SET ri.tenant_id = (
    SELECT mi.tenant_id FROM menu_items mi 
    WHERE mi.id = ri.menu_item_id
)
WHERE ri.menu_item_id IS NOT NULL;

-- Update daily_usage_logs: get tenant_id from restaurant
UPDATE daily_usage_logs dul
SET dul.tenant_id = (
    SELECT r.tenant_id FROM restaurant r 
    WHERE r.id = dul.restaurant_id
)
WHERE dul.restaurant_id IS NOT NULL;

-- Update financial_transactions: get tenant_id from restaurant
UPDATE financial_transactions ft
SET ft.tenant_id = (
    SELECT r.tenant_id FROM restaurant r 
    WHERE r.id = ft.restaurant_id
)
WHERE ft.restaurant_id IS NOT NULL;

-- ============================================
-- STEP 3: VERIFY BACKFILL SUCCESS
-- ============================================

-- Check raw_materials
SELECT COUNT(DISTINCT tenant_id) as raw_materials_tenants, 
       COUNT(*) as total_records 
FROM raw_materials;

-- Check suppliers
SELECT COUNT(DISTINCT tenant_id) as suppliers_tenants, 
       COUNT(*) as total_records 
FROM suppliers;

-- Check purchase_invoices
SELECT COUNT(DISTINCT tenant_id) as purchase_invoices_tenants, 
       COUNT(*) as total_records 
FROM purchase_invoices;

-- Check invoice_items
SELECT COUNT(DISTINCT tenant_id) as invoice_items_tenants, 
       COUNT(*) as total_records 
FROM invoice_items;

-- Check reviews
SELECT COUNT(DISTINCT tenant_id) as reviews_tenants, 
       COUNT(*) as total_records 
FROM reviews;

-- Check recipe_items
SELECT COUNT(DISTINCT tenant_id) as recipe_items_tenants, 
       COUNT(*) as total_records 
FROM recipe_items;

-- Check daily_usage_logs
SELECT COUNT(DISTINCT tenant_id) as daily_usage_logs_tenants, 
       COUNT(*) as total_records 
FROM daily_usage_logs;

-- Check financial_transactions
SELECT COUNT(DISTINCT tenant_id) as financial_transactions_tenants, 
       COUNT(*) as total_records 
FROM financial_transactions;

-- ============================================
-- STEP 4: SUMMARY REPORT
-- ============================================

SELECT 'raw_materials' as table_name, COUNT(*) as total_records, 
       COUNT(DISTINCT tenant_id) as unique_tenants 
FROM raw_materials
UNION ALL
SELECT 'suppliers', COUNT(*), COUNT(DISTINCT tenant_id) FROM suppliers
UNION ALL
SELECT 'purchase_invoices', COUNT(*), COUNT(DISTINCT tenant_id) FROM purchase_invoices
UNION ALL
SELECT 'invoice_items', COUNT(*), COUNT(DISTINCT tenant_id) FROM invoice_items
UNION ALL
SELECT 'reviews', COUNT(*), COUNT(DISTINCT tenant_id) FROM reviews
UNION ALL
SELECT 'recipe_items', COUNT(*), COUNT(DISTINCT tenant_id) FROM recipe_items
UNION ALL
SELECT 'daily_usage_logs', COUNT(*), COUNT(DISTINCT tenant_id) FROM daily_usage_logs
UNION ALL
SELECT 'financial_transactions', COUNT(*), COUNT(DISTINCT tenant_id) FROM financial_transactions
ORDER BY table_name;

-- ============================================
-- EXECUTION NOTES
-- ============================================
/*
To execute this migration:
1. Connect to MySQL as root or admin user
2. Paste this entire script into MySQL Workbench
3. Execute all statements
4. Verify "Execution successful" message
5. Run verification queries to confirm tenant_id populated correctly

ROLLBACK (if needed):
ALTER TABLE raw_materials DROP COLUMN tenant_id;
ALTER TABLE suppliers DROP COLUMN tenant_id;
ALTER TABLE purchase_invoices DROP COLUMN tenant_id;
ALTER TABLE invoice_items DROP COLUMN tenant_id;
ALTER TABLE reviews DROP COLUMN tenant_id;
ALTER TABLE recipe_items DROP COLUMN tenant_id;
ALTER TABLE daily_usage_logs DROP COLUMN tenant_id;
ALTER TABLE financial_transactions DROP COLUMN tenant_id;

*/
