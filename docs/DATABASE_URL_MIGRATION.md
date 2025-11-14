# 🔄 Migration to DATABASE_URL

## What Changed

The `settings.py` file has been updated to use `django-environ` for environment variable management, specifically to support the `DATABASE_URL` format.

### Benefits

✅ **Single connection string** - No need for separate DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT variables  
✅ **Industry standard** - DATABASE_URL is widely used in Django deployments (Heroku, Railway, etc.)  
✅ **Easier deployment** - Copy-paste one connection string instead of 5 separate values  
✅ **Better parsing** - `django-environ` handles URL parsing automatically  

## Changes Made

### 1. Updated Dependencies

**Installed:** `django-environ`

```bash
pip install django-environ
```

### 2. Updated `config/settings.py`

**Before:**
```python
from dotenv import load_dotenv
load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '54322'),
    }
}
```

**After:**
```python
import environ

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

DATABASES = {
    'default': env.db('DATABASE_URL', default='postgresql://postgres:postgres@127.0.0.1:54322/postgres')
}
```

### 3. Updated `.env.template`

Added `DATABASE_URL` format with examples:
```env
# Local Supabase:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Production Supabase:
# DATABASE_URL=postgresql://postgres:your-password@db.iqsugeurjktibkalmsim.supabase.co:5432/postgres
```

### 4. Updated `.env.production.template`

Added `DATABASE_URL` as the recommended approach with legacy options commented out.

## How to Use

### Local Development

Update your `.env` file:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Production

Update your `.env` file on the server:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqsugeurjktibkalmsim.supabase.co:5432/postgres
```

## DATABASE_URL Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Examples:**

```bash
# Local Supabase (default port 54322)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Production Supabase
DATABASE_URL=postgresql://postgres:securepass123@db.iqsugeurjktibkalmsim.supabase.co:5432/postgres

# With special characters in password (URL-encode them)
DATABASE_URL=postgresql://postgres:p%40ssw%24rd@host:5432/db
```

## Other Improvements

Also updated these to use `django-environ`:

✅ `SECRET_KEY` - `env('SECRET_KEY', default='...')`  
✅ `DEBUG` - `env('DEBUG')` (auto-converts to boolean)  
✅ `ALLOWED_HOSTS` - `env.list('ALLOWED_HOSTS', default=[...])`  
✅ `CORS_ALLOWED_ORIGINS` - `env.list('CORS_ALLOWED_ORIGINS', default=[...])`  
✅ `DJANGO_LOG_LEVEL` - `env('DJANGO_LOG_LEVEL', default='INFO')`  

## Testing

Test the configuration:

```bash
# Activate your virtual environment
source venv/bin/activate

# Run Django checks
python manage.py check

# Test database connection
python manage.py dbshell
\q

# Run migrations (if needed)
python manage.py migrate

# Start development server
python manage.py runserver
```

## Rollback (if needed)

If you need to rollback to the old format:

1. Uninstall: `pip uninstall django-environ`
2. Restore old settings from git: `git checkout HEAD -- config/settings.py`
3. Use old `.env` format with separate DB_* variables

## Next Steps

1. ✅ Update your local `.env` file with DATABASE_URL
2. ✅ Test locally: `python manage.py check && python manage.py runserver`
3. ✅ Update production `.env` file with DATABASE_URL
4. ✅ Restart production service: `sudo systemctl restart crm-backend.service`

---

**Note:** The old `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` variables are no longer needed and can be removed from your `.env` file.
