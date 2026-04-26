-- Post-migration tenant and endpoint flow integrity checks
-- Run this after migration_resize_scale_flexible.sql

-- 1) Tenant consistency checks (rows where tenant_id diverges from restaurant_id)
SELECT 'staff' AS table_name, COUNT(*) AS mismatch_count
FROM staff
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id
UNION ALL
SELECT 'restaurant_orders', COUNT(*) FROM restaurant_orders
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
WHERE tenant_id IS NOT NULL AND restaurant_id IS NOT NULL AND tenant_id <> restaurant_id;

-- 2) Orphan checks (critical endpoint flow correctness)
SELECT 'restaurant_orders missing table' AS check_name, COUNT(*) AS issue_count
FROM restaurant_orders o
LEFT JOIN restaurant_tables t ON t.id = o.table_id
WHERE o.table_id IS NOT NULL AND t.id IS NULL
UNION ALL
SELECT 'restaurant_orders missing restaurant', COUNT(*)
FROM restaurant_orders o
LEFT JOIN restaurant r ON r.id = o.restaurant_id
WHERE o.restaurant_id IS NOT NULL AND r.id IS NULL
UNION ALL
SELECT 'order_items missing order', COUNT(*)
FROM order_items oi
LEFT JOIN restaurant_orders o ON o.id = oi.order_id
WHERE oi.order_id IS NOT NULL AND o.id IS NULL
UNION ALL
SELECT 'order_items missing menu_item', COUNT(*)
FROM order_items oi
LEFT JOIN menu_items m ON m.id = oi.menu_item_id
WHERE oi.menu_item_id IS NOT NULL AND m.id IS NULL;

-- 3) Session flow checks
SELECT 'orders with null session_id while active' AS check_name, COUNT(*) AS issue_count
FROM restaurant_orders
WHERE is_active = 1 AND session_id IS NULL;

-- 4) Duplicate customer identity checks per restaurant
SELECT restaurant_id, mobile_number, COUNT(*) AS duplicate_count
FROM customers
GROUP BY restaurant_id, mobile_number
HAVING COUNT(*) > 1;

-- 5) Validate endpoint-hot indexes exist
SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columns_in_index
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND index_name IN (
    'idx_orders_restaurant_created',
    'idx_orders_restaurant_payment_created',
    'idx_orders_restaurant_status_created',
    'idx_orders_table_active',
    'idx_orders_session_restaurant',
    'idx_menu_restaurant_category',
    'idx_payments_restaurant_date',
    'idx_reviews_session_restaurant',
    'idx_customers_tenant_mobile'
  )
GROUP BY table_name, index_name
ORDER BY table_name, index_name;
