-- Verify Restaurant Table Structure
SELECT * FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'servesmart' 
AND TABLE_NAME = 'restaurant'
ORDER BY ORDINAL_POSITION;

-- Check current restaurant data
SELECT * FROM servesmart.restaurant;

-- Check restaurant history/audit if exists
SELECT * FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'servesmart' 
AND TABLE_NAME LIKE '%restaurant%';
