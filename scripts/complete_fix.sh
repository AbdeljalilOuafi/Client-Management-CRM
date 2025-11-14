#!/bin/bash
# Complete fix for SSL certificate and DEBUG=False issue
# Run this on your production server

set -e  # Exit on error

echo "🔧 Complete Production Fix"
echo "=========================================="
echo ""

cd ~/Client-Management-CRM

# Step 1: Update .env file to have DEBUG=False and correct ALLOWED_HOSTS
echo "1️⃣  Updating .env file..."
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ Backed up existing .env"
fi

# Ensure DEBUG=False (remove any existing DEBUG line and add new one)
grep -v "^DEBUG=" .env > .env.tmp 2>/dev/null || touch .env.tmp
echo "DEBUG=False" >> .env.tmp

# Ensure ALLOWED_HOSTS is set correctly (remove www subdomain)
grep -v "^ALLOWED_HOSTS=" .env.tmp > .env.tmp2 2>/dev/null || touch .env.tmp2
echo "ALLOWED_HOSTS=backend.onsync-test.xyz" >> .env.tmp2

# Keep other variables
grep -v "^DEBUG=\|^ALLOWED_HOSTS=" .env 2>/dev/null >> .env.tmp2 || true

# Replace .env with new version
mv .env.tmp2 .env
rm -f .env.tmp

echo "   ✅ Updated .env file"
cat .env
echo ""

# Step 2: Update systemd service file
echo "2️⃣  Updating systemd service file..."
sudo cp deployment/crm-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
echo "   ✅ Service file updated and daemon reloaded"
echo ""

# Step 3: Update nginx configuration
echo "3️⃣  Updating nginx configuration..."
sudo cp deployment/nginx-crm-backend.conf /etc/nginx/sites-available/crm-backend

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/crm-backend ]; then
    echo "   Creating symlink in sites-enabled..."
    sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/crm-backend
    echo "   ✅ Symlink created"
else
    echo "   ✅ Symlink already exists"
fi

# Test nginx configuration
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t
    exit 1
fi
echo ""

# Step 4: Restart CRM backend service
echo "4️⃣  Restarting CRM backend service..."
sudo systemctl restart crm-backend.service
echo "   ✅ Service restarted"
echo ""

# Step 5: Wait for service to start
echo "5️⃣  Waiting for service to start..."
sleep 3
echo ""

# Step 6: Check service status
echo "6️⃣  Checking service status..."
if sudo systemctl is-active --quiet crm-backend.service; then
    echo "   ✅ Service is running"
    sudo systemctl status crm-backend.service --no-pager -l | head -15
else
    echo "   ❌ Service is not running!"
    sudo systemctl status crm-backend.service --no-pager -l
    echo ""
    echo "Check logs:"
    sudo journalctl -u crm-backend.service -n 30 --no-pager
    exit 1
fi
echo ""

# Step 7: Verify DEBUG setting
echo "7️⃣  Verifying DEBUG setting..."
GUNICORN_PID=$(pgrep -f "gunicorn.*config.wsgi" | head -1)
if [ -n "$GUNICORN_PID" ]; then
    DEBUG_VALUE=$(sudo cat /proc/$GUNICORN_PID/environ | tr '\0' '\n' | grep "^DEBUG=" | cut -d'=' -f2)
    echo "   Gunicorn PID: $GUNICORN_PID"
    echo "   DEBUG value: $DEBUG_VALUE"
    
    if [ "$DEBUG_VALUE" = "False" ]; then
        echo "   ✅ DEBUG is correctly set to False"
    else
        echo "   ⚠️  DEBUG is: $DEBUG_VALUE (should be False)"
    fi
else
    echo "   ⚠️  Could not find Gunicorn process"
fi
echo ""

# Step 8: Test API locally
echo "8️⃣  Testing API..."
echo "   Testing http://localhost:8002/health/"
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health/ 2>&1)
echo "   Local: HTTP $LOCAL_TEST"

echo "   Testing https://backend.onsync-test.xyz/health/"
PUBLIC_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://backend.onsync-test.xyz/health/ 2>&1)
echo "   Public: HTTP $PUBLIC_TEST"

if [ "$PUBLIC_TEST" = "200" ] || [ "$PUBLIC_TEST" = "404" ]; then
    echo "   ✅ API is responding!"
elif [ "$PUBLIC_TEST" = "400" ]; then
    echo "   ⚠️  HTTP 400 - might still be DisallowedHost"
else
    echo "   ⚠️  HTTP $PUBLIC_TEST"
fi
echo ""

# Step 9: Test signup endpoint
echo "9️⃣  Testing signup endpoint..."
SIGNUP_TEST=$(curl -s -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' 2>&1)

if echo "$SIGNUP_TEST" | grep -qi "disallowedhost"; then
    echo "   ❌ Still getting DisallowedHost error!"
    echo "   Response: $SIGNUP_TEST"
elif echo "$SIGNUP_TEST" | grep -qi "debug.*true"; then
    echo "   ❌ DEBUG is still True!"
    echo "   This means Django is not reading the environment variable"
else
    echo "   ✅ No DisallowedHost or DEBUG=True error!"
    echo "   Response preview:"
    echo "$SIGNUP_TEST" | head -5
fi
echo ""

# Step 10: Check recent logs
echo "🔟 Recent logs (last 20 lines):"
sudo journalctl -u crm-backend.service -n 20 --no-pager | tail -20
echo ""

echo "=========================================="
echo "✅ Fix Complete!"
echo ""
echo "📋 SUMMARY:"
echo "   - .env: DEBUG=False, ALLOWED_HOSTS=backend.onsync-test.xyz"
echo "   - systemd service: Updated with DEBUG=False environment variable"
echo "   - nginx: Removed www subdomain (certificate doesn't include it)"
echo "   - Service: Restarted"
echo ""
echo "🧪 NEXT TEST:"
echo "Run this to test the signup endpoint:"
echo ""
echo 'curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '\''{'
echo '  "account": {'
echo '    "name": "Test Company",'
echo '    "email": "support@company.com",'
echo '    "ceo_name": "John",'
echo '    "niche": "Coaching",'
echo '    "location": "US",'
echo '    "website_url": "https://example.com",'
echo '    "timezone": "Africa/Casablanca"'
echo '  },'
echo '  "user": {'
echo '    "name": "ouafi",'
echo '    "email": "ouafi@example.com",'
echo '    "password": "SecurePass123!",'
echo '    "phone_number": "+212620219605",'
echo '    "job_role": "CEO"'
echo '  }'
echo '}'\'''
echo ""
echo "=========================================="
