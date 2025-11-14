# 🔐 SSL Certificate Mismatch - SOLUTION

## Problem
Your SSL certificate is for **`backend.onsync-test.xyz`** only, but your nginx configuration includes **`www.backend.onsync-test.xyz`**, causing certificate mismatch errors.

## Root Cause
```
Certificate domains: backend.onsync-test.xyz
Nginx server_name: backend.onsync-test.xyz www.backend.onsync-test.xyz
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         This is NOT in certificate!
```

## Solution

### On Your Production Server, Run:

```bash
cd ~/Client-Management-CRM
bash complete_fix.sh
```

This script will:
1. ✅ Update `.env` with `DEBUG=False` and `ALLOWED_HOSTS=backend.onsync-test.xyz`
2. ✅ Update systemd service with `DEBUG=False` environment variable
3. ✅ Update nginx config to remove `www` subdomain
4. ✅ Restart all services
5. ✅ Test everything

### Manual Steps (if preferred)

#### 1. Update .env
```bash
cd ~/Client-Management-CRM
nano .env
```

Ensure these lines are set:
```env
DEBUG=False
ALLOWED_HOSTS=backend.onsync-test.xyz
```
(Remove `www.backend.onsync-test.xyz` from ALLOWED_HOSTS)

#### 2. Update Systemd Service
```bash
sudo cp deployment/crm-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart crm-backend.service
```

#### 3. Update Nginx
```bash
sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Verify
```bash
# Check service
sudo systemctl status crm-backend.service

# Test API
curl https://backend.onsync-test.xyz/health/
```

## Alternative: Add www to Certificate

If you **want** to use `www.backend.onsync-test.xyz`, update the certificate:

```bash
sudo certbot certonly --nginx \
  -d backend.onsync-test.xyz \
  -d www.backend.onsync-test.xyz \
  --force-renewal
```

Then restart nginx:
```bash
sudo systemctl reload nginx
```

## Test After Fix

```bash
# Should NOT have SSL errors
curl -I https://backend.onsync-test.xyz/health/

# Test signup endpoint
curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
  "account": {
    "name": "Test Company",
    "email": "support@company.com",
    "ceo_name": "John",
    "niche": "Coaching",
    "location": "US",
    "website_url": "https://example.com",
    "timezone": "Africa/Casablanca"
  },
  "user": {
    "name": "ouafi",
    "email": "ouafi@example.com",
    "password": "SecurePass123!",
    "phone_number": "+212620219605",
    "job_role": "CEO"
  }
}'
```

## Expected Result

✅ No SSL certificate errors  
✅ No DisallowedHost errors  
✅ DEBUG=False (no HTML error pages)  
✅ Proper JSON error responses  

## What Changed

### Before:
```nginx
server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;
```

### After:
```nginx
server_name backend.onsync-test.xyz;
```

### Systemd Service Added:
```ini
Environment="DEBUG=False"
Environment="ALLOWED_HOSTS=backend.onsync-test.xyz"
```

---

**TL;DR**: Your certificate doesn't include `www` subdomain. Run `bash complete_fix.sh` to remove it from nginx and systemd configs.
