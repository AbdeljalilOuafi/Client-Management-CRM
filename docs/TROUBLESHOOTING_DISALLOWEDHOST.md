# 🔧 Troubleshooting: DisallowedHost Error

## Problem
Getting `DisallowedHost` error despite having the domain in `.env`:
```
DisallowedHost at /api/auth/signup/
Invalid HTTP_HOST header: 'backend.onsync-test.xyz'. You may need to add 'backend.onsync-test.xyz' to ALLOWED_HOSTS.
```

## Root Cause
Django is not reading the `.env` file correctly, causing:
1. `DEBUG` defaults to `True` (that's why you see HTML error page)
2. `ALLOWED_HOSTS` is not being parsed correctly

## Solution

### Step 1: Verify .env File Location
The `.env` file MUST be in the project root (same directory as `manage.py`):

```bash
cd ~/Client-Management-CRM
ls -la .env
```

Expected output should show `.env` file exists.

### Step 2: Verify .env File Contents
Make sure your `.env` file has these exact lines (no extra spaces):

```bash
cat ~/Client-Management-CRM/.env
```

Should include:
```env
DEBUG=False
ALLOWED_HOSTS=backend.onsync-test.xyz,www.backend.onsync-test.xyz
DATABASE_URL=postgresql://postgres.iqsugeurjktibkalmsim:GRnjFJylmJmBcxnt@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
CORS_ALLOWED_ORIGINS=https://frontend.onsync-test.xyz,https://www.frontend.onsync-test.xyz
SECRET_KEY=6=_5$_cu1f#q$*^4v@$#bl+5obwam4-ajfrd!%u8)d^di4sads
DJANGO_LOG_LEVEL=INFO
```

**Important Notes:**
- NO spaces around `=` sign
- NO quotes around values (django-environ handles them)
- Comma-separated values with NO spaces after commas

### Step 3: Test Environment Loading
Run the test script to verify .env is being read:

```bash
cd ~/Client-Management-CRM
source venv/bin/activate
python test_env_loading.py
```

This will show you exactly what Django is reading from your `.env` file.

### Step 4: Restart the Service
After updating `.env`, you MUST restart the service:

```bash
sudo systemctl restart crm-backend.service
sudo systemctl status crm-backend.service
```

### Step 5: Verify Settings
Test that Django is reading the correct settings:

```bash
cd ~/Client-Management-CRM
source venv/bin/activate
python manage.py shell
```

Then in the shell:
```python
from django.conf import settings
print(f"DEBUG: {settings.DEBUG}")
print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
```

Expected output:
```
DEBUG: False
ALLOWED_HOSTS: ['backend.onsync-test.xyz', 'www.backend.onsync-test.xyz']
```

## Common Mistakes

### ❌ Wrong .env Format
```env
# WRONG - has spaces
ALLOWED_HOSTS = backend.onsync-test.xyz, www.backend.onsync-test.xyz

# WRONG - has quotes
ALLOWED_HOSTS="backend.onsync-test.xyz,www.backend.onsync-test.xyz"

# WRONG - has spaces after comma
ALLOWED_HOSTS=backend.onsync-test.xyz, www.backend.onsync-test.xyz
```

### ✅ Correct .env Format
```env
# CORRECT - no spaces, no quotes
ALLOWED_HOSTS=backend.onsync-test.xyz,www.backend.onsync-test.xyz
```

### ❌ Wrong .env Location
```bash
# WRONG - in deployment folder
/home/ubuntu/Client-Management-CRM/deployment/.env

# WRONG - in config folder
/home/ubuntu/Client-Management-CRM/config/.env
```

### ✅ Correct .env Location
```bash
# CORRECT - in project root
/home/ubuntu/Client-Management-CRM/.env
```

### ❌ Forgot to Restart Service
After changing `.env`, if you don't restart the service, the old settings are still in memory!

```bash
# ALWAYS restart after changing .env
sudo systemctl restart crm-backend.service
```

## Quick Fix Command

Run this on your production server:

```bash
# 1. Go to project directory
cd ~/Client-Management-CRM

# 2. Backup current .env
cp .env .env.backup

# 3. Create new .env with correct format
cat > .env << 'EOF'
SECRET_KEY=6=_5$_cu1f#q$*^4v@$#bl+5obwam4-ajfrd!%u8)d^di4sads
DEBUG=False
ALLOWED_HOSTS=backend.onsync-test.xyz,www.backend.onsync-test.xyz
DATABASE_URL=postgresql://postgres.iqsugeurjktibkalmsim:GRnjFJylmJmBcxnt@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
CORS_ALLOWED_ORIGINS=https://frontend.onsync-test.xyz,https://www.frontend.onsync-test.xyz
DJANGO_LOG_LEVEL=INFO
EOF

# 4. Verify file was created correctly
cat .env

# 5. Test environment loading
source venv/bin/activate
python test_env_loading.py

# 6. Restart service
sudo systemctl restart crm-backend.service

# 7. Check service status
sudo systemctl status crm-backend.service

# 8. Check logs
sudo journalctl -u crm-backend.service -n 50 --no-pager

# 9. Test the API
curl -I https://backend.onsync-test.xyz/health/
```

## Still Not Working?

### Check Service Environment File Path
The systemd service file should point to the correct `.env` file:

```bash
sudo cat /etc/systemd/system/crm-backend.service | grep EnvironmentFile
```

Should show:
```
EnvironmentFile=/home/ubuntu/Client-Management-CRM/.env
```

If it's wrong, update it:
```bash
sudo nano /etc/systemd/system/crm-backend.service
```

Then reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart crm-backend.service
```

### Check File Permissions
Make sure the service can read the `.env` file:

```bash
ls -la ~/Client-Management-CRM/.env
```

Should be owned by `ubuntu` or readable by all:
```bash
chmod 644 ~/Client-Management-CRM/.env
```

### Check for Hidden Characters
Sometimes copying `.env` content can introduce hidden characters:

```bash
cat -A ~/Client-Management-CRM/.env
```

Should NOT show any `^M` or weird characters at line ends.

## Expected Behavior After Fix

1. ✅ `DEBUG=False` → Error pages show generic error (not detailed traceback)
2. ✅ `ALLOWED_HOSTS` correctly includes `backend.onsync-test.xyz`
3. ✅ API requests to `https://backend.onsync-test.xyz/` work without `DisallowedHost` error
4. ✅ CORS allows requests from `frontend.onsync-test.xyz`

---

**Need more help?** Run `python test_env_loading.py` and share the output!
