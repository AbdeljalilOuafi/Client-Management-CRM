#!/bin/bash
# Setup nginx configuration for CRM backend

echo "🔧 Setting up Nginx for CRM Backend"
echo "=========================================="
echo ""

cd ~/Client-Management-CRM

# Step 1: Check if config exists in sites-available
echo "1️⃣  Checking sites-available..."
if [ ! -f /etc/nginx/sites-available/crm-backend ]; then
    echo "   ⚠️  Config not found in sites-available, copying..."
    sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend
    echo "   ✅ Copied to sites-available"
else
    echo "   ✅ Config exists in sites-available"
    echo "   Updating with latest version..."
    sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend
    echo "   ✅ Updated"
fi
echo ""

# Step 2: Create symbolic link
echo "2️⃣  Creating symbolic link in sites-enabled..."
if [ -L /etc/nginx/sites-enabled/crm-backend ]; then
    echo "   ⚠️  Symlink already exists, removing old one..."
    sudo rm /etc/nginx/sites-enabled/crm-backend
fi

sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/crm-backend
echo "   ✅ Symlink created"
echo ""

# Step 3: Verify symlink
echo "3️⃣  Verifying symlink..."
if [ -L /etc/nginx/sites-enabled/crm-backend ]; then
    echo "   ✅ Symlink exists"
    ls -la /etc/nginx/sites-enabled/crm-backend
else
    echo "   ❌ Symlink creation failed!"
    exit 1
fi
echo ""

# Step 4: Check all enabled sites
echo "4️⃣  Currently enabled sites:"
ls -1 /etc/nginx/sites-enabled/ | sed 's/^/     - /'
echo ""

# Step 5: Test nginx configuration
echo "5️⃣  Testing nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors!"
    exit 1
fi
echo ""

# Step 6: Reload nginx
echo "6️⃣  Reloading nginx..."
sudo systemctl reload nginx
if sudo systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ❌ Nginx failed to reload!"
    sudo systemctl status nginx --no-pager -l
    exit 1
fi
echo ""

# Step 7: Check if nginx is listening on port 443
echo "7️⃣  Checking nginx ports..."
sudo netstat -tlnp | grep nginx | sed 's/^/     /'
echo ""

# Step 8: Test SSL certificate
echo "8️⃣  Testing SSL connection..."
timeout 5 bash -c '</dev/tcp/localhost/443' 2>/dev/null && echo "   ✅ Port 443 is open" || echo "   ⚠️  Port 443 might not be accessible"
echo ""

# Step 9: Test API endpoint
echo "9️⃣  Testing API endpoint..."
echo "   Local test (http://localhost:8002/health/):"
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health/ 2>&1)
echo "   Response: HTTP $LOCAL_RESPONSE"

echo ""
echo "   Public test (https://backend.onsync-test.xyz/health/):"
PUBLIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://backend.onsync-test.xyz/health/ 2>&1)
echo "   Response: HTTP $PUBLIC_RESPONSE"

if [ "$PUBLIC_RESPONSE" = "200" ] || [ "$PUBLIC_RESPONSE" = "404" ]; then
    echo "   ✅ API is accessible via HTTPS"
elif [ "$PUBLIC_RESPONSE" = "000" ]; then
    echo "   ⚠️  Connection failed - check DNS or SSL"
else
    echo "   ⚠️  HTTP $PUBLIC_RESPONSE - check nginx logs"
fi
echo ""

# Step 10: Show nginx access log location
echo "🔟 Nginx logs location:"
echo "   Access: /var/log/nginx/crm-backend-access.log"
echo "   Error: /var/log/nginx/crm-backend-error.log"
echo ""
echo "   View errors: sudo tail -f /var/log/nginx/crm-backend-error.log"
echo ""

echo "=========================================="
echo "✅ Nginx setup complete!"
echo ""
echo "🧪 Test the API:"
echo "curl -I https://backend.onsync-test.xyz/health/"
echo ""
echo "Or test signup:"
echo "curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"test\":\"data\"}'"
echo "=========================================="
