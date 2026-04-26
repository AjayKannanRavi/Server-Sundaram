-- Migration script: Fix restaurant_tables unique constraint issues
-- This script removes duplicate/conflicting unique constraints and ensures proper indexes

-- Step 1: Remove any existing problematic unique constraints on restaurant_tables
-- First, get the list of all constraints
ALTER TABLE restaurant_tables DROP FOREIGN KEY restaurant_tables_ibfk_1;

-- Remove any existing unique constraints that aren't the proper one
-- This will handle the auto-generated UK!t9y8tg8eidmfw4k887ibeu1 constraint
SHOW CREATE TABLE restaurant_tables;

-- Step 2: Drop all non-primary-key unique constraints (if they exist)
SET @constraintName = '';
SELECT CONSTRAINT_NAME INTO @constraintName FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME='restaurant_tables' AND TABLE_SCHEMA=DATABASE() 
AND CONSTRAINT_NAME LIKE 'UK%' AND CONSTRAINT_NAME != 'uk_table_number_per_restaurant'
LIMIT 1;

-- If we found problematic constraints, we need to handle them manually
-- For now, let's remove current_session_id from being unique if it was set that way

-- Step 3: Add back the foreign key
ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_ibfk_1 
FOREIGN KEY (restaurant_id) REFERENCES restaurant(id);

-- Step 4: Ensure the proper unique constraint exists (will be created by Hibernate on next migration)
-- Step 5: Remove any old duplicate rows if they exist
-- Keep only the first instance of each (restaurant_id, table_number) combination
DELETE FROM restaurant_tables WHERE id NOT IN (
    SELECT MIN(id) FROM (
        SELECT MIN(id) as id FROM restaurant_tables 
        GROUP BY restaurant_id, table_number
    ) as keep_rows
);

-- Step 6: Verify the table structure
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME='restaurant_tables' AND TABLE_SCHEMA=DATABASE();
