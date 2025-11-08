# 🚀 Deployment Files Installation Guide

This folder contains the production configuration files for deploying the CRM backend.

## 📁 Files in This Directory

1. **`crm-backend.socket`** - systemd socket file
2. **`crm-backend.service`** - systemd service file
3. **`nginx-crm-backend.conf`** - Nginx configuration
4. **`INSTALLATION.md`** - This file

---

## 🔧 Installation Steps

### Step 1: Install systemd Service Files

```bash
# Copy socket file
sudo cp deployment/crm-backend.socket /etc/systemd/system/

# Copy service file
sudo cp deployment/crm-backend.service /etc/systemd/system/

# Set proper permissions
sudo chmod 644 /etc/systemd/system/crm-backend.socket
sudo chmod 644 /etc/systemd/system/crm-backend.service

# Reload systemd
sudo systemctl daemon-reload
```

### Step 2: Create Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/crm-backend

# Set ownership
sudo chown www-data:www-data /var/log/crm-backend

# Set permissions
sudo chmod 755 /var/log/crm-backend
```

### Step 3: Enable and Start Services

```bash
# Enable socket (starts on boot)
sudo systemctl enable crm-backend.socket

# Enable service (starts on boot)
sudo systemctl enable crm-backend.service

# Start socket
sudo systemctl start crm-backend.socket

# Start service
sudo systemctl start crm-backend.service

# Check status
sudo systemctl status crm-backend.service
```

### Step 4: Install Nginx Configuration

**BEFORE SSL Certificate:**

```bash
# Create a temporary Nginx config without SSL
sudo tee /etc/nginx/sites-available/crm-backend << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://unix:/run/crm-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: Obtain SSL Certificate

```bash
# Create certbot directory
sudo mkdir -p /var/www/certbot

# Obtain SSL certificate
sudo certbot --nginx -d backend.onsync-test.xyz -d www.backend.onsync-test.xyz

# Certbot will automatically update the Nginx configuration
```

**OR manually install the full configuration:**

```bash
# After getting SSL certificate, install full config
sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Verification

### Check systemd Service

```bash
# Check service status
sudo systemctl status crm-backend.service

# Check if service is enabled
sudo systemctl is-enabled crm-backend.service

# View recent logs
sudo journalctl -u crm-backend.service -n 50

# Follow logs in real-time
sudo journalctl -u crm-backend.service -f
```

### Check Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/crm-backend-access.log

# View error logs
sudo tail -f /var/log/nginx/crm-backend-error.log
```

### Test Application

```bash
# Test health endpoint
curl http://localhost:8002/health/

# Test via Nginx (HTTP)
curl http://backend.onsync-test.xyz/health/

# Test via Nginx (HTTPS - after SSL)
curl https://backend.onsync-test.xyz/health/

# Test API root
curl https://backend.onsync-test.xyz/api/
```

---

## 🔍 Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status crm-backend.service

# View detailed logs
sudo journalctl -u crm-backend.service -n 100 --no-pager

# Check if socket exists
ls -la /run/crm-backend.sock

# Check permissions
ls -la /var/www/crm-backend
```

### 502 Bad Gateway

```bash
# Check if Gunicorn is running
sudo systemctl status crm-backend.service

# Check socket permissions
ls -la /run/crm-backend.sock

# Check Nginx can access socket
sudo -u www-data test -r /run/crm-backend.sock && echo "OK" || echo "FAIL"

# Check Nginx error logs
sudo tail -f /var/log/nginx/crm-backend-error.log
```

### Permission Errors

```bash
# Fix application ownership
sudo chown -R www-data:www-data /var/www/crm-backend

# Fix log directory
sudo chown -R www-data:www-data /var/log/crm-backend

# Fix static files
sudo chown -R www-data:www-data /var/www/crm-backend/staticfiles
```

### Environment Variables Not Loading

```bash
# Check .env file exists
ls -la /var/www/crm-backend/.env

# Check .env permissions (should be 600)
stat /var/www/crm-backend/.env

# Verify service file loads .env
sudo systemctl cat crm-backend.service | grep EnvironmentFile
```

---

## 🔄 Common Operations

### Restart Services

```bash
# Restart application
sudo systemctl restart crm-backend.service

# Restart Nginx
sudo systemctl restart nginx

# Restart both
sudo systemctl restart crm-backend.service nginx
```

### View Logs

```bash
# Application logs
sudo journalctl -u crm-backend.service -f

# Gunicorn access log
sudo tail -f /var/log/crm-backend/access.log

# Gunicorn error log
sudo tail -f /var/log/crm-backend/error.log

# Nginx access log
sudo tail -f /var/log/nginx/crm-backend-access.log

# Nginx error log
sudo tail -f /var/log/nginx/crm-backend-error.log
```

### Deploy Code Updates

```bash
# Pull latest code
cd /var/www/crm-backend
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt --upgrade

# Collect static files
python manage.py collectstatic --noinput

# Restart service
sudo systemctl restart crm-backend.service

# Check status
sudo systemctl status crm-backend.service
```

---

## 📊 Service Configuration Details

### systemd Service Settings

- **User/Group**: `www-data` (standard web server user)
- **Workers**: 3 Gunicorn workers
- **Timeout**: 120 seconds
- **Socket**: `/run/crm-backend.sock`
- **Logs**: `/var/log/crm-backend/`

### Nginx Configuration

- **Upstream**: Unix socket at `/run/crm-backend.sock`
- **Max Upload Size**: 20 MB
- **Timeouts**: 120 seconds
- **SSL**: TLS 1.2+ with modern ciphers
- **Security Headers**: HSTS, X-Frame-Options, CSP, etc.

---

## 🔒 Security Checklist

After installation, verify:

- [ ] Service runs as `www-data` (not root)
- [ ] `.env` file permissions are 600
- [ ] SSL certificate is valid
- [ ] HTTPS redirect working
- [ ] Security headers present in response
- [ ] Firewall allows ports 80 and 443
- [ ] SSH configured with key-based auth
- [ ] Database password is strong
- [ ] `DEBUG=False` in production

---

## 📝 Notes

1. **Socket vs Port**: This configuration uses a Unix socket instead of TCP port for better performance and security.

2. **Auto-Restart**: systemd will automatically restart the service if it crashes.

3. **Log Rotation**: You may want to configure logrotate for the application logs:
   ```bash
   sudo nano /etc/logrotate.d/crm-backend
   ```

4. **Monitoring**: Consider setting up monitoring (Uptime Kuma, Prometheus, etc.) to track service health.

5. **Backups**: The service configuration doesn't include database backups. Set those up separately.

---

## 🆘 Emergency Commands

```bash
# Stop everything
sudo systemctl stop crm-backend.service nginx

# Start everything
sudo systemctl start crm-backend.service nginx

# Check what's listening on ports
sudo ss -tlnp | grep -E ':(80|443|8002)'

# Kill all Gunicorn processes (emergency only)
sudo pkill -f gunicorn

# Then start service again
sudo systemctl start crm-backend.service
```

---

**For full deployment guide, see: `PRODUCTION_DEPLOYMENT_GUIDE.md`**
