# 🚀 Quick Deployment Instructions

## Files Ready for Deployment

1. **systemd Service**: `deployment/crm-backend.service`
2. **Nginx Config**: `deployment/nginx-crm-backend.conf`

---

## Deployment Steps

### 1. Create Log Directory

```bash
sudo mkdir -p /var/log/crm-backend
sudo chown ubuntu:ubuntu /var/log/crm-backend
```

### 2. Install systemd Service

```bash
# Copy service file
sudo cp deployment/crm-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable crm-backend.service

# Start the service
sudo systemctl start crm-backend.service

# Check status
sudo systemctl status crm-backend.service

# View logs if needed
sudo journalctl -u crm-backend.service -f
```

### 3. Install Nginx Configuration

```bash
# Create certbot directory (for SSL verification)
sudo mkdir -p /var/www/certbot

# Copy Nginx config
sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend

# Enable the site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Obtain SSL Certificate

```bash
# Install Certbot if not already installed
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d backend.onsync-test.xyz -d www.backend.onsync-test.xyz

# Certbot will automatically:
# - Obtain the certificate
# - Update the Nginx config with SSL settings
# - Set up auto-renewal
```

### 5. Verify Deployment

```bash
# Check if service is running
sudo systemctl status crm-backend.service

# Check if port 8002 is listening
sudo netstat -tlnp | grep 8002

# Test health endpoint
curl http://localhost:8002/health/

# Test via domain (after SSL)
curl https://backend.onsync-test.xyz/health/
curl https://backend.onsync-test.xyz/api/
```

---

## Service Management Commands

```bash
# Restart application
sudo systemctl restart crm-backend.service

# Stop application
sudo systemctl stop crm-backend.service

# Start application
sudo systemctl start crm-backend.service

# View logs (follow mode)
sudo journalctl -u crm-backend.service -f

# View last 100 lines of logs
sudo journalctl -u crm-backend.service -n 100

# Check service status
sudo systemctl status crm-backend.service

# Disable service (won't start on boot)
sudo systemctl disable crm-backend.service

# Enable service (will start on boot)
sudo systemctl enable crm-backend.service
```

---

## Updating the Application

When you push new code:

```bash
# Go to application directory
cd ~/Client-Management-CRM

# Pull latest code
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt --upgrade

# Collect static files
python manage.py collectstatic --noinput

# Restart the service
sudo systemctl restart crm-backend.service

# Check logs
sudo journalctl -u crm-backend.service -f
```

---

## Troubleshooting

### Service won't start

```bash
# Check detailed logs
sudo journalctl -u crm-backend.service -n 50 --no-pager

# Check if port 8002 is already in use
sudo netstat -tlnp | grep 8002

# Verify .env file exists
ls -la ~/Client-Management-CRM/.env

# Check file permissions
ls -la ~/Client-Management-CRM/

# Test Gunicorn manually
cd ~/Client-Management-CRM
source venv/bin/activate
gunicorn --bind 0.0.0.0:8002 config.wsgi:application
```

### 502 Bad Gateway

```bash
# Check if backend service is running
sudo systemctl status crm-backend.service

# Check Nginx logs
sudo tail -f /var/log/nginx/crm-backend-error.log

# Check application logs
sudo tail -f /var/log/crm-backend/error.log

# Verify port 8002 is listening
curl http://localhost:8002/health/
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates

# Manually renew if needed
sudo certbot renew
```

---

## Important Notes

1. **User & Group**: Service runs as `ubuntu:ubuntu`
2. **Application Path**: `/home/ubuntu/Client-Management-CRM`
3. **Port**: `8002` (internal)
4. **Public Access**: Via Nginx on ports 80/443
5. **Logs**: `/var/log/crm-backend/` and `journalctl`

---

## Configuration Summary

- **systemd Service**: `/etc/systemd/system/crm-backend.service`
- **Nginx Config**: `/etc/nginx/sites-available/crm-backend`
- **Application**: `/home/ubuntu/Client-Management-CRM`
- **Environment**: `/home/ubuntu/Client-Management-CRM/.env`
- **Logs**: `/var/log/crm-backend/`

---

## Quick Health Check

```bash
# All-in-one health check
echo "=== Service Status ===" && \
sudo systemctl status crm-backend.service --no-pager && \
echo "\n=== Port Listening ===" && \
sudo netstat -tlnp | grep 8002 && \
echo "\n=== Local Health Check ===" && \
curl -s http://localhost:8002/health/ && \
echo "\n=== Public Health Check ===" && \
curl -s https://backend.onsync-test.xyz/health/
```

---

Good luck with your deployment! 🚀
