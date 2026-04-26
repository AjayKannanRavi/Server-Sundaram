# Comprehensive Testing Guide for Multi-Tenant Isolation

This guide provides detailed test cases to verify that tenant isolation is working correctly at all layers of the application.

## Test Environment Setup

### Prerequisites
- Backend running on localhost:8085
- MySQL database with test data
- JWT tokens for multiple test tenants

### Test Credentials

```
Tenant 1 (Restaurant A):
  Username: chef_a@restaurant.com
  Password: TestPassword123!
  Tenant ID: 1

Tenant 2 (Restaurant B):
  Username: chef_b@restaurant.com
  Password: TestPassword123!
  Tenant ID: 2

Tenant 3 (Restaurant C):
  Username: chef_c@restaurant.com
  Password: TestPassword123!
  Tenant ID: 3
```

---

## Authentication & JWT Token Tests

### Test 1.1: Successful Login and JWT Generation

**Objective**: Verify JWT token contains correct tenantId

```bash
# Get JWT token for Tenant 1
curl -X POST http://localhost:8085/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "chef_a@restaurant.com",
    "password": "TestPassword123!"
  }'

# Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidGVuYW50SWQiOjEsInVzZXJuYW1lIjoiY2hlZl9hQHJlc3RhdXJhbnQuY29tIiwicm9sZXMiOlsiUk9MRV9TVEFGRiIsIlJPTEVfS0lUQ0hFTiJdLCJpYXQiOjE3MTM2MDAwMDAsImV4cCI6MTcxMzY4NjQwMH0.SIGNATURE",
    "username": "chef_a@restaurant.com"
  }
}

# Decode JWT at jwt.io to verify:
# Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

# Payload:
{
  "sub": "1",
  "tenantId": 1,              â† VERIFY THIS
  "username": "chef_a@restaurant.com",
  "roles": ["ROLE_STAFF", "ROLE_KITCHEN"],
  "iat": 1713600000,
  "exp": 1713686400
}
```

**Verification Checklist**:
- âœ… Response status: 200
- âœ… Token provided in response
- âœ… JWT signature valid
- âœ… JWT contains tenantId: 1
- âœ… JWT not expired
- âœ… User roles included

---

### Test 1.2: Invalid Credentials

**Objective**: Verify failed login doesn't generate token

```bash
curl -X POST http://localhost:8085/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "chef_a@restaurant.com",
    "password": "WrongPassword123!"
  }'

# Expected Response: 401 Unauthorized
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… Response status: 401
- âœ… No token returned
- âœ… Clear error message

---

### Test 1.3: Account Lockout After Failed Attempts

**Objective**: Verify rate limiting locks account after 5 failures

```bash
# Attempt 1
curl -X POST http://localhost:8085/api/staff/login \
  -d '{"username": "chef_a@restaurant.com", "password": "wrong"}'
# Response: 401

# Attempt 2
curl -X POST http://localhost:8085/api/staff/login \
  -d '{"username": "chef_a@restaurant.com", "password": "wrong"}'
# Response: 401

# ... (Attempts 3, 4, 5)

# Attempt 6 (should be locked)
curl -X POST http://localhost:8085/api/staff/login \
  -d '{"username": "chef_a@restaurant.com", "password": "TestPassword123!"}'

# Expected Response: 429 Too Many Requests (or 401 with lock message)
{
  "success": false,
  "statusCode": 429,
  "message": "Account locked. Too many failed login attempts. Please try again in 15 minutes.",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… First 5 attempts return 401
- âœ… 6th attempt triggers lockout
- âœ… Lockout message clear
- âœ… Account locked for 15 minutes
- âœ… Correct password still rejected during lockout

---

## Multi-Tenant Data Isolation Tests

### Test 2.1: Create Orders as Different Tenants

**Objective**: Verify each tenant can only see their own orders

**Setup**: Get separate JWT tokens for Tenant 1 and Tenant 2

```bash
# Store tokens
TOKEN_1="<JWT_FOR_TENANT_1>"
TOKEN_2="<JWT_FOR_TENANT_2>"

# Tenant 1 creates order
curl -X POST http://localhost:8085/api/orders \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": 5,
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "items": [
      {"menuItemId": 12, "quantity": 2}
    ]
  }'

# Response:
{
  "success": true,
  "statusCode": 201,
  "message": "Order created successfully",
  "data": {
    "id": 101,
    "customerName": "John Doe",
    "status": "PENDING",
    "totalAmount": 299.99,
    "createdAt": "2026-04-19T11:05:23Z"
    # NO tenantId field!
  }
}

# Save Order ID for Tenant 1: 101

# Tenant 2 creates order
curl -X POST http://localhost:8085/api/orders \
  -H "Authorization: Bearer $TOKEN_2" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": 3,
    "customerName": "Jane Smith",
    "customerPhone": "9876543210",
    "items": [
      {"menuItemId": 15, "quantity": 1}
    ]
  }'

# Response:
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 201,
    "customerName": "Jane Smith",
    ...
  }
}

# Save Order ID for Tenant 2: 201
```

**Verification Checklist**:
- âœ… Tenant 1 order created with ID 101
- âœ… Tenant 2 order created with ID 201
- âœ… Response doesn't include tenantId
- âœ… Orders assigned to different tenants in database

---

### Test 2.2: Cross-Tenant Access Prevention

**Objective**: Verify Tenant 1 cannot access Tenant 2's orders

```bash
TOKEN_1="<JWT_FOR_TENANT_1>"
TOKEN_2="<JWT_FOR_TENANT_2>"

# Tenant 1 tries to access Order 101 (their own) - Should succeed
curl -X GET http://localhost:8085/api/orders/101 \
  -H "Authorization: Bearer $TOKEN_1"

# Expected Response: 200 OK
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 101,
    "customerName": "John Doe",
    ...
  }
}

# Tenant 1 tries to access Order 201 (Tenant 2's) - Should fail
curl -X GET http://localhost:8085/api/orders/201 \
  -H "Authorization: Bearer $TOKEN_1"

# Expected Response: 404 Not Found
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found",
  "timestamp": "2026-04-19T11:05:23Z"
}

# Tenant 2 tries to access Order 101 (Tenant 1's) - Should fail
curl -X GET http://localhost:8085/api/orders/101 \
  -H "Authorization: Bearer $TOKEN_2"

# Expected Response: 404 Not Found
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… Tenant 1 can access Order 101 (returns 200)
- âœ… Tenant 1 cannot access Order 201 (returns 404)
- âœ… Tenant 2 can access Order 201 (returns 200)
- âœ… Tenant 2 cannot access Order 101 (returns 404)
- âœ… 404 returned (not 403) to prevent enumeration attacks

---

### Test 2.3: Query All Orders - Isolation

**Objective**: Verify GetAll endpoint only returns tenant's orders

```bash
# Assumption: DB has:
# - 5 orders for Tenant 1 (IDs: 101-105)
# - 3 orders for Tenant 2 (IDs: 201-203)
# - 7 orders for Tenant 3 (IDs: 301-307)

TOKEN_1="<JWT_FOR_TENANT_1>"

# Tenant 1 queries all orders
curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer $TOKEN_1"

# Expected Response:
{
  "success": true,
  "statusCode": 200,
  "data": [
    {"id": 101, "customerName": "John Doe", ...},
    {"id": 102, "customerName": "Alice Brown", ...},
    {"id": 103, "customerName": "Bob Wilson", ...},
    {"id": 104, "customerName": "Carol Davis", ...},
    {"id": 105, "customerName": "David Lee", ...}
  ]
}

# Count orders: 5 (only Tenant 1's)

TOKEN_2="<JWT_FOR_TENANT_2>"

# Tenant 2 queries all orders
curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer $TOKEN_2"

# Expected Response includes only Tenant 2's 3 orders
```

**Verification Checklist**:
- âœ… Tenant 1 GetAll returns only 5 orders (0 from other tenants)
- âœ… Tenant 2 GetAll returns only 3 orders (0 from other tenants)
- âœ… Tenant 3 GetAll returns only 7 orders (0 from other tenants)
- âœ… No cross-tenant data visible

---

### Test 2.4: Update Operation Isolation

**Objective**: Verify Tenant 1 cannot update Tenant 2's order

```bash
TOKEN_1="<JWT_FOR_TENANT_1>"
TOKEN_2="<JWT_FOR_TENANT_2>"

# Tenant 1 updates their own order (success)
curl -X PUT http://localhost:8085/api/orders/101/status \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Expected: 200 OK

# Tenant 1 tries to update Tenant 2's order
curl -X PUT http://localhost:8085/api/orders/201/status \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Expected Response: 404 Not Found (NOT updated!)
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found"
}

# Verify in DB: Order 201's status is STILL unchanged
# Tenant 2 verifies their order wasn't modified
curl -X GET http://localhost:8085/api/orders/201 \
  -H "Authorization: Bearer $TOKEN_2"

# Response shows status is unchanged (still PENDING)
```

**Verification Checklist**:
- âœ… Tenant 1 can update Order 101
- âœ… Tenant 1 cannot update Order 201 (returns 404)
- âœ… Order 201 remains unchanged after failed update
- âœ… No cross-tenant modifications possible

---

### Test 2.5: Delete Operation Isolation

**Objective**: Verify Tenant 1 cannot delete Tenant 2's order

```bash
TOKEN_1="<JWT_FOR_TENANT_1>"
TOKEN_2="<JWT_FOR_TENANT_2>"

# Tenant 1 tries to delete Tenant 2's order
curl -X DELETE http://localhost:8085/api/orders/201 \
  -H "Authorization: Bearer $TOKEN_1"

# Expected Response: 404 Not Found
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found"
}

# Verify in DB: Order 201 still exists!
curl -X GET http://localhost:8085/api/orders/201 \
  -H "Authorization: Bearer $TOKEN_2"

# Response: 200 OK with Order 201 data (NOT deleted)
```

**Verification Checklist**:
- âœ… Tenant 1 cannot delete Order 201 (returns 404)
- âœ… Order 201 still exists in database
- âœ… Order is accessible by Tenant 2

---

## Authorization & Role-Based Access Tests

### Test 3.1: Permission Verification

**Objective**: Verify role-based access control works per tenant

```bash
TOKEN_STAFF="<JWT_FOR_STAFF_ROLE>"
TOKEN_KITCHEN="<JWT_FOR_KITCHEN_ROLE>"
TOKEN_ADMIN="<JWT_FOR_ADMIN_ROLE>"

# Staff can view orders
curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer $TOKEN_STAFF"
# Expected: 200 OK

# Kitchen can view kitchen dashboard
curl -X GET http://localhost:8085/api/kitchen/dashboard \
  -H "Authorization: Bearer $TOKEN_KITCHEN"
# Expected: 200 OK

# Staff cannot access admin endpoints
curl -X POST http://localhost:8085/api/admin/database/reset \
  -H "Authorization: Bearer $TOKEN_STAFF"
# Expected: 403 Forbidden

# Admin can access all endpoints
curl -X POST http://localhost:8085/api/admin/database/reset \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: 200 or appropriate response
```

**Verification Checklist**:
- âœ… Each role can access their endpoints
- âœ… Each role cannot access higher-permission endpoints
- âœ… Permissions enforced per tenant

---

## Database Query Verification

### Test 4.1: Verify Database Filtering

**Objective**: Verify database queries are properly filtered by tenantId

```bash
# Log into MySQL
mysql -u root -p serversundaram_db

# Query restaurants_orders table
SELECT id, tenant_id, customer_name, status FROM restaurant_orders LIMIT 20;

# Expected output:
+-----+-----------+------------------+----------+
| id  | tenant_id | customer_name    | status   |
+-----+-----------+------------------+----------+
| 101 | 1         | John Doe         | PENDING  |
| 102 | 1         | Alice Brown      | PENDING  |
| 103 | 1         | Bob Wilson       | PENDING  |
| 201 | 2         | Jane Smith       | PENDING  |
| 202 | 2         | Carol Davis      | PENDING  |
| 301 | 3         | David Lee        | PENDING  |
+-----+-----------+------------------+----------+

# Verify every row has a tenant_id (NOT NULL)
SELECT COUNT(*) FROM restaurant_orders WHERE tenant_id IS NULL;
# Expected: 0 rows

# Verify application queries include tenant_id filter
# Check logs for queries like:
# SELECT ... FROM restaurant_orders WHERE tenant_id = ?

# Enable query logging
SET GLOBAL general_log = 'ON';
SET GLOBAL log_output = 'TABLE';

# Make a request
curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer <TOKEN>"

# Check logs
SELECT * FROM mysql.general_log WHERE argument LIKE '%tenant_id%' ORDER BY event_time DESC LIMIT 5;

# Expected: Queries should include tenant_id in WHERE clause
```

**Verification Checklist**:
- âœ… All rows in tables have tenant_id (NOT NULL)
- âœ… No rows with NULL tenant_id
- âœ… Queries include WHERE tenant_id = ? filter
- âœ… Queries don't contain UNION or unfiltered SELECT statements

---

## Error Scenario Tests

### Test 5.1: Missing JWT Token

**Objective**: Verify requests without JWT are rejected

```bash
# Request without Authorization header
curl -X GET http://localhost:8085/api/orders

# Expected Response: 401 Unauthorized
{
  "success": false,
  "statusCode": 401,
  "message": "JWT token is missing or invalid",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… Response status: 401
- âœ… No data returned
- âœ… Clear error message

---

### Test 5.2: Invalid JWT Token

**Objective**: Verify tampered JWT is rejected

```bash
# Request with tampered JWT (signature changed)
curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer eyJhbGc...TAMPERED...XYZ"

# Expected Response: 401 Unauthorized
{
  "success": false,
  "statusCode": 401,
  "message": "JWT signature is invalid",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… Response status: 401
- âœ… Tampered JWT rejected
- âœ… No data returned

---

### Test 5.3: Expired JWT Token

**Objective**: Verify expired JWT is rejected

```bash
# Use JWT that expired 1 second ago
# (Generate one with past expiration)

curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer <EXPIRED_TOKEN>"

# Expected Response: 401 Unauthorized
{
  "success": false,
  "statusCode": 401,
  "message": "JWT token has expired",
  "timestamp": "2026-04-19T11:05:23Z"
}
```

**Verification Checklist**:
- âœ… Response status: 401
- âœ… Expired token rejected
- âœ… User must login again

---

## Performance Tests

### Test 6.1: Query Performance with Large Dataset

**Objective**: Verify queries are efficient even with large dataset

```bash
# Generate test data: 1 million orders across 100 tenants
# (Done via admin endpoint or direct DB seeding)

# Measure query time for GetAll
time curl -X GET http://localhost:8085/api/orders \
  -H "Authorization: Bearer <TOKEN>"

# Expected: Response time < 500ms even with 1M rows
# (Due to tenant_id index filtering)

# Verify index exists:
SHOW INDEX FROM restaurant_orders WHERE Key_name = 'idx_tenant_id';

# Expected:
+-------------------+------------+-----+-----+-----+
| Table             | Key_name   | ... |
+-------------------+------------+-----+-----+-----+
| restaurant_orders | idx_tenant | ... |
+-------------------+------------+-----+-----+-----+
```

**Verification Checklist**:
- âœ… Query time < 500ms for 1M records
- âœ… Index on tenant_id exists
- âœ… Query plan uses index efficiently

---

## Summary Checklist

### Authentication âœ…
- [ ] JWT tokens generated with tenantId
- [ ] Tokens validated on every request
- [ ] Failed login locked after 5 attempts
- [ ] Expired tokens rejected

### Isolation âœ…
- [ ] Each tenant sees only their orders (GetAll)
- [ ] Cross-tenant access returns 404
- [ ] Cannot update other tenant's data
- [ ] Cannot delete other tenant's data
- [ ] Cannot modify other tenant's data

### Database âœ…
- [ ] All tables have tenant_id (NOT NULL)
- [ ] All queries include WHERE tenant_id = ?
- [ ] Indexes on tenant_id for performance
- [ ] No NULL tenant_id values in database

### Security âœ…
- [ ] Missing JWT rejected (401)
- [ ] Invalid JWT rejected (401)
- [ ] Tampered JWT rejected (401)
- [ ] Expired JWT rejected (401)
- [ ] 404 returned for unauthorized access (prevents enumeration)

### Performance âœ…
- [ ] Queries < 500ms with 1M records
- [ ] Tenant_id index optimizes filtering
- [ ] No N+1 query problems
- [ ] Connection pool working efficiently

---

**Testing Status**: Production-Ready âœ…  
**Last Updated**: April 19, 2026
