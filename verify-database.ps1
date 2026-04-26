# Database Quick Verification Script
# Usage: .\verify-database.ps1

# Configuration
$dbHost = "localhost"
$dbPort = "3306"
$dbUser = "root"
$dbPassword = "Ajay@111"

function Run-MySQLQuery {
    param(
        [string]$Database,
        [string]$Query
    )
    
    # Use mysql command-line to execute query
    $mysqlCmd = "mysql -h $dbHost -u $dbUser -p$dbPassword"
    
    if (-not [string]::IsNullOrEmpty($Database)) {
        $mysqlCmd += " -D $Database"
    }
    
    $mysqlCmd += " -e `"$Query`""
    
    try {
        $result = Invoke-Expression $mysqlCmd 2>$null
        return $result
    } catch {
        return "ERROR: $_"
    }
}

function Verify-MasterDatabase {
    Write-Host "`n=== MASTER DATABASE VERIFICATION ===" -ForegroundColor Cyan
    
    # Check all databases
    Write-Host "`n1. Checking all databases..." -ForegroundColor Yellow
    $dbs = Run-MySQLQuery -Query "SHOW DATABASES;"
    $dbs | Measure-Object -Line | ForEach-Object { Write-Host "   Found $($_.Lines) databases" }
    
    # Check hotels
    Write-Host "`n2. Checking registered hotels..." -ForegroundColor Yellow
    $hotelCount = Run-MySQLQuery -Database "servesmart" -Query "SELECT COUNT(*) as count FROM restaurant;"
    Write-Host $hotelCount
    
    # List recent hotels
    Write-Host "`n3. Recent hotels (last 24 hours)..." -ForegroundColor Yellow
    $recentHotels = Run-MySQLQuery -Database "servesmart" -Query "SELECT id, name, owner_email, created_at FROM restaurant WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) ORDER BY created_at DESC;"
    Write-Host $recentHotels
    
    # Check staff accounts
    Write-Host "`n4. Staff accounts summary..." -ForegroundColor Yellow
    $staffSummary = Run-MySQLQuery -Database "servesmart" -Query "SELECT role, COUNT(*) as count FROM staff GROUP BY role;"
    Write-Host $staffSummary
}

function Verify-TenantDatabase {
    param(
        [int]$HotelId
    )
    
    if (-not $HotelId) {
        Write-Host "`nEnter Hotel ID to verify (found in master database): " -NoNewline
        $HotelId = Read-Host
    }
    
    $dbName = "ss_hotel_$HotelId"
    
    Write-Host "`n=== TENANT DATABASE VERIFICATION (Hotel ID: $HotelId) ===" -ForegroundColor Cyan
    
    # Check if database exists
    Write-Host "`n1. Checking if database exists ($dbName)..." -ForegroundColor Yellow
    $dbExists = Run-MySQLQuery -Query "SHOW DATABASES LIKE '$dbName';"
    if ([string]::IsNullOrEmpty($dbExists)) {
        Write-Host "   âŒ Database NOT found!" -ForegroundColor Red
        return
    }
    Write-Host "   âœ… Database found!" -ForegroundColor Green
    
    # Check tables
    Write-Host "`n2. Database tables..." -ForegroundColor Yellow
    $tables = Run-MySQLQuery -Database $dbName -Query "SHOW TABLES;"
    Write-Host $tables
    
    # Check restaurant record
    Write-Host "`n3. Restaurant record..." -ForegroundColor Yellow
    $restaurant = Run-MySQLQuery -Database $dbName -Query "SELECT id, name, owner_email, plan_type FROM restaurant;"
    Write-Host $restaurant
    
    # Check staff accounts
    Write-Host "`n4. Staff accounts..." -ForegroundColor Yellow
    $staff = Run-MySQLQuery -Database $dbName -Query "SELECT id, username, name, role FROM staff ORDER BY role;"
    Write-Host $staff
    
    # Check orders
    Write-Host "`n5. Orders (last 10)..." -ForegroundColor Yellow
    $orders = Run-MySQLQuery -Database $dbName -Query "SELECT id, status, total_amount, created_at FROM restaurant_order ORDER BY created_at DESC LIMIT 10;"
    Write-Host $orders
    
    # Order count
    Write-Host "`n6. Order statistics..." -ForegroundColor Yellow
    $orderStats = Run-MySQLQuery -Database $dbName -Query "SELECT COUNT(*) as total_orders, SUM(total_amount) as total_revenue FROM restaurant_order;"
    Write-Host $orderStats
    
    # Check payment status
    Write-Host "`n7. Payment status breakdown..." -ForegroundColor Yellow
    $payments = Run-MySQLQuery -Database $dbName -Query "SELECT status, COUNT(*) as count FROM payment GROUP BY status;"
    Write-Host $payments
    
    # Check menu items
    Write-Host "`n8. Menu items count..." -ForegroundColor Yellow
    $menuCount = Run-MySQLQuery -Database $dbName -Query "SELECT COUNT(*) as menu_count FROM menu_item;"
    Write-Host $menuCount
}

function Quick-Orders-Check {
    param(
        [int]$HotelId
    )
    
    if (-not $HotelId) {
        Write-Host "`nEnter Hotel ID: " -NoNewline
        $HotelId = Read-Host
    }
    
    $dbName = "ss_hotel_$HotelId"
    
    Write-Host "`n=== QUICK ORDERS CHECK (Hotel ID: $HotelId) ===" -ForegroundColor Cyan
    
    $orderCheck = Run-MySQLQuery -Database $dbName -Query "
    SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
    FROM restaurant_order;"
    
    Write-Host $orderCheck
    
    Write-Host "`nTop 5 dishes..." -ForegroundColor Yellow
    $topDishes = Run-MySQLQuery -Database $dbName -Query "
    SELECT mi.name, SUM(oi.quantity) as qty_sold, SUM(oi.quantity * oi.price) as revenue
    FROM order_item oi
    JOIN menu_item mi ON oi.menu_item_id = mi.id
    GROUP BY mi.id, mi.name
    ORDER BY qty_sold DESC
    LIMIT 5;"
    
    Write-Host $topDishes
}

function Export-Data {
    param(
        [string]$Database,
        [string]$Table,
        [string]$OutputFile
    )
    
    if (-not $OutputFile) {
        $OutputFile = "$Database`_$Table`_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    }
    
    Write-Host "`nExporting $Database.$Table to $OutputFile..." -ForegroundColor Yellow
    
    $mysqlCmd = "mysql -h $dbHost -u $dbUser -p$dbPassword"
    $mysqlCmd += " -D $Database -e `"SELECT * FROM $Table;`""
    
    Invoke-Expression "$mysqlCmd | Out-File -FilePath $OutputFile"
    Write-Host "âœ… Export complete!" -ForegroundColor Green
}

# Main Menu
function Show-Menu {
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
    Write-Host "â•‘   serversundaram Database Verification Tool    â•‘" -ForegroundColor Cyan
    Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    
    Write-Host "`n1. Verify Master Database" -ForegroundColor White
    Write-Host "2. Verify Tenant Database (specific hotel)" -ForegroundColor White
    Write-Host "3. Quick Orders Check" -ForegroundColor White
    Write-Host "4. Export Data to CSV" -ForegroundColor White
    Write-Host "5. Custom SQL Query" -ForegroundColor White
    Write-Host "6. Exit" -ForegroundColor White
}

function Get-CustomQuery {
    Write-Host "`nEnter database name (servesmart or ss_hotel_X): " -NoNewline
    $db = Read-Host
    
    Write-Host "Enter your SQL query: " -NoNewline
    $query = Read-Host
    
    Write-Host "`nResults:" -ForegroundColor Yellow
    $result = Run-MySQLQuery -Database $db -Query $query
    Write-Host $result
}

# Main Loop
$continue = $true
while ($continue) {
    Show-Menu
    
    Write-Host "`nEnter your choice (1-6): " -NoNewline
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Verify-MasterDatabase
        }
        "2" {
            Verify-TenantDatabase
        }
        "3" {
            Quick-Orders-Check
        }
        "4" {
            Write-Host "`nDatabase name (servesmart or ss_hotel_X): " -NoNewline
            $db = Read-Host
            Write-Host "Table name: " -NoNewline
            $table = Read-Host
            Export-Data -Database $db -Table $table
        }
        "5" {
            Get-CustomQuery
        }
        "6" {
            $continue = $false
            Write-Host "`nThank you for using Database Verification Tool!" -ForegroundColor Green
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
        }
    }
}
