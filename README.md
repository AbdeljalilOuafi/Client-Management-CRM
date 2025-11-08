# Client Management CRM - Django REST API

A multi-tenant Django REST Framework backend for client management with account-scoped data access, custom employee authentication, and role-based permissions (SuperAdmin/Admin/Employee).

## 🚀 Features

- **Multi-Tenant Architecture**: Account-scoped data isolation
- **Role-Based Access Control**: SuperAdmin, Admin, and Employee roles
- **Custom Employee Authentication**: Email-based authentication with JWT tokens
- **Comprehensive API**: Full CRUD operations for all entities
- **Account-Scoped Queries**: Automatic filtering by account
- **Permission Management**: Granular permissions for employees
- **RESTful API**: Following REST best practices
- **Local Supabase Integration**: Works with replicated Supabase database

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL (via Supabase)
- Virtual Environment (recommended)

## 🛠️ Installation & Setup

### 1. Clone and Navigate to Project

```bash
cd /home/ouafi/Projects/Client-Management-CRM
```

### 2. Create and Activate Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate  # On Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The `.env` file is already configured with local Supabase settings:

```env
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=54322
```

### 5. Run Migrations

Since we're using existing database tables (`managed = False` in models), Django won't create tables:

```bash
python manage.py migrate
```

### 6. Create Content Types and Permissions

Run this to ensure Django creates content types and permissions:

```bash
python manage.py migrate --run-syncdb
```

### 7. Create a Test SuperAdmin User

You'll need to create a superuser in the database manually or via Django shell:

```bash
python manage.py shell
```

Then in the shell:

```python
from api.models import Employee, Account

# First, get or create an account
account = Account.objects.first()  # Or create one if needed

# Create a superadmin employee
employee = Employee.objects.create_user(
    email='admin@example.com',
    password='your-secure-password',
    name='Super Admin',
    account=account,
    role='super_admin',
    is_staff=True,
    is_superuser=True,
    is_active=True
)
print(f"Created SuperAdmin: {employee.email}")
```

### 8. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "your-auth-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "super_admin",
    "account_id": 1,
    "account_name": "Acme Corp"
  }
}
```

#### Get Current User
```http
GET /api/auth/me/
Authorization: Token your-auth-token

Response:
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "super_admin",
  "account": 1,
  "account_name": "Acme Corp"
}
```

#### Logout
```http
POST /api/auth/logout/
Authorization: Token your-auth-token
```

### Accounts

```http
GET /api/accounts/
Authorization: Token your-auth-token
```

### Employees

#### List Employees
```http
GET /api/employees/
Authorization: Token your-auth-token

Query Parameters:
- role: super_admin|admin|employee
- status: active|inactive
- search: search by name or email
```

#### Create Employee (Admin/SuperAdmin only)
```http
POST /api/employees/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure-password",
  "role": "employee",
  "job_role": "Sales Manager",
  "phone_number": "+1234567890",
  "is_active": true
}
```

#### Update Employee
```http
PATCH /api/employees/{id}/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "job_role": "Senior Sales Manager"
}
```

#### Change Password
```http
POST /api/employees/{id}/change_password/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "old_password": "current-password",
  "new_password": "new-secure-password"
}
```

#### Update Permissions (Admin/SuperAdmin only)
```http
POST /api/employees/{id}/update_permissions/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "permissions": ["view_all_clients", "manage_all_clients"]
}
```

### Clients

#### List Clients
```http
GET /api/clients/
Authorization: Token your-auth-token

Query Parameters:
- status: active|inactive|onboarding|paused|cancelled
- coach: employee_id
- closer: employee_id
- setter: employee_id
- country: country code
- search: search by name or email
```

#### Get My Clients (assigned as coach/closer/setter)
```http
GET /api/clients/my_clients/
Authorization: Token your-auth-token
```

#### Client Statistics
```http
GET /api/clients/statistics/
Authorization: Token your-auth-token

Response:
{
  "total": 150,
  "active": 120,
  "inactive": 10,
  "onboarding": 15,
  "paused": 3,
  "cancelled": 2
}
```

#### Create Client (Admin/SuperAdmin only)
```http
POST /api/clients/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "status": "active",
  "coach": 2,
  "closer": 3,
  "country": "US",
  "currency": "USD"
}
```

### Packages

#### List Packages
```http
GET /api/packages/
Authorization: Token your-auth-token
```

#### Create Package (Admin/SuperAdmin only)
```http
POST /api/packages/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "package_name": "Premium Package",
  "description": "Our premium offering"
}
```

### Client Packages

#### List Client Packages
```http
GET /api/client-packages/
Authorization: Token your-auth-token

Query Parameters:
- client: client_id
- package: package_id
- status: active|inactive
- payment_schedule: PIF|Monthly|Quarterly|Yearly
```

#### Create Client Package (Admin/SuperAdmin only)
```http
POST /api/client-packages/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "client": 1,
  "package": 2,
  "custom_price": 999.99,
  "monthly_payment_amount": 99.99,
  "payment_schedule": "Monthly",
  "start_date": "2025-01-01",
  "status": "active"
}
```

### Payments

#### List Payments
```http
GET /api/payments/
Authorization: Token your-auth-token

Query Parameters:
- client: client_id
- status: paid|failed|refunded|disputed
- currency: USD|EUR|etc
```

#### Payment Statistics
```http
GET /api/payments/statistics/
Authorization: Token your-auth-token

Response:
{
  "total_payments": 500,
  "total_amount": 125000.00,
  "paid": 450,
  "failed": 30,
  "refunded": 15,
  "disputed": 5
}
```

### Installments

#### List Installments
```http
GET /api/installments/
Authorization: Token your-auth-token

Query Parameters:
- client: client_id
- status: open|paid|failed|closed
```

#### Create Installment (Admin/SuperAdmin only)
```http
POST /api/installments/
Authorization: Token your-auth-token
Content-Type: application/json

{
  "client": 1,
  "amount": 99.99,
  "currency": "USD",
  "schedule_date": "2025-02-01",
  "status": "open",
  "instalment_number": 1
}
```

### Stripe Customers

#### List Stripe Customers
```http
GET /api/stripe-customers/
Authorization: Token your-auth-token

Query Parameters:
- client: client_id
- status: active|inactive
```

## 🔐 Role-Based Permissions

### SuperAdmin
- Full access to all resources
- Can manage all employees (including admins)
- Can assign permissions to employees

### Admin
- Can manage employees (except SuperAdmins)
- Can create, update, delete clients
- Can manage packages and client packages
- Can view all data in their account

### Employee
- Can view clients in their account
- Can view their assigned clients (as coach/closer/setter)
- Can update their own profile
- Can view packages and payments
- Cannot create or delete resources

## 🗄️ Database Schema

The application uses the following main tables:
- `accounts` - Multi-tenant accounts
- `employees` - Custom user model with roles
- `clients` - Client records
- `packages` - Service packages
- `client_packages` - Client-package relationships
- `payments` - Payment records
- `instalments` - Installment records
- `stripe_customers` - Stripe customer mappings

All models are set to `managed = False` to work with existing database tables.

## 🧪 Testing

You can test the API using:
- **Django REST Framework Browsable API**: Visit `http://127.0.0.1:8000/api/` in your browser
- **Postman/Insomnia**: Import the API endpoints
- **cURL**: Command-line testing

Example cURL request:
```bash
# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Get clients
curl http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token your-token-here"
```

## 📝 Notes

- All endpoints require authentication except `/api/auth/login/`
- All data is automatically scoped to the authenticated user's account
- Pagination is enabled by default (50 items per page)
- Use `?page=2` to navigate through paginated results

## 🚧 Troubleshooting

### Database Connection Issues
Make sure your local Supabase instance is running:
```bash
supabase start
```

### Migration Issues
Since tables already exist:
```bash
python manage.py migrate --run-syncdb --fake-initial
```

### Permission Issues
Recreate content types and permissions:
```bash
python manage.py migrate contenttypes
python manage.py migrate auth
```

## 📄 License

This project is proprietary and confidential.
