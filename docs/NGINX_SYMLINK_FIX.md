# 🔗 Missing Nginx Symlink - Quick Fix

## Problem
The nginx configuration file exists in `sites-available` but the symlink in `sites-enabled` is missing, so nginx isn't serving your CRM backend.

## Quick Fix

Run these commands on your production server:

```bash
cd ~/Client-Management-CRM

# Copy nginx config
sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend

# Create symlink
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/crm-backend

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Verify
ls -la /etc/nginx/sites-enabled/crm-backend
```

## Or Use the Script

```bash
cd ~/Client-Management-CRM
bash setup_nginx.sh
```

## Verify It Works

```bash
# Check enabled sites
ls -1 /etc/nginx/sites-enabled/

# Should include:
# - crm-backend  ✅ (this should now appear)
# - cronehook-backend
# - cronehook-frontend
# - n8n
# - slack.onsync.ai
# - url_shortener

# Test the API
curl -I https://backend.onsync-test.xyz/health/
```

## Expected Output

```
HTTP/2 200
server: nginx
...
```

If you still get connection errors, check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

## Complete Fix

To fix everything (nginx + DEBUG + ALLOWED_HOSTS), run:

```bash
cd ~/Client-Management-CRM
bash complete_fix.sh
```

This will:
1. ✅ Fix `.env` file (DEBUG=False, ALLOWED_HOSTS)
2. ✅ Update systemd service
3. ✅ Setup nginx with symlink
4. ✅ Restart all services
5. ✅ Test everything

---

**TL;DR**: Run `bash setup_nginx.sh` or `bash complete_fix.sh`
