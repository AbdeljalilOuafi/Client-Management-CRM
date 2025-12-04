#!/bin/bash

# Setup script for form.fithq.ai default check-in domain
# This configures Nginx and generates SSL certificate via Let's Encrypt

set -e  # Exit on any error

DOMAIN="form.fithq.ai"
NGINX_CONF="nginx-form-fithq.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Setting up form.fithq.ai domain"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# Check if DNS is pointing to this server
echo "Step 1: Verifying DNS configuration..."
SERVER_IP=$(curl -s ifconfig.me)
RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)

echo "Server IP: $SERVER_IP"
echo "DNS resolves to: $RESOLVED_IP"

if [ "$SERVER_IP" != "$RESOLVED_IP" ]; then
    echo "⚠️  WARNING: DNS is not pointing to this server!"
    echo "Please configure DNS A record: $DOMAIN → $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ DNS correctly configured"
fi

echo ""
echo "Step 2: Installing Nginx configuration..."

# Copy Nginx config to sites-available
cp "$SCRIPT_DIR/$NGINX_CONF" "/etc/nginx/sites-available/$DOMAIN"
echo "✅ Copied Nginx configuration to /etc/nginx/sites-available/$DOMAIN"

# Create symlink to sites-enabled if it doesn't exist
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    ln -s "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
    echo "✅ Created symlink in sites-enabled"
else
    echo "ℹ️  Symlink already exists"
fi

# Test Nginx configuration
echo ""
echo "Step 3: Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Check if URL shortener is running on port 8001
echo ""
echo "Step 4: Checking URL shortener service..."
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ URL shortener is running on port 8001"
else
    echo "⚠️  WARNING: URL shortener may not be running on port 8001"
    echo "Please ensure the URL shortener service is started"
fi

# Reload Nginx to apply config (without SSL first)
echo ""
echo "Step 5: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# Generate SSL certificate with certbot
echo ""
echo "Step 6: Generating SSL certificate with Let's Encrypt..."
echo "This may take 60-120 seconds..."

certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email admin@fithq.ai \
    --domains $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate generated successfully"
else
    echo "❌ Failed to generate SSL certificate"
    echo "Please check:"
    echo "  - DNS is correctly configured"
    echo "  - Port 80 and 443 are open"
    echo "  - No firewall blocking Let's Encrypt"
    exit 1
fi

# Final Nginx reload with SSL
echo ""
echo "Step 7: Final Nginx reload with SSL..."
systemctl reload nginx
echo "✅ Nginx reloaded with SSL configuration"

# Test HTTPS access
echo ""
echo "Step 8: Testing HTTPS access..."
sleep 2
if curl -s -k https://$DOMAIN/ > /dev/null 2>&1; then
    echo "✅ HTTPS is working"
else
    echo "⚠️  HTTPS test failed (may be expected if URL shortener returns 404)"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Domain: https://$DOMAIN"
echo "Proxies to: http://localhost:8001"
echo ""
echo "SSL Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "Nginx Config: /etc/nginx/sites-available/$DOMAIN"
echo ""
echo "To test:"
echo "  curl https://$DOMAIN/"
echo ""
echo "To view logs:"
echo "  sudo tail -f /var/log/nginx/$DOMAIN.access.log"
echo "  sudo tail -f /var/log/nginx/$DOMAIN.error.log"
echo ""
echo "Certificate auto-renewal:"
echo "  certbot renew --dry-run"
echo ""
