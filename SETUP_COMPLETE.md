# 🚀 Client Management CRM - Setup Complete!

## ✅ What Has Been Created

### Project Structure
```
Client-Management-CRM/
├── config/                 # Django project settings
│   ├── settings.py        # Configuration with Supabase DB
│   ├── urls.py            # Main URL routing
│   └── wsgi.py
├── api/                   # Main application
│   ├── models.py          # Database models (Account, Employee, Client, etc.)
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API ViewSets
│   ├── permissions.py     # Custom permissions
│   ├── urls.py            # API URL routing
│   ├── admin.py           # Django admin configuration
│   └── management/
│       └── commands/
│           └── create_superadmin.py
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (Supabase config)
├── README.md             # Full documentation
├── API_TESTING.md        # API testing guide
└── start.sh              # Quick start script
```

### Features Implemented

✅ **Multi-Tenant Architecture**
- Account-based data isolation
- All queries automatically scoped to user's account

✅ **Authentication & Authorization**
- Custom Employee user model (email-based)
- Token authentication
- Role-based permissions (SuperAdmin, Admin, Employee)

✅ **API Endpoints** (All RESTful)
- `/api/auth/login/` - Login
- `/api/auth/logout/` - Logout
- `/api/auth/me/` - Get current user
- `/api/accounts/` - Account management
- `/api/employees/` - Employee management
- `/api/clients/` - Client management
- `/api/packages/` - Package management
- `/api/client-packages/` - Client-Package assignments
- `/api/payments/` - Payment records (read-only)
- `/api/installments/` - Installment management
- `/api/stripe-customers/` - Stripe customer data

✅ **Advanced Features**
- Pagination (50 items per page)
- Filtering and search
- Sorting/ordering
- Permission management
- Statistics endpoints
- Django admin panel

## 🎯 Quick Start

### 1. Ensure Supabase is Running

```bash
supabase start
```

Verify database is accessible at `127.0.0.1:54322`

### 2. Activate Virtual Environment

```bash
cd /home/ouafi/Projects/Client-Management-CRM
source venv/bin/activate
```

### 3. Create Test Data (if needed)

If your database doesn't have an account, create one via SQL or Supabase Studio:

```sql
INSERT INTO accounts (name, email, created_at, updated_at)
VALUES ('Test Company', 'test@company.com', NOW(), NOW());
```

### 4. Create SuperAdmin User

```bash
python manage.py create_superadmin --email=admin@example.com --password=admin123 --name="Super Admin"
```

Or use the quick start script:

```bash
./start.sh
```

### 5. Start the Server

```bash
python manage.py runserver
```

### 6. Test the API

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Get clients (use token from login response)
curl http://127.0.0.1:8000/api/clients/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## 📖 Documentation

- **Full README**: `README.md`
- **API Testing Guide**: `API_TESTING.md`
- **Django Admin**: http://127.0.0.1:8000/admin/
- **Browsable API**: http://127.0.0.1:8000/api/

## 🔑 Default Credentials

**SuperAdmin:**
- Email: `admin@example.com`
- Password: `admin123`
- ⚠️ **Change this password immediately in production!**

## 🗄️ Database Connection

The application connects to your local Supabase instance:

```
Host: 127.0.0.1
Port: 54322
Database: postgres
User: postgres
Password: postgres
```

All configuration is in `.env` file.

## 📊 Database Models

The following models map to existing Supabase tables:

1. **Account** → `accounts`
2. **Employee** → `employees` (Custom User Model)
3. **Client** → `clients`
4. **Package** → `packages`
5. **ClientPackage** → `client_packages`
6. **Payment** → `payments`
7. **Installment** → `instalments`
8. **StripeCustomer** → `stripe_customers`

All models have `managed = False` to prevent Django from modifying existing tables.

## 🛡️ Security Features

✅ Password hashing with Django's PBKDF2 algorithm
✅ Token-based authentication
✅ Role-based access control
✅ Account-scoped queries
✅ Permission system
✅ CORS configuration
✅ SQL injection protection (Django ORM)

## 🧪 Testing

### Using cURL
See `API_TESTING.md` for comprehensive examples.

### Using Python
```python
import requests

# Login
response = requests.post(
    "http://127.0.0.1:8000/api/auth/login/",
    json={"email": "admin@example.com", "password": "admin123"}
)
token = response.json()['token']

# Get clients
response = requests.get(
    "http://127.0.0.1:8000/api/clients/",
    headers={"Authorization": f"Token {token}"}
)
print(response.json())
```

### Using Django Admin
Navigate to http://127.0.0.1:8000/admin/ and login with your superadmin credentials.

## 🔄 Next Steps

1. **Create Employees**
   - Use `/api/employees/` to create admin and employee users
   - Assign appropriate roles and permissions

2. **Add Clients**
   - Use `/api/clients/` to add client records
   - Assign coaches, closers, and setters

3. **Manage Packages**
   - Create packages via `/api/packages/`
   - Assign packages to clients via `/api/client-packages/`

4. **Monitor Payments**
   - View payment history via `/api/payments/`
   - Check payment statistics

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if Supabase is running
supabase status

# Start Supabase if not running
supabase start
```

### No Accounts Found
```sql
-- Create an account via SQL
INSERT INTO accounts (name, email, created_at, updated_at)
VALUES ('Your Company', 'contact@yourcompany.com', NOW(), NOW());
```

### Migration Issues
```bash
# Fake migrations since tables exist
python manage.py migrate --fake
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## 📞 Support

For issues or questions, check:
1. README.md - Full documentation
2. API_TESTING.md - API examples
3. Django logs - Server console output

## 🎉 Success!

Your Client Management CRM backend is now ready to use! 

Start building your frontend or integrate with existing applications using the RESTful API.

Happy coding! 🚀
