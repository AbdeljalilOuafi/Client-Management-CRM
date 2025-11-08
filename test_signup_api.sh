#!/bin/bash
# Test signup endpoint
# This will test the API from the local machine

echo "🧪 Testing Signup Endpoint"
echo "================================"
echo ""

# Test data
DATA='{
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

echo "📤 Sending POST request to https://backend.onsync-test.xyz/api/auth/signup/"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://backend.onsync-test.xyz/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$DATA")

# Split response body and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "📊 HTTP Status Code: $HTTP_CODE"
echo ""
echo "📄 Response Body:"
echo "$HTTP_BODY" | jq . 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Check for specific errors
if echo "$HTTP_BODY" | grep -qi "disallowedhost"; then
    echo "❌ Still getting DisallowedHost error!"
    echo ""
    echo "🔍 Debug steps:"
    echo "1. Check if service is reading .env:"
    echo "   sudo systemctl status crm-backend.service"
    echo ""
    echo "2. Check Gunicorn environment:"
    echo "   GUNICORN_PID=\$(pgrep -f 'gunicorn.*config.wsgi' | head -1)"
    echo "   sudo cat /proc/\$GUNICORN_PID/environ | tr '\\0' '\\n' | grep DEBUG"
    echo ""
    echo "3. Check logs:"
    echo "   sudo journalctl -u crm-backend.service -n 50"
    
elif echo "$HTTP_BODY" | grep -qi "you have debug.*true"; then
    echo "❌ DEBUG is still True!"
    echo ""
    echo "🔧 The issue is that Django is not reading DEBUG=False correctly."
    echo ""
    echo "Quick fix - add DEBUG=False directly to systemd service:"
    echo "  sudo systemctl edit crm-backend.service"
    echo ""
    echo "Add this in the [Service] section:"
    echo "  Environment=\"DEBUG=False\""
    
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS! Signup endpoint is working!"
    
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠️  Got HTTP 400 - This could be validation errors (which is normal)"
    echo "Check the response body above for details"
    
else
    echo "⚠️  Got HTTP $HTTP_CODE"
    echo "Check the response body above for details"
fi

echo ""
echo "================================"
