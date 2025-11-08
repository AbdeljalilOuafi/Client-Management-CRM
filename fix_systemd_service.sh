#!/bin/bash
# Fix systemd service to properly load environment variables
# Run this on your production server: bash fix_systemd_service.sh

set -e  # Exit on any error

echo "🔧 Fixing systemd service configuration..."
echo ""

cd ~/Client-Management-CRM

# Step 1: Verify .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create it first."
    exit 1
fi

echo "✅ .env file found"
echo ""

# Step 2: Check if service file exists
if [ ! -f /etc/systemd/system/crm-backend.service ]; then
    echo "❌ Service file not found at /etc/systemd/system/crm-backend.service"
    echo "Installing service file..."
    sudo cp deployment/crm-backend.service /etc/systemd/system/
fi

echo "✅ Service file exists"
echo ""

# Step 3: Verify service file has correct EnvironmentFile path
SERVICE_ENV_FILE=$(sudo grep EnvironmentFile /etc/systemd/system/crm-backend.service | cut -d'=' -f2)
echo "📄 Service EnvironmentFile path: $SERVICE_ENV_FILE"

if [ "$SERVICE_ENV_FILE" != "/home/ubuntu/Client-Management-CRM/.env" ]; then
    echo "⚠️  Service file has wrong EnvironmentFile path!"
    echo "Updating service file..."
    sudo cp deployment/crm-backend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    echo "✅ Service file updated"
else
    echo "✅ EnvironmentFile path is correct"
fi
echo ""

# Step 4: Verify .env file permissions (systemd needs to read it)
echo "🔒 Checking .env file permissions..."
ls -la .env
chmod 644 .env
echo "✅ Permissions set to 644"
echo ""

# Step 5: Test that Django can read settings
echo "🧪 Testing Django settings..."
source venv/bin/activate
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.conf import settings
print(f'DEBUG: {settings.DEBUG}')
print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
assert 'backend.onsync-test.xyz' in settings.ALLOWED_HOSTS, 'backend.onsync-test.xyz not in ALLOWED_HOSTS!'
assert settings.DEBUG == False, 'DEBUG should be False!'
print('✅ Django settings are correct')
"
echo ""

# Step 6: Reload systemd and restart service
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload
echo "✅ Daemon reloaded"
echo ""

echo "🔄 Restarting crm-backend service..."
sudo systemctl restart crm-backend.service
echo "✅ Service restarted"
echo ""

# Step 7: Wait a moment for service to start
echo "⏳ Waiting 3 seconds for service to start..."
sleep 3
echo ""

# Step 8: Check service status
echo "📊 Service status:"
sudo systemctl status crm-backend.service --no-pager -l | head -20
echo ""

# Step 9: Check if service is running
if sudo systemctl is-active --quiet crm-backend.service; then
    echo "✅ Service is running!"
else
    echo "❌ Service is not running! Check logs:"
    sudo journalctl -u crm-backend.service -n 50 --no-pager
    exit 1
fi
echo ""

# Step 10: Check recent logs for errors
echo "📋 Recent logs (checking for errors)..."
if sudo journalctl -u crm-backend.service -n 20 --no-pager | grep -i "error\|exception\|traceback" > /dev/null; then
    echo "⚠️  Errors found in logs:"
    sudo journalctl -u crm-backend.service -n 50 --no-pager | grep -i "error\|exception\|traceback" -A 2 -B 2
else
    echo "✅ No errors in recent logs"
    sudo journalctl -u crm-backend.service -n 10 --no-pager
fi
echo ""

# Step 11: Test API endpoint
echo "🌐 Testing API endpoint..."
echo "Trying: http://localhost:8002/health/"
if curl -s http://localhost:8002/health/ | grep -q "ok\|healthy\|success" > /dev/null 2>&1; then
    echo "✅ Local API is responding!"
else
    echo "⚠️  Local API test inconclusive. Response:"
    curl -s http://localhost:8002/health/ || echo "Connection failed"
fi
echo ""

echo "Trying: https://backend.onsync-test.xyz/health/"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://backend.onsync-test.xyz/health/ 2>&1 || echo "000")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
    echo "✅ Public API is responding! (HTTP $RESPONSE)"
elif [ "$RESPONSE" = "400" ]; then
    echo "⚠️  Got HTTP 400 - This might be the DisallowedHost error!"
    echo "Let me check the actual response..."
    curl -v https://backend.onsync-test.xyz/health/ 2>&1 | grep -i "disallowed\|host"
else
    echo "⚠️  API returned HTTP $RESPONSE"
fi
echo ""

# Step 12: Final check - make a test request to signup endpoint
echo "🧪 Testing signup endpoint with proper headers..."
SIGNUP_RESPONSE=$(curl -s -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
    -H "Content-Type: application/json" \
    -H "Host: backend.onsync-test.xyz" \
    -d '{"test":"data"}' 2>&1 || echo "Connection failed")

if echo "$SIGNUP_RESPONSE" | grep -qi "disallowedhost"; then
    echo "❌ Still getting DisallowedHost error!"
    echo "Response: $SIGNUP_RESPONSE"
    echo ""
    echo "🔍 Debugging steps:"
    echo "1. Check what Gunicorn is actually seeing:"
    sudo journalctl -u crm-backend.service -n 100 --no-pager | tail -20
elif echo "$SIGNUP_RESPONSE" | grep -qi "error\|exception"; then
    echo "⚠️  Got an error (not DisallowedHost):"
    echo "$SIGNUP_RESPONSE"
else
    echo "✅ No DisallowedHost error! Response:"
    echo "$SIGNUP_RESPONSE" | head -10
fi
echo ""

echo "=================================================================="
echo "✅ Fix complete!"
echo ""
echo "If you're still getting DisallowedHost error, run:"
echo "  sudo journalctl -u crm-backend.service -f"
echo ""
echo "Then make a request and watch the logs in real-time."
echo "=================================================================="
