# EmployeeToken Implementation - Conflict Resolution

## Problem

The original implementation used Django REST Framework's default `authtoken_token` table which had a foreign key constraint pointing to `auth_user`. This caused conflicts because:

1. **Two applications using the same database**: Both the old DRF application and this new CRM application share the same Supabase database.
2. **Different user models**: The old application uses `auth_user`, while this CRM uses the custom `Employee` model.
3. **Single token table**: Both applications were trying to use the same `authtoken_token` table, causing foreign key conflicts.

## Solution: Separate Token Tables

We implemented **Option 1: Separate Token Tables** to avoid conflicts between applications.

### Changes Made

#### 1. Database Migration (`20251106092000_fix_authtoken_fk.sql`)

Created a new table `employee_tokens` specifically for the CRM application:

```sql
CREATE TABLE IF NOT EXISTS public.employee_tokens (
    key VARCHAR(40) NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT employee_tokens_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.employees(id) 
        ON DELETE CASCADE
);
```

**Key points:**
- Separate table prevents conflicts with `authtoken_token`
- Foreign key points to `employees` table (custom user model)
- Each user can have only one token (unique index on user_id)

#### 2. New Model (`api/models.py`)

Added `EmployeeToken` model:

```python
class EmployeeToken(models.Model):
    """
    Custom token model for Employee authentication
    Separate from DRF's default Token to avoid conflicts with other applications
    """
    key = models.CharField(max_length=40, primary_key=True)
    user = models.OneToOneField(
        'Employee',
        related_name='auth_token',
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'employee_tokens'

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        return super().save(*args, **kwargs)

    @classmethod
    def generate_key(cls):
        return binascii.hexlify(os.urandom(20)).decode()
```

#### 3. Custom Authentication (`api/authentication.py`)

Created custom authentication class:

```python
class EmployeeTokenAuthentication(TokenAuthentication):
    """
    Custom token authentication using EmployeeToken model
    """
    model = EmployeeToken
    keyword = 'Token'

    def authenticate_credentials(self, key):
        try:
            token = self.model.objects.select_related('user').get(key=key)
        except self.model.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed('User inactive or deleted.')

        return (token.user, token)
```

#### 4. Settings Update (`config/settings.py`)

**Removed** `rest_framework.authtoken` from `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    # 'rest_framework.authtoken',  # Removed
    # ...
]
```

**Updated** REST_FRAMEWORK settings:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.EmployeeTokenAuthentication',  # Custom auth
        'rest_framework.authentication.SessionAuthentication',
    ],
    # ...
}
```

#### 5. Views Update (`api/views.py`)

Updated all authentication endpoints to use `EmployeeToken` instead of `Token`:

**Login:**
```python
token, _ = EmployeeToken.objects.get_or_create(user=user)
```

**Signup:**
```python
token = EmployeeToken.objects.create(user=employee)
```

**Logout:**
```python
request.user.auth_token.delete()
```

## Benefits

✅ **No Conflicts**: Both applications can coexist in the same database
✅ **Clean Separation**: Each application has its own token table
✅ **Independent**: Changes to one application don't affect the other
✅ **Maintains Functionality**: Both applications continue to work as expected
✅ **Future-Proof**: New DRF applications can be added without conflicts

## Database Structure

### Old Application
- Uses `auth_user` table
- Uses `authtoken_token` table
- Foreign key: `authtoken_token.user_id` → `auth_user.id`

### New CRM Application
- Uses `employees` table
- Uses `employee_tokens` table
- Foreign key: `employee_tokens.user_id` → `employees.id`

## Testing

All endpoints tested and working:

1. **Signup**: Creates account + super admin + token ✅
2. **Login**: Returns existing or new token ✅
3. **Me**: Returns user data with token auth ✅
4. **Logout**: Deletes token ✅

### Example Signup Request

```bash
curl -X POST http://127.0.0.1:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "name": "Company Name",
      "email": "company@example.com"
    },
    "user": {
      "name": "Admin Name",
      "email": "admin@example.com",
      "password": "SecurePass123!"
    }
  }'
```

### Example Login Request

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

### Using the Token

```bash
curl -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Migration Notes

When deploying to production (remote Supabase):

1. Apply the migration: `20251106092000_fix_authtoken_fk.sql`
2. This creates the `employee_tokens` table
3. The old `authtoken_token` table remains untouched
4. The old DRF application continues to work normally

## Summary

This implementation provides a clean, conflict-free solution that allows multiple Django REST Framework applications to share the same database while using different user models and authentication systems. The `employee_tokens` table is isolated from the existing `authtoken_token` table, ensuring both applications can operate independently.
