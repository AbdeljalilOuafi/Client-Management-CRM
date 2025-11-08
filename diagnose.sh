#!/bin/bash
# Quick diagnostic script - run this to see what's happening
# bash diagnose.sh

echo "🔍 CRM Backend Diagnostics"
echo "=========================================="
echo ""

cd ~/Client-Management-CRM

# 1. Check .env file
echo "1️⃣  .ENV FILE:"
echo "   Location: $(pwd)/.env"
echo "   Exists: $([ -f .env ] && echo 'YES' || echo 'NO')"
if [ -f .env ]; then
    echo "   Size: $(stat -f%z .env 2>/dev/null || stat -c%s .env) bytes"
    echo "   Variables found:"
    grep -v '^#' .env | grep '=' | cut -d'=' -f1 | sed 's/^/     - /'
fi
echo ""

# 2. Check service file
echo "2️⃣  SYSTEMD SERVICE:"
echo "   Location: /etc/systemd/system/crm-backend.service"
echo "   Exists: $([ -f /etc/systemd/system/crm-backend.service ] && echo 'YES' || echo 'NO')"
if [ -f /etc/systemd/system/crm-backend.service ]; then
    echo "   EnvironmentFile:"
    sudo grep EnvironmentFile /etc/systemd/system/crm-backend.service | sed 's/^/     /'
    echo "   WorkingDirectory:"
    sudo grep WorkingDirectory /etc/systemd/system/crm-backend.service | sed 's/^/     /'
fi
echo ""

# 3. Check service status
echo "3️⃣  SERVICE STATUS:"
sudo systemctl is-active crm-backend.service && echo "   ✅ Running" || echo "   ❌ Not running"
echo ""

# 4. Test Django settings directly
echo "4️⃣  DJANGO SETTINGS TEST:"
source venv/bin/activate
python << 'PYTHON_EOF'
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    import django
    django.setup()
    from django.conf import settings
    
    print(f"   DEBUG = {settings.DEBUG}")
    print(f"   ALLOWED_HOSTS = {settings.ALLOWED_HOSTS}")
    
    if 'backend.onsync-test.xyz' in settings.ALLOWED_HOSTS:
        print("   ✅ backend.onsync-test.xyz is in ALLOWED_HOSTS")
    else:
        print("   ❌ backend.onsync-test.xyz is NOT in ALLOWED_HOSTS")
        
    if not settings.DEBUG:
        print("   ✅ DEBUG is False (production mode)")
    else:
        print("   ⚠️  DEBUG is True (development mode)")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
PYTHON_EOF
echo ""

# 5. Check what Gunicorn sees
echo "5️⃣  GUNICORN PROCESS:"
GUNICORN_PID=$(pgrep -f "gunicorn.*config.wsgi" | head -1)
if [ -n "$GUNICORN_PID" ]; then
    echo "   ✅ Found Gunicorn process: PID $GUNICORN_PID"
    echo "   Environment variables:"
    sudo cat /proc/$GUNICORN_PID/environ | tr '\0' '\n' | grep -E 'DEBUG|ALLOWED_HOSTS|DATABASE_URL' | sed 's/^/     /'
else
    echo "   ❌ Gunicorn process not found"
fi
echo ""

# 6. Recent logs
echo "6️⃣  RECENT LOGS (last 15 lines):"
sudo journalctl -u crm-backend.service -n 15 --no-pager | sed 's/^/   /'
echo ""

# 7. Test local API
echo "7️⃣  API TEST:"
echo "   Testing http://localhost:8002/health/"
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health/ 2>&1)
echo "   Local API: HTTP $LOCAL_RESPONSE"

echo "   Testing https://backend.onsync-test.xyz/health/"
PUBLIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://backend.onsync-test.xyz/health/ 2>&1)
echo "   Public API: HTTP $PUBLIC_RESPONSE"

if [ "$PUBLIC_RESPONSE" = "400" ]; then
    echo "   ⚠️  HTTP 400 might be DisallowedHost error"
    echo "   Full response:"
    curl -s https://backend.onsync-test.xyz/health/ 2>&1 | head -20 | sed 's/^/     /'
fi
echo ""

echo "=========================================="
echo "📋 SUMMARY:"
echo ""

# Summary checks
ISSUES=0

if [ ! -f .env ]; then
    echo "❌ .env file missing"
    ISSUES=$((ISSUES+1))
fi

if ! sudo systemctl is-active --quiet crm-backend.service; then
    echo "❌ Service not running"
    ISSUES=$((ISSUES+1))
fi

if [ "$PUBLIC_RESPONSE" = "400" ]; then
    echo "❌ Getting HTTP 400 (likely DisallowedHost)"
    ISSUES=$((ISSUES+1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ No obvious issues detected"
    echo ""
    echo "If you're still having problems, the issue might be:"
    echo "1. Nginx configuration"
    echo "2. DNS/SSL issues"
    echo "3. Firewall blocking requests"
else
    echo ""
    echo "🔧 RECOMMENDED ACTIONS:"
    echo "1. Run: bash fix_systemd_service.sh"
    echo "2. Check logs: sudo journalctl -u crm-backend.service -f"
    echo "3. Make a test request and watch logs in real-time"
fi
echo ""
echo "=========================================="
