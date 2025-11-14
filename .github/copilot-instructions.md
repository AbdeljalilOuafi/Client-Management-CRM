# Client Management CRM - AI Coding Agent Instructions

## Project Overview
Multi-tenant B2B CRM system with Django REST backend and Next.js frontend. Features account-scoped data isolation, role-based access control (SuperAdmin/Admin/Employee), and custom token authentication. Built to work with existing Supabase database tables (`managed = False` models).

## Critical Architecture Concepts

### 1. Multi-Tenancy & Data Isolation
- **All models have `account_id`** - every query MUST filter by `request.user.account_id`
- ViewSets use `get_queryset()` to automatically scope data to user's account
- Example pattern in every ViewSet:
  ```python
  def get_queryset(self):
      return Model.objects.filter(account_id=self.request.user.account_id)
  ```
- Packages are account-specific with `unique_together = [['account', 'package_name']]`

### 2. Custom Authentication System
- **NOT using DRF's default Token model** - uses custom `EmployeeToken` model
- Authentication class: `api.authentication.EmployeeTokenAuthentication`
- Token table: `employee_tokens` (NOT `authtoken_token`)
- Always use `EmployeeToken.objects.get_or_create(user=user)` for token management
- See `docs/EMPLOYEE_TOKEN_IMPLEMENTATION.md` for conflict resolution details

### 3. Unmanaged Models (`managed = False`)
- **All models are `managed = False`** - Django doesn't create/modify database tables
- Database schema is managed by Supabase migrations in `supabase/migrations/`
- Never run `makemigrations` or `migrate` expecting table changes
- Use `migrate --run-syncdb` to create Django's internal tables (contenttypes, sessions)
- When modifying models, create corresponding SQL migration in `supabase/migrations/`

### 4. Custom User Model
- Custom user model: `Employee` (extends `AbstractBaseUser, PermissionsMixin`)
- **NOT using Django's `auth_user`** table
- Settings: `AUTH_USER_MODEL = 'api.Employee'`
- Username field: `email` (not username)
- Required fields: `['name']`
- Roles: `super_admin`, `admin`, `employee`, `coach`, `closer`, `setter`

## Development Workflow

### Backend Development
```bash
# Start local Supabase (required for database)
supabase start

# Activate virtual environment
source venv/bin/activate

# Run development server
python manage.py runserver

# Quick start with checks
./scripts/start.sh
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### API Testing
- Browsable API: `http://127.0.0.1:8000/api/`
- All endpoints require `Authorization: Token <token>` header except `/api/auth/login/` and `/api/auth/signup/`
- Test scripts available in `scripts/` (e.g., `test_login.sh`, `test_signup.sh`)

### Database Changes
1. Create SQL migration in `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Apply locally: `supabase migration up`
3. Update Django model to match (keep `managed = False`)
4. Update serializers if fields changed
5. Deploy: `supabase db push` for production

## Permission Patterns

### ViewSet Permission Combinations
- `IsAuthenticated + IsAccountMember` - Standard for all data access
- `IsSuperAdminOrAdmin` - Admin-only create/delete operations
- `CanManageEmployees` - Employee management (Admin can't modify SuperAdmin)
- `IsSelfOrAdmin` - Profile updates (own profile or admin)

### Permission Removal Pattern
**All authenticated account members can CRUD clients, packages, client-packages, payments, installments** - previously restrictive permissions were removed. Only Employee management remains restricted.

## Code Patterns & Conventions

### Creating Account-Scoped Resources
```python
def perform_create(self, serializer):
    serializer.save(account_id=self.request.user.account_id)
```

### Client Relationship Queries
Clients have three employee relationships: `coach`, `closer`, `setter`
```python
# Get user's assigned clients
queryset.filter(
    Q(coach=request.user) |
    Q(closer=request.user) |
    Q(setter=request.user)
).distinct()
```

### ViewSet Action Pattern
Use `@action` decorator for custom endpoints:
```python
@action(detail=False, methods=['get'])
def statistics(self, request):
    # Custom aggregation logic
    return Response(stats)
```

### Authentication in Views
```python
# Login: create/get token
token, _ = EmployeeToken.objects.get_or_create(user=user)

# Logout: delete token
request.user.auth_token.delete()
```

## Frontend Architecture

### API Client Pattern
- Base API URL hardcoded: `https://backend.onsync-test.xyz/api`
- Shared utilities in `frontend/lib/api/apiClient.ts`
- Token stored in localStorage as `auth_token`
- Auto-redirect to `/login` on 401 responses
- Each domain has its own API module (auth, clients, staff, payments, instalments)

### Auth Flow
1. Login → receive token → store in localStorage (`auth_token`, `accountId`, `user`)
2. All API calls include `Authorization: Token <token>` header
3. 401 response → clear localStorage → redirect to `/login`

### Page Structure
- App router with TypeScript
- Shadcn UI components in `components/ui/`
- Client-side auth guard: `components/AuthGuard.tsx`
- Root page redirects to `/clients`

## Common Pitfalls & Solutions

### ❌ DON'T: Use DRF's Token model
```python
from rest_framework.authtoken.models import Token  # WRONG
```
### ✅ DO: Use EmployeeToken
```python
from api.models import EmployeeToken
```

### ❌ DON'T: Query without account filter
```python
Client.objects.all()  # Exposes all accounts' data
```
### ✅ DO: Always scope by account
```python
Client.objects.filter(account_id=request.user.account_id)
```

### ❌ DON'T: Try to migrate model changes
```python
python manage.py makemigrations  # Won't work - tables are managed=False
```
### ✅ DO: Create SQL migration
```bash
# Create in supabase/migrations/
supabase migration up
```

### ❌ DON'T: Add permissions for CRUD on clients/packages/payments
```python
permission_classes = [IsAuthenticated, IsSuperAdminOrAdmin]  # Too restrictive
```
### ✅ DO: Allow all authenticated account members
```python
permission_classes = [IsAuthenticated, IsAccountMember]
```

## Key Files Reference

- **Settings**: `config/settings.py` - Uses django-environ, custom auth config
- **Models**: `api/models.py` - All models with `managed = False`
- **Authentication**: `api/authentication.py` - Custom EmployeeTokenAuthentication
- **Permissions**: `api/permissions.py` - Account-scoped permission classes
- **Views**: `api/views.py` - DRF ViewSets with account filtering
- **URLs**: `api/urls.py` - Router registration
- **Frontend API**: `frontend/lib/api/*.ts` - API client modules
- **Deployment**: `deployment/` - systemd service, nginx config, instructions

## Environment Configuration

### Local Development (.env)
- Database: Local Supabase at `127.0.0.1:54322`
- `DEBUG=True`, `ALLOWED_HOSTS=localhost,127.0.0.1`
- CORS allows all origins when `DEBUG=True`

### Production
- Use `DATABASE_URL` environment variable (django-environ parses it)
- `DEBUG=False` enables security settings (SSL redirect, secure cookies, HSTS)
- Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` appropriately
- Deployment via systemd + gunicorn + nginx (see `deployment/DEPLOYMENT_INSTRUCTIONS.md`)

## Testing & Debugging

- Use browsable API for quick endpoint testing
- Check service logs: `sudo journalctl -u crm-backend.service -f`
- Test scripts in `scripts/` directory demonstrate API usage
- Frontend uses React Query for data fetching and caching
