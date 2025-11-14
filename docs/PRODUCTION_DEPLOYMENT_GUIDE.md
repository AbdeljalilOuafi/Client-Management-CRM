# 🚀 Production Deployment Guide - Django CRM Backend

## Overview
This guide covers deploying the Django REST Framework backend to production on a Linux server with:
- **Backend Domain**: `backend.onsync-test.xyz`
- **Frontend Domain**: `frontend.onsync-test.xyz`
- **Port**: 8002
- **Web Server**: Nginx with SSL (HTTPS)
- **Process Manager**: systemd

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Linux server with sudo access
- [ ] Python 3.10+ installed
- [ ] Nginx installed
- [ ] Git installed
- [ ] PostgreSQL client (psycopg2 dependencies)
- [ ] Domain DNS configured:
  - `backend.onsync-test.xyz` → Server IP
  - `frontend.onsync-test.xyz` → Server IP

---

## Step 1: Server Preparation

### 1.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Dependencies

```bash
# Install Python and development tools
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install PostgreSQL client libraries
sudo apt install -y libpq-dev build-essential

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL certificates
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

---

## Step 2: Clone Repository and Setup Application

### 2.1 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/crm-backend
sudo chown $USER:$USER /var/www/crm-backend
cd /var/www/crm-backend
```

### 2.2 Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/AbdeljalilOuafi/Client-Management-CRM.git .

# Or if you have SSH key configured
git clone git@github.com:AbdeljalilOuafi/Client-Management-CRM.git .
```

### 2.3 Create Python Virtual Environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 2.4 Install Python Dependencies

```bash
# Install from requirements.txt
pip install -r requirements.txt

# Install production server (Gunicorn)
pip install gunicorn

# Verify installation
pip list
```

---

## Step 3: Configure Environment Variables

### 3.1 Create Production Environment File

```bash
# Create .env file
nano .env
```

### 3.2 Add Environment Variables

```env
# Django Settings
SECRET_KEY='your-super-secret-production-key-change-this-now'
DEBUG=False
ALLOWED_HOSTS=backend.onsync-test.xyz,www.backend.onsync-test.xyz

# Database Settings (Supabase Production)
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_production_password
DB_HOST=db.iqsugeurjktibkalmsim.supabase.co
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=https://frontend.onsync-test.xyz,https://www.frontend.onsync-test.xyz

# Logging
DJANGO_LOG_LEVEL=INFO
```

**Important**: 
- Replace `your-super-secret-production-key-change-this-now` with a strong secret key
- Use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` to generate one
- Get Supabase production credentials from your Supabase dashboard

### 3.3 Secure the .env File

```bash
# Set proper permissions
chmod 600 .env
```

---

## Step 4: Update Django Settings for Production

### 4.1 Update settings.py

The settings need to be updated to handle production properly:

```python
# config/settings.py changes needed:

# Update ALLOWED_HOSTS
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Update CORS settings for production
CORS_ALLOW_ALL_ORIGINS = DEBUG  # False in production
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

# Add security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Static files for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

Let me create the updated settings file:

---

## Step 5: Prepare Django Application

### 5.1 Collect Static Files

```bash
# Activate virtual environment if not already active
source venv/bin/activate

# Collect static files
python manage.py collectstatic --noinput
```

### 5.2 Run Django Migrations (Fake)

```bash
# Since tables already exist in Supabase, fake the migrations
python manage.py migrate --fake
```

### 5.3 Test Django Server

```bash
# Test with development server first
python manage.py runserver 0.0.0.0:8002

# Visit http://YOUR_SERVER_IP:8002/api/
# If it works, stop the server (Ctrl+C)
```

---

## Step 6: Create systemd Service

### 6.1 Create Gunicorn Socket File

```bash
sudo nano /etc/systemd/system/crm-backend.socket
```

Add the following content:

```ini
[Unit]
Description=CRM Backend Gunicorn Socket

[Socket]
ListenStream=/run/crm-backend.sock

[Install]
WantedBy=sockets.target
```

### 6.2 Create Gunicorn Service File

```bash
sudo nano /etc/systemd/system/crm-backend.service
```

Add the following content:

```ini
[Unit]
Description=CRM Backend Gunicorn Service
Requires=crm-backend.socket
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
RuntimeDirectory=crm-backend
WorkingDirectory=/var/www/crm-backend
Environment="PATH=/var/www/crm-backend/venv/bin"
EnvironmentFile=/var/www/crm-backend/.env
ExecStart=/var/www/crm-backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/run/crm-backend.sock \
          --timeout 120 \
          --access-logfile /var/log/crm-backend/access.log \
          --error-logfile /var/log/crm-backend/error.log \
          --log-level info \
          config.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 6.3 Create Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/crm-backend
sudo chown www-data:www-data /var/log/crm-backend

# Change ownership of application directory
sudo chown -R www-data:www-data /var/www/crm-backend
```

### 6.4 Start and Enable Service

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Start the socket
sudo systemctl start crm-backend.socket

# Enable socket to start on boot
sudo systemctl enable crm-backend.socket

# Start the service
sudo systemctl start crm-backend.service

# Enable service to start on boot
sudo systemctl enable crm-backend.service

# Check service status
sudo systemctl status crm-backend.service

# Check logs
sudo journalctl -u crm-backend.service -f
```

---

## Step 7: Configure Nginx

### 7.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/crm-backend
```

Add the following configuration:

```nginx
# Upstream to Gunicorn
upstream crm_backend {
    server unix:/run/crm-backend.sock fail_timeout=0;
}

# Redirect HTTP to HTTPS (will be configured after SSL)
server {
    listen 80;
    listen [::]:80;
    server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;

    # Temporary location for Certbot verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS (uncomment after SSL is configured)
    # return 301 https://$server_name$request_uri;
}

# HTTPS Server Block (will be configured after SSL certificate)
# Uncomment this section after obtaining SSL certificate
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;
#
#     # SSL Configuration (Certbot will add these)
#     # ssl_certificate /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem;
#     # ssl_certificate_key /etc/letsencrypt/live/backend.onsync-test.xyz/privkey.pem;
#     # include /etc/letsencrypt/options-ssl-nginx.conf;
#     # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     # Security Headers
#     add_header X-Frame-Options "DENY" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
#
#     # Client body size (for file uploads)
#     client_max_body_size 20M;
#
#     # Static files
#     location /static/ {
#         alias /var/www/crm-backend/staticfiles/;
#         expires 30d;
#         add_header Cache-Control "public, immutable";
#     }
#
#     # Media files (if needed)
#     location /media/ {
#         alias /var/www/crm-backend/media/;
#         expires 30d;
#         add_header Cache-Control "public, immutable";
#     }
#
#     # Proxy to Gunicorn
#     location / {
#         proxy_pass http://crm_backend;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_redirect off;
#
#         # Timeouts
#         proxy_connect_timeout 120s;
#         proxy_send_timeout 120s;
#         proxy_read_timeout 120s;
#
#         # WebSocket support (if needed in future)
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#     }
#
#     # Health check endpoint
#     location /health/ {
#         access_log off;
#         return 200 "healthy\n";
#         add_header Content-Type text/plain;
#     }
# }
```

### 7.2 Enable Nginx Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: Obtain SSL Certificate

### 8.1 Create Certbot Directory

```bash
sudo mkdir -p /var/www/certbot
```

### 8.2 Obtain SSL Certificate

```bash
# Obtain certificate for backend domain
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d backend.onsync-test.xyz \
    -d www.backend.onsync-test.xyz \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email

# Or use Nginx plugin (easier)
sudo certbot --nginx -d backend.onsync-test.xyz -d www.backend.onsync-test.xyz
```

### 8.3 Update Nginx Configuration with SSL

After obtaining the certificate, update the Nginx config:

```bash
sudo nano /etc/nginx/sites-available/crm-backend
```

**Uncomment the HTTPS server block** and **uncomment the redirect** in the HTTP server block.

Final configuration should look like:

```nginx
upstream crm_backend {
    server unix:/run/crm-backend.sock fail_timeout=0;
}

server {
    listen 80;
    listen [::]:80;
    server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;

    # SSL Configuration (added by Certbot or manually)
    ssl_certificate /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/backend.onsync-test.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # CORS headers (if needed - but Django REST Framework handles this)
    # add_header 'Access-Control-Allow-Origin' 'https://frontend.onsync-test.xyz' always;
    # add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    # add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

    client_max_body_size 20M;

    # Static files
    location /static/ {
        alias /var/www/crm-backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/crm-backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Gunicorn
    location / {
        proxy_pass http://crm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /health/ {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 8.4 Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 8.5 Setup Auto-Renewal

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Certbot should automatically set up a cron job or systemd timer
# Verify it's scheduled
sudo systemctl list-timers | grep certbot
```

---

## Step 9: Frontend Domain Configuration (for CORS)

Since your frontend is on `frontend.onsync-test.xyz`, you also need SSL for it. Here's a minimal Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/crm-frontend
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name frontend.onsync-test.xyz www.frontend.onsync-test.xyz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Will redirect to HTTPS after certificate
    # return 301 https://$server_name$request_uri;
}

# HTTPS configuration will be added after getting certificate
```

Enable and obtain certificate:

```bash
sudo ln -s /etc/nginx/sites-available/crm-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d frontend.onsync-test.xyz -d www.frontend.onsync-test.xyz
```

---

## Step 10: Verification & Testing

### 10.1 Check Service Status

```bash
# Check Gunicorn service
sudo systemctl status crm-backend.service

# Check Nginx
sudo systemctl status nginx

# Check logs
sudo journalctl -u crm-backend.service -n 50
sudo tail -f /var/log/crm-backend/access.log
sudo tail -f /var/log/crm-backend/error.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 10.2 Test API Endpoints

```bash
# Test health endpoint
curl https://backend.onsync-test.xyz/health/

# Test API root
curl https://backend.onsync-test.xyz/api/

# Test signup endpoint
curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "account": {"name": "Test Company"},
    "user": {
      "name": "Admin User",
      "email": "admin@testcompany.com",
      "password": "SecurePass123!"
    }
  }'
```

### 10.3 Test from Browser

Visit:
- `https://backend.onsync-test.xyz/api/` - Should show API root
- `https://backend.onsync-test.xyz/admin/` - Django admin interface
- Check SSL certificate is valid (green padlock in browser)

---

## Step 11: Production Settings Update

Now let's update the actual settings file for production:

---

## Step 12: Maintenance Commands

### 12.1 Common Operations

```bash
# Restart application
sudo systemctl restart crm-backend.service

# View logs
sudo journalctl -u crm-backend.service -f

# Deploy new code
cd /var/www/crm-backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt --upgrade
python manage.py collectstatic --noinput
sudo systemctl restart crm-backend.service

# Run Django management commands
cd /var/www/crm-backend
source venv/bin/activate
python manage.py createsuperuser
python manage.py shell
```

### 12.2 Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-crm-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/crm-backend"
mkdir -p $BACKUP_DIR

# Backup using Supabase CLI
cd /var/www/crm-backend
source venv/bin/activate
supabase db dump -f $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-crm-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-crm-db.sh
```

---

## 🔒 Security Checklist

- [x] **SSL/HTTPS enabled** for both domains
- [x] **Firewall configured** (UFW or iptables)
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- [x] **Django DEBUG=False** in production
- [x] **Strong SECRET_KEY** (never commit to Git)
- [x] **.env file** secured (chmod 600)
- [x] **Database password** is strong
- [x] **CORS properly configured** (only frontend domain)
- [x] **Security headers** added in Nginx
- [x] **Regular backups** scheduled
- [x] **Log rotation** configured
- [x] **Fail2ban** installed (optional but recommended)

---

## 📊 Monitoring (Optional but Recommended)

### Option 1: Simple Monitoring with Uptime Kuma

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Run Uptime Kuma
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

### Option 2: Log Aggregation

```bash
# Install Logwatch for daily email reports
sudo apt install logwatch
sudo logwatch --detail high --mailto your-email@example.com --range today
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u crm-backend.service -n 100 --no-pager

# Check socket
sudo systemctl status crm-backend.socket

# Check permissions
ls -la /var/www/crm-backend
ls -la /run/crm-backend.sock
```

### 502 Bad Gateway

```bash
# Check if Gunicorn is running
sudo systemctl status crm-backend.service

# Check socket exists
ls -la /run/crm-backend.sock

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Issues

```bash
# Test database connection
cd /var/www/crm-backend
source venv/bin/activate
python manage.py shell

# In Python shell:
from django.db import connection
connection.ensure_connection()
print("Database connected!")
```

### Static Files Not Loading

```bash
# Recollect static files
cd /var/www/crm-backend
source venv/bin/activate
python manage.py collectstatic --noinput --clear

# Check permissions
sudo chown -R www-data:www-data /var/www/crm-backend/staticfiles
```

---

## 📝 Post-Deployment Checklist

- [ ] Application running at `https://backend.onsync-test.xyz`
- [ ] SSL certificate valid (green padlock)
- [ ] API endpoints responding correctly
- [ ] CORS working with frontend domain
- [ ] Database connected and queries working
- [ ] Static files serving correctly
- [ ] Admin panel accessible
- [ ] Logs are being written
- [ ] Service starts on system reboot
- [ ] Backup script scheduled
- [ ] Monitoring set up
- [ ] Documentation updated with production URLs

---

## 🎉 Deployment Complete!

Your Django CRM backend should now be running in production at:
- **API**: https://backend.onsync-test.xyz/api/
- **Admin**: https://backend.onsync-test.xyz/admin/

Frontend should access it from:
- **Frontend**: https://frontend.onsync-test.xyz

---

## 📧 Support

If you encounter issues:
1. Check logs: `sudo journalctl -u crm-backend.service -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables in `.env`
4. Test database connection
5. Check firewall rules

---

**Created**: November 8, 2025  
**Last Updated**: November 8, 2025
