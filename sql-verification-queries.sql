-- ====================================================================
-- serversundaram Database Quick Verification Queries
-- ====================================================================
-- Copy and paste sections below into MySQL Workbench or mysql CLI
-- ====================================================================

-- ====================================================================
-- 1. MASTER DATABASE CHECKS
-- ====================================================================

-- Check all databases (should see servesmart and ss_hotel_* databases)
SHOW DATABASES;

-- Switch to master database
USE servesmart;

-- View all registered hotels
SELECT 
    id,
    name,
    owner_email,
    owner_name,
    plan_type,
    is_active,
    created_at
FROM restaurant
ORDER BY id DESC;

-- Count hotels by plan type
SELECT plan_type, COUNT(*) as count 
FROM restaurant 
GROUP BY plan_type;

-- Check all staff accounts
SELECT 
    s.id,
    s.username,
    s.name,
    s.role,
    s.restaurant_id,
    r.name as hotel_name
FROM staff s
LEFT JOIN restaurant r ON s.restaurant_id = r.id
ORDER BY s.restaurant_id, s.role;

-- Verify each hotel has exactly 3 staff accounts (OWNER, ADMIN, KITCHEN)
SELECT 
    restaurant_id,
    COUNT(*) as staff_count,
    GROUP_CONCAT(DISTINCT role) as roles
FROM staff
GROUP BY restaurant_id
ORDER BY restaurant_id DESC;

-- ====================================================================
-- 2. TENANT DATABASE CHECKS (Replace 'X' with actual hotel ID)
-- ====================================================================

-- Switch to tenant database (e.g., for hotel ID 5)
USE ss_hotel_5;

-- List all tables in tenant database
SHOW TABLES;

-- View restaurant info in tenant database
SELECT * FROM restaurant LIMIT 1;

-- ====================================================================
-- 3. ORDERS VERIFICATION
-- ====================================================================

-- Total orders for this hotel
SELECT COUNT(*) as total_orders FROM restaurant_order;

-- Orders with details (last 20)
SELECT 
    id,
    restaurant_id,
    status,
    total_amount,
    payment_method,
    created_at
FROM restaurant_order
ORDER BY created_at DESC
LIMIT 20;

-- Order count by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_revenue
FROM restaurant_order
GROUP BY status
ORDER BY count DESC;

-- ====================================================================
-- 4. ORDER ITEMS VERIFICATION
-- ====================================================================

-- Order items with menu details (last 30)
SELECT 
    oi.id,
    oi.order_id,
    mi.name as dish_name,
    oi.quantity,
    oi.price,
    (oi.quantity * oi.price) as item_total,
    ro.created_at
FROM order_item oi
LEFT JOIN menu_item mi ON oi.menu_item_id = mi.id
LEFT JOIN restaurant_order ro ON oi.order_id = ro.id
ORDER BY ro.created_at DESC
LIMIT 30;

-- ====================================================================
-- 5. PAYMENT VERIFICATION
-- ====================================================================

-- All payments
SELECT 
    id,
    order_id,
    amount,
    method,
    status,
    created_at
FROM payment
ORDER BY created_at DESC
LIMIT 20;

-- Payment summary
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total,
    AVG(amount) as average
FROM payment
GROUP BY status;

-- Revenue by payment method
SELECT 
    method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_transaction
FROM payment
WHERE status IN ('COMPLETED', 'PAID')
GROUP BY method
ORDER BY total_revenue DESC;

-- ====================================================================
-- 6. ANALYTICS: REVENUE ANALYSIS
-- ====================================================================

-- Daily revenue (last 30 days)
SELECT 
    DATE(p.created_at) as date,
    COUNT(DISTINCT p.order_id) as orders,
    SUM(p.amount) as daily_revenue,
    AVG(p.amount) as avg_order_value
FROM payment p
WHERE p.status IN ('COMPLETED', 'PAID')
    AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(p.created_at)
ORDER BY date DESC;

-- Weekly revenue
SELECT 
    YEAR(p.created_at) as year,
    WEEK(p.created_at) as week,
    COUNT(DISTINCT p.order_id) as orders,
    SUM(p.amount) as weekly_revenue
FROM payment p
WHERE p.status IN ('COMPLETED', 'PAID')
GROUP BY YEAR(p.created_at), WEEK(p.created_at)
ORDER BY year DESC, week DESC;

-- Today's revenue
SELECT 
    COUNT(DISTINCT p.order_id) as today_orders,
    SUM(p.amount) as today_revenue,
    AVG(p.amount) as avg_order_value
FROM payment p
WHERE p.status IN ('COMPLETED', 'PAID')
    AND DATE(p.created_at) = CURDATE();

-- ====================================================================
-- 7. ANALYTICS: PRODUCT ANALYSIS
-- ====================================================================

-- Top 10 dishes by quantity sold
SELECT 
    mi.name as dish_name,
    mi.category_id,
    SUM(oi.quantity) as qty_sold,
    SUM(oi.quantity * oi.price) as revenue,
    ROUND(SUM(oi.quantity * oi.price) / SUM(oi.quantity), 2) as avg_price
FROM order_item oi
JOIN menu_item mi ON oi.menu_item_id = mi.id
GROUP BY mi.id, mi.name, mi.category_id
ORDER BY qty_sold DESC
LIMIT 10;

-- Bottom 10 dishes (slow movers)
SELECT 
    mi.name as dish_name,
    SUM(oi.quantity) as qty_sold,
    SUM(oi.quantity * oi.price) as revenue
FROM order_item oi
JOIN menu_item mi ON oi.menu_item_id = mi.id
GROUP BY mi.id, mi.name
ORDER BY qty_sold ASC
LIMIT 10;

-- Revenue by category
SELECT 
    mc.name as category,
    COUNT(DISTINCT oi.order_id) as orders,
    SUM(oi.quantity) as items_sold,
    SUM(oi.quantity * oi.price) as revenue
FROM order_item oi
JOIN menu_item mi ON oi.menu_item_id = mi.id
LEFT JOIN menu_category mc ON mi.category_id = mc.id
GROUP BY mi.category_id, mc.name
ORDER BY revenue DESC;

-- ====================================================================
-- 8. ANALYTICS: TIME-BASED ANALYSIS
-- ====================================================================

-- Peak hours (busiest times)
SELECT 
    HOUR(ro.created_at) as hour_of_day,
    COUNT(*) as orders,
    SUM(ro.total_amount) as revenue
FROM restaurant_order ro
WHERE ro.status NOT IN ('CANCELLED')
GROUP BY HOUR(ro.created_at)
ORDER BY orders DESC;

-- Day of week analysis
SELECT 
    DAYNAME(ro.created_at) as day_of_week,
    COUNT(*) as orders,
    SUM(ro.total_amount) as revenue,
    AVG(ro.total_amount) as avg_order_value
FROM restaurant_order ro
WHERE ro.status NOT IN ('CANCELLED')
GROUP BY DAYOFWEEK(ro.created_at), DAYNAME(ro.created_at)
ORDER BY COUNT(*) DESC;

-- ====================================================================
-- 9. INVENTORY VERIFICATION
-- ====================================================================

-- Current inventory levels
SELECT 
    id,
    name,
    quantity,
    min_threshold,
    unit,
    CASE 
        WHEN quantity <= min_threshold THEN 'LOW STOCK âš ï¸'
        ELSE 'OK âœ…'
    END as status
FROM raw_material
ORDER BY quantity ASC;

-- Inventory usage logs
SELECT 
    material_name,
    DATE(date) as usage_date,
    SUM(used_quantity) as daily_usage,
    SUM(remaining_quantity) as final_stock
FROM daily_usage_log
GROUP BY material_name, DATE(date)
ORDER BY date DESC
LIMIT 30;

-- ====================================================================
-- 10. REVIEWS AND RATINGS
-- ====================================================================

-- Customer reviews summary
SELECT 
    rating,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM review), 1) as percentage
FROM review
GROUP BY rating
ORDER BY rating DESC;

-- Average rating and total reviews
SELECT 
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(*) as total_reviews,
    MIN(created_at) as first_review,
    MAX(created_at) as latest_review
FROM review;

-- Recent reviews
SELECT 
    id,
    rating,
    comment,
    created_at
FROM review
ORDER BY created_at DESC
LIMIT 10;

-- ====================================================================
-- 11. TABLES AND SEATING
-- ====================================================================

-- Table inventory and status
SELECT 
    id,
    table_number,
    capacity,
    status,
    COUNT(*) as count
FROM restaurant_table
GROUP BY id, table_number, capacity, status
ORDER BY table_number;

-- ====================================================================
-- 12. DATA INTEGRITY CHECKS
-- ====================================================================

-- Find orphaned orders (order items without menu items)
SELECT oi.id, oi.order_id, oi.menu_item_id
FROM order_item oi
LEFT JOIN menu_item mi ON oi.menu_item_id = mi.id
WHERE mi.id IS NULL;

-- Find orders without payments
SELECT 
    ro.id,
    ro.total_amount,
    COUNT(p.id) as payment_count
FROM restaurant_order ro
LEFT JOIN payment p ON ro.id = p.order_id
GROUP BY ro.id
HAVING payment_count = 0
LIMIT 10;

-- Find null values in critical fields
SELECT 
    'restaurant_order' as table_name,
    SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as null_id,
    SUM(CASE WHEN total_amount IS NULL THEN 1 ELSE 0 END) as null_amount,
    SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_status
FROM restaurant_order

UNION ALL

SELECT 
    'order_item' as table_name,
    SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as null_id,
    SUM(CASE WHEN quantity IS NULL THEN 1 ELSE 0 END) as null_qty,
    SUM(CASE WHEN price IS NULL THEN 1 ELSE 0 END) as null_price
FROM order_item

UNION ALL

SELECT 
    'payment' as table_name,
    SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as null_id,
    SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) as null_amount,
    SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_status
FROM payment;

-- ====================================================================
-- 13. DATABASE PERFORMANCE STATS
-- ====================================================================

-- Table row counts
SELECT 
    TABLE_NAME,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_ROWS DESC;

-- Database size
SELECT 
    ROUND((
        SELECT SUM(DATA_LENGTH + INDEX_LENGTH)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
    ) / 1024 / 1024, 2) as size_mb;

-- ====================================================================
-- 14. QUICK DASHBOARD STATS (All in One)
-- ====================================================================

SELECT 
    (SELECT COUNT(*) FROM restaurant_order) as total_orders,
    (SELECT COUNT(*) FROM restaurant_table) as total_tables,
    (SELECT COUNT(*) FROM menu_item) as total_menu_items,
    (SELECT SUM(total_amount) FROM restaurant_order) as total_revenue,
    (SELECT AVG(rating) FROM review) as avg_rating,
    (SELECT COUNT(*) FROM raw_material) as inventory_items,
    (SELECT SUM(quantity) FROM raw_material) as total_stock_value;

-- ====================================================================
-- End of Verification Queries
-- ====================================================================
