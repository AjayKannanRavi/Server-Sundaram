@echo off
REM Database Quick Verification Script for Windows Command Prompt
REM Usage: verify-database.bat

setlocal enabledelayedexpansion

REM Configuration
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=Ajay@111
set DB_NAME_MASTER=servesmart

:mainmenu
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   serversundaram Database Verification Tool
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
echo 1. List All Databases
echo 2. Check Master Database Hotels
echo 3. Check Specific Hotel Tenant DB
echo 4. Quick Orders Check
echo 5. Database Size Info
echo 6. Test Database Connection
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto list_databases
if "%choice%"=="2" goto master_hotels
if "%choice%"=="3" goto tenant_database
if "%choice%"=="4" goto quick_orders
if "%choice%"=="5" goto db_size
if "%choice%"=="6" goto test_connection
if "%choice%"=="7" exit /b
echo Invalid choice. Please try again.
pause
goto mainmenu

:list_databases
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Listing All Databases...
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -e "SHOW DATABASES;"
echo.
pause
goto mainmenu

:master_hotels
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Master Database - Hotels
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
echo Total Hotels:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D %DB_NAME_MASTER% -e "SELECT COUNT(*) as total_hotels FROM restaurant;"
echo.
echo Recent Hotels (Last 24 hours):
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D %DB_NAME_MASTER% -e "SELECT id, name, owner_email, created_at FROM restaurant WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) ORDER BY id DESC;"
echo.
echo Staff by Hotel:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D %DB_NAME_MASTER% -e "SELECT restaurant_id, role, COUNT(*) as count FROM staff GROUP BY restaurant_id, role ORDER BY restaurant_id DESC;"
echo.
pause
goto mainmenu

:tenant_database
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Tenant Database Verification
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
set /p hotel_id="Enter Hotel ID: "
set "db_tenant=ss_hotel_!hotel_id!"

echo.
echo Checking if database exists...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -e "SHOW DATABASES LIKE '!db_tenant!';"

echo.
echo Tables in !db_tenant!:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SHOW TABLES;"

echo.
echo Order Count:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT COUNT(*) as total_orders FROM restaurant_order;"

echo.
echo Total Revenue:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT SUM(total_amount) as total_revenue FROM restaurant_order;"

echo.
echo Recent Orders (Last 10):
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT id, status, total_amount, created_at FROM restaurant_order ORDER BY created_at DESC LIMIT 10;"

echo.
echo Staff Accounts:
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT id, username, role, name FROM staff;"

echo.
pause
goto mainmenu

:quick_orders
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Quick Orders Check
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
set /p hotel_id="Enter Hotel ID: "
set "db_tenant=ss_hotel_!hotel_id!"

echo.
echo === Order Summary for Hotel !hotel_id! ===
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT COUNT(*) as total_orders, SUM(total_amount) as revenue FROM restaurant_order;"

echo.
echo === Top 5 Dishes ===
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT mi.name, SUM(oi.quantity) as qty_sold, SUM(oi.quantity * oi.price) as revenue FROM order_item oi JOIN menu_item mi ON oi.menu_item_id = mi.id GROUP BY mi.name ORDER BY qty_sold DESC LIMIT 5;"

echo.
echo === Payment Methods ===
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -D !db_tenant! -e "SELECT method, COUNT(*) as count, SUM(amount) as total FROM payment GROUP BY method;"

echo.
pause
goto mainmenu

:db_size
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Database Size Information
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -e "SELECT table_schema as 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size in MB' FROM information_schema.tables WHERE table_schema IN ('servesmart', 'ss_hotel_1', 'ss_hotel_2', 'ss_hotel_3', 'ss_hotel_4', 'ss_hotel_5', 'ss_hotel_6') GROUP BY table_schema;"

echo.
pause
goto mainmenu

:test_connection
cls
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo Testing Database Connection
echo â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% -e "SELECT 'Connection Successful!' as status, NOW() as timestamp;"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database connection is working properly!
) else (
    echo.
    echo [ERROR] Failed to connect to database.
    echo Please check:
    echo - MySQL is running
    echo - Hostname: %DB_HOST%
    echo - Username: %DB_USER%
    echo - Password is correct
)
echo.
pause
goto mainmenu
