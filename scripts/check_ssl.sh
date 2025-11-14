#!/bin/bash
# Check SSL certificate and nginx configuration

echo "🔐 SSL Certificate & Nginx Diagnostics"
echo "=========================================="
echo ""

# 1. Check certificate details
echo "1️⃣  SSL CERTIFICATE:"
if [ -f /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem ]; then
    echo "   Certificate exists: ✅"
    echo "   Domains covered:"
    openssl x509 -in /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem -noout -text | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g' | sed 's/,/\n/g' | sed 's/^/     - /'
    echo ""
    echo "   Expiry:"
    openssl x509 -in /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem -noout -dates | sed 's/^/     /'
else
    echo "   ❌ Certificate not found!"
fi
echo ""

# 2. Check nginx configuration
echo "2️⃣  NGINX CONFIGURATION:"
NGINX_CONFIG="/etc/nginx/sites-enabled/crm-backend"
if [ -f "$NGINX_CONFIG" ]; then
    echo "   Nginx config exists: ✅"
    echo "   Server names configured:"
    grep "server_name" "$NGINX_CONFIG" | sed 's/^/     /'
    echo ""
    echo "   SSL certificate paths:"
    grep "ssl_certificate" "$NGINX_CONFIG" | sed 's/^/     /'
else
    echo "   ❌ Nginx config not found at $NGINX_CONFIG"
fi
echo ""

# 3. Test nginx configuration
echo "3️⃣  NGINX TEST:"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1 | sed 's/^/     /'
fi
echo ""

# 4. Check if nginx is running
echo "4️⃣  NGINX STATUS:"
if sudo systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is not running"
fi
echo ""

# 5. Test SSL with openssl
echo "5️⃣  SSL CONNECTION TEST:"
echo "   Testing: backend.onsync-test.xyz:443"
timeout 5 openssl s_client -connect backend.onsync-test.xyz:443 -servername backend.onsync-test.xyz < /dev/null 2>&1 | grep -E "subject=|issuer=|verify return code" | sed 's/^/     /'
echo ""

if timeout 5 openssl s_client -connect www.backend.onsync-test.xyz:443 -servername www.backend.onsync-test.xyz < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
    echo "   Testing: www.backend.onsync-test.xyz:443"
    timeout 5 openssl s_client -connect www.backend.onsync-test.xyz:443 -servername www.backend.onsync-test.xyz < /dev/null 2>&1 | grep -E "subject=|issuer=|verify return code" | sed 's/^/     /'
else
    echo "   ⚠️  www.backend.onsync-test.xyz certificate might not match"
fi
echo ""

# 6. Test curl locally
echo "6️⃣  CURL TEST (from server):"
echo "   Testing: https://backend.onsync-test.xyz/health/"
CURL_RESPONSE=$(curl -s -o /dev/null -w "HTTP %{http_code} - SSL: %{ssl_verify_result}" https://backend.onsync-test.xyz/health/ 2>&1)
echo "   Response: $CURL_RESPONSE"

if echo "$CURL_RESPONSE" | grep -q "SSL: 0"; then
    echo "   ✅ SSL verification successful"
else
    echo "   ⚠️  SSL verification issue"
fi
echo ""

# 7. Check DNS
echo "7️⃣  DNS CHECK:"
echo "   backend.onsync-test.xyz:"
dig +short backend.onsync-test.xyz | head -1 | sed 's/^/     /'

echo "   www.backend.onsync-test.xyz:"
dig +short www.backend.onsync-test.xyz | head -1 | sed 's/^/     /'
echo ""

echo "=========================================="
echo "📋 SUMMARY:"
echo ""

# Check if www subdomain is in certificate
CERT_DOMAINS=$(openssl x509 -in /etc/letsencrypt/live/backend.onsync-test.xyz/fullchain.pem -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1)

if echo "$CERT_DOMAINS" | grep -q "www.backend.onsync-test.xyz"; then
    echo "✅ Certificate includes www subdomain"
else
    echo "⚠️  Certificate does NOT include www subdomain"
    echo ""
    echo "🔧 FIX:"
    echo "1. Update certificate to include www subdomain:"
    echo "   sudo certbot --nginx -d backend.onsync-test.xyz -d www.backend.onsync-test.xyz"
    echo ""
    echo "OR"
    echo ""
    echo "2. Remove www from nginx config:"
    echo "   Edit /etc/nginx/sites-enabled/crm-backend"
    echo "   Change: server_name backend.onsync-test.xyz www.backend.onsync-test.xyz;"
    echo "   To:     server_name backend.onsync-test.xyz;"
    echo "   Then:   sudo systemctl reload nginx"
fi

echo ""
echo "=========================================="
