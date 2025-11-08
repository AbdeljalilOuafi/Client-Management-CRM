# API Testing Guide

This guide provides examples for testing all API endpoints using cURL and Python requests.

## Prerequisites

1. Start the server:
```bash
./start.sh
# or
python manage.py runserver
```

2. Make sure you have at least one account and one superadmin user.

## Authentication

### Signup

```bash
# cURL
curl -X POST http://127.0.0.1:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "name": "My Fitness Company",
      "email": "contact@myfitness.com",
      "ceo_name": "John Smith",
      "niche": "Fitness & Wellness",
      "location": "Los Angeles, CA",
      "website_url": "https://myfitness.com",
      "timezone": "America/Los_Angeles"
    },
    "user": {
      "name": "John Smith",
      "email": "john@myfitness.com",
      "password": "SecurePassword123!",
      "phone_number": "+1234567890",
      "job_role": "CEO"
    }
  }'
```

**Response:**
```json
{
  "message": "Account and user created successfully",
  "token": "your-auth-token-here",
  "account": {
    "id": 1,
    "name": "My Fitness Company",
    "email": "contact@myfitness.com"
  },
  "user": {
    "id": 1,
    "email": "john@myfitness.com",
    "name": "John Smith",
    "role": "super_admin"
  }
}
```

**Note:** The signup endpoint creates both a new account and a super admin user. You can immediately use the returned token for authenticated requests.

### Login

```bash
# cURL
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "your-auth-token-here",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Super Admin",
    "role": "super_admin",
    "account_id": 1,
    "account_name": "Test Company"
  }
}
```

Save the token for subsequent requests!

### Get Current User

```bash
curl http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Logout

```bash
curl -X POST http://127.0.0.1:8000/api/auth/logout/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Accounts

### List Accounts

```bash
curl http://127.0.0.1:8000/api/accounts/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Employees

### List Employees

```bash
# All employees
curl http://127.0.0.1:8000/api/employees/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by role
curl "http://127.0.0.1:8000/api/employees/?role=admin" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Search
curl "http://127.0.0.1:8000/api/employees/?search=john" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Create Employee

```bash
curl -X POST http://127.0.0.1:8000/api/employees/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "role": "employee",
    "job_role": "Sales Manager",
    "phone_number": "+1234567890",
    "status": "active",
    "is_active": true
  }'
```

### Update Employee

```bash
curl -X PATCH http://127.0.0.1:8000/api/employees/2/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "job_role": "Senior Sales Manager",
    "phone_number": "+0987654321"
  }'
```

### Change Password

```bash
curl -X POST http://127.0.0.1:8000/api/employees/2/change_password/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "SecurePass123!",
    "new_password": "NewSecurePass456!"
  }'
```

### Update Permissions

```bash
curl -X POST http://127.0.0.1:8000/api/employees/2/update_permissions/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["view_all_clients", "manage_all_clients"]
  }'
```

## Clients

### List Clients

```bash
# All clients
curl http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by status
curl "http://127.0.0.1:8000/api/clients/?status=active" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Search
curl "http://127.0.0.1:8000/api/clients/?search=john" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Pagination
curl "http://127.0.0.1:8000/api/clients/?page=2" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Get My Clients

```bash
curl http://127.0.0.1:8000/api/clients/my_clients/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Client Statistics

```bash
curl http://127.0.0.1:8000/api/clients/statistics/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Create Client

```bash
curl -X POST http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "status": "active",
    "coach": 2,
    "country": "US",
    "currency": "USD",
    "client_start_date": "2025-01-01"
  }'
```

### Update Client

```bash
curl -X PATCH http://127.0.0.1:8000/api/clients/1/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "notice_given": true
  }'
```

### Get Client Detail

```bash
curl http://127.0.0.1:8000/api/clients/1/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Packages

### List Packages

```bash
curl http://127.0.0.1:8000/api/packages/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Create Package

```bash
curl -X POST http://127.0.0.1:8000/api/packages/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "package_name": "Premium Package",
    "description": "Our premium offering with all features"
  }'
```

### Update Package

```bash
curl -X PATCH http://127.0.0.1:8000/api/packages/1/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

## Client Packages

### List Client Packages

```bash
# All client packages
curl http://127.0.0.1:8000/api/client-packages/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by client
curl "http://127.0.0.1:8000/api/client-packages/?client=1" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by status
curl "http://127.0.0.1:8000/api/client-packages/?status=active" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Create Client Package

```bash
curl -X POST http://127.0.0.1:8000/api/client-packages/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "client": 1,
    "package": 1,
    "custom_price": 999.99,
    "monthly_payment_amount": 99.99,
    "payment_schedule": "Monthly",
    "start_date": "2025-01-01",
    "status": "active",
    "payments_left": 10
  }'
```

## Payments

### List Payments

```bash
# All payments
curl http://127.0.0.1:8000/api/payments/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by status
curl "http://127.0.0.1:8000/api/payments/?status=paid" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by client
curl "http://127.0.0.1:8000/api/payments/?client=1" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Payment Statistics

```bash
curl http://127.0.0.1:8000/api/payments/statistics/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Installments

### List Installments

```bash
# All installments
curl http://127.0.0.1:8000/api/installments/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by client
curl "http://127.0.0.1:8000/api/installments/?client=1" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Filter by status
curl "http://127.0.0.1:8000/api/installments/?status=open" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

### Create Installment

```bash
curl -X POST http://127.0.0.1:8000/api/installments/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "client": 1,
    "amount": 99.99,
    "currency": "USD",
    "schedule_date": "2025-02-01",
    "status": "open",
    "instalment_number": 1
  }'
```

## Stripe Customers

### List Stripe Customers

```bash
curl http://127.0.0.1:8000/api/stripe-customers/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

---

## Python Examples

### Using requests library

```python
import requests

BASE_URL = "http://127.0.0.1:8000/api"

# Signup (create new account and super admin)
signup_data = {
    "account": {
        "name": "My Fitness Company",
        "email": "contact@myfitness.com",
        "ceo_name": "John Smith",
        "niche": "Fitness & Wellness",
        "location": "Los Angeles, CA",
        "website_url": "https://myfitness.com",
        "timezone": "America/Los_Angeles"
    },
    "user": {
        "name": "John Smith",
        "email": "john@myfitness.com",
        "password": "SecurePassword123!",
        "phone_number": "+1234567890",
        "job_role": "CEO"
    }
}
response = requests.post(f"{BASE_URL}/auth/signup/", json=signup_data)
data = response.json()
TOKEN = data['token']
print(f"Account created: {data['account']['name']}")
print(f"User created: {data['user']['email']}")

# Or Login with existing account
response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={
        "email": "admin@example.com",
        "password": "admin123"
    }
)
data = response.json()
TOKEN = data['token']

# Set headers for authenticated requests
headers = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json"
}

# List clients
response = requests.get(f"{BASE_URL}/clients/", headers=headers)
clients = response.json()
print(f"Total clients: {clients['count']}")

# Create client
new_client = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "status": "active",
    "country": "US"
}
response = requests.post(
    f"{BASE_URL}/clients/",
    json=new_client,
    headers=headers
)
print(f"Created client: {response.json()}")

# Get client statistics
response = requests.get(f"{BASE_URL}/clients/statistics/", headers=headers)
stats = response.json()
print(f"Client statistics: {stats}")
```

---

## Response Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but no permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Pagination

All list endpoints support pagination:

```bash
# Get page 1 (default)
curl http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Get page 2
curl "http://127.0.0.1:8000/api/clients/?page=2" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Custom page size (default is 50)
curl "http://127.0.0.1:8000/api/clients/?page_size=100" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

**Pagination Response:**
```json
{
  "count": 150,
  "next": "http://127.0.0.1:8000/api/clients/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtering

Most endpoints support filtering:

```bash
# Multiple filters
curl "http://127.0.0.1:8000/api/clients/?status=active&country=US" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Search
curl "http://127.0.0.1:8000/api/clients/?search=john" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Ordering
curl "http://127.0.0.1:8000/api/clients/?ordering=first_name" \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Reverse ordering
curl "http://127.0.0.1:8000/api/clients/?ordering=-created_at" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Error Handling

All errors return JSON with details:

```json
{
  "error": "Invalid credentials"
}

{
  "email": ["This field is required."],
  "password": ["This field may not be blank."]
}

{
  "detail": "Not found."
}
```
