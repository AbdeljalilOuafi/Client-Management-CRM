#!/bin/bash
# Test script to verify regular employees can create clients

echo "=== Testing Regular Employee Permissions ==="
echo ""

# Step 1: Login with the existing account (from previous signup test)
echo "1. Logging in as Super Admin to create a regular employee..."
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@testcompany.com",
    "password": "SecurePassword123!"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "Admin Token: $ADMIN_TOKEN"
echo ""

# Step 2: Create a regular employee
echo "2. Creating a regular employee..."
curl -s -X POST http://127.0.0.1:8000/api/employees/ \
  -H "Authorization: Token $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Employee",
    "email": "john.employee@testcompany.com",
    "password": "EmployeePass123!",
    "role": "employee",
    "job_role": "Sales Representative",
    "status": "active",
    "is_active": true
  }' | python3 -m json.tool

echo ""
echo ""

# Step 3: Login as the regular employee
echo "3. Logging in as regular employee..."
EMPLOYEE_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.employee@testcompany.com",
    "password": "EmployeePass123!"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "Employee Token: $EMPLOYEE_TOKEN"
echo ""

# Step 4: Create a client as regular employee
echo "4. Creating a client as regular employee (should succeed)..."
curl -s -X POST http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "status": "active",
    "country": "US",
    "currency": "USD",
    "client_start_date": "2025-01-01"
  }' | python3 -m json.tool

echo ""
echo ""

# Step 5: Try to create another employee (should fail)
echo "5. Trying to create another employee as regular employee (should fail)..."
curl -s -X POST http://127.0.0.1:8000/api/employees/ \
  -H "Authorization: Token $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Employee",
    "email": "another@testcompany.com",
    "password": "AnotherPass123!",
    "role": "employee",
    "status": "active"
  }' | python3 -m json.tool

echo ""
echo ""
echo "=== Test Complete ==="
