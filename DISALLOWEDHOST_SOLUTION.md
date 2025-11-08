# 🚨 DisallowedHost Error - Solution

## Problem
Django is reading `.env` correctly when tested directly, but the systemd service is still getting `DisallowedHost` errors.

## Root Cause
**Systemd's `EnvironmentFile` and `django-environ` are separate mechanisms.** The systemd service file on your server likely wasn't updated after the code changes.

## Solution

Run these commands on your production server:

### Option 1: Quick Fix (Recommended)
```bash
cd ~/Client-Management-CRM

# 1. Update the service file
sudo cp deployment/crm-backend.service /etc/systemd/system/

# 2. Reload systemd
sudo systemctl daemon-reload

# 3. Restart service
sudo systemctl restart crm-backend.service

# 4. Check status
sudo systemctl status crm-backend.service

# 5. Watch logs while testing
sudo journalctl -u crm-backend.service -f
```

Then make your Postman request in another terminal and watch the logs.

### Option 2: Automated Fix
```bash
cd ~/Client-Management-CRM
bash fix_systemd_service.sh
```

### Option 3: Diagnostic First
If you want to see what's wrong:
```bash
cd ~/Client-Management-CRM
bash diagnose.sh
```

## What Changed

Updated `deployment/crm-backend.service`:
- Added `-` prefix to `EnvironmentFile` (makes it optional, won't fail if missing)
- Added full PATH including system binaries
- Added `PYTHONUNBUFFERED=1` for better logging

## Verify It Works

After restarting the service, check:

```bash
# 1. Service is running
sudo systemctl status crm-backend.service

# 2. Check Gunicorn process environment
ps aux | grep gunicorn
pgrep -f "gunicorn.*config.wsgi" | head -1 | xargs -I{} sudo cat /proc/{}/environ | tr '\0' '\n' | grep DEBUG

# 3. Test the API
curl -I https://backend.onsync-test.xyz/health/

# 4. Test signup endpoint
curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

## If Still Not Working

The issue might be that Gunicorn is caching the WSGI application. Try:

```bash
# Kill all Gunicorn workers
sudo pkill -9 -f gunicorn

# Restart service
sudo systemctl restart crm-backend.service

# Watch logs
sudo journalctl -u crm-backend.service -f
```

## Debug Commands

```bash
# See what environment variables Gunicorn has
GUNICORN_PID=$(pgrep -f "gunicorn.*config.wsgi" | head -1)
sudo cat /proc/$GUNICORN_PID/environ | tr '\0' '\n'

# Check if DEBUG is set correctly
sudo cat /proc/$GUNICORN_PID/environ | tr '\0' '\n' | grep DEBUG

# Check if ALLOWED_HOSTS is set correctly
sudo cat /proc/$GUNICORN_PID/environ | tr '\0' '\n' | grep ALLOWED_HOSTS
```

## Expected Result

After fix:
- ✅ Service restarts successfully
- ✅ No `DisallowedHost` errors in logs
- ✅ API responds with proper JSON errors (not HTML)
- ✅ Postman requests work

## Key Files

1. **Service file**: `/etc/systemd/system/crm-backend.service`
2. **Environment file**: `/home/ubuntu/Client-Management-CRM/.env`
3. **Settings**: `/home/ubuntu/Client-Management-CRM/config/settings.py`
4. **Logs**: `sudo journalctl -u crm-backend.service`

---

**TL;DR**: Run `sudo cp deployment/crm-backend.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl restart crm-backend.service`
