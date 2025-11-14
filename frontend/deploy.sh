#!/bin/bash
# Deploy CRM Frontend to Production
# Run this on your production server

set -e  # Exit on error

echo "🚀 Deploying CRM Frontend"
echo "=========================================="
echo ""

cd ~/Client-Management-CRM/frontend

# Step 1: Install dependencies
echo "1️⃣  Installing dependencies..."
npm ci --production=false
echo "   ✅ Dependencies installed"
echo ""

# Step 2: Build the application
echo "2️⃣  Building Next.js application..."
npm run build
echo "   ✅ Build complete"
echo ""

# Step 3: Install systemd service
echo "3️⃣  Installing systemd service..."
sudo cp deployment/crm-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable crm-frontend.service
echo "   ✅ Service installed"
echo ""

# Step 4: Setup nginx
echo "4️⃣  Setting up nginx..."
sudo cp deployment/nginx-crm-frontend.conf /etc/nginx/sites-available/crm-frontend

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/crm-frontend ]; then
    sudo ln -s /etc/nginx/sites-available/crm-frontend /etc/nginx/sites-enabled/crm-frontend
    echo "   ✅ Nginx symlink created"
else
    echo "   ✅ Nginx symlink already exists"
fi

# Test nginx configuration
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t
    exit 1
fi
echo ""

# Step 5: Obtain SSL certificate (if not already done)
echo "5️⃣  Checking SSL certificate..."
if [ ! -f /etc/letsencrypt/live/frontend.onsync-test.xyz/fullchain.pem ]; then
    echo "   ⚠️  SSL certificate not found. Run this command to obtain one:"
    echo "   sudo certbot --nginx -d frontend.onsync-test.xyz"
    echo ""
    read -p "   Do you want to run certbot now? (yes/no): " RUN_CERTBOT
    if [ "$RUN_CERTBOT" = "yes" ]; then
        sudo certbot --nginx -d frontend.onsync-test.xyz
        echo "   ✅ SSL certificate obtained"
    else
        echo "   ⚠️  Skipping SSL certificate. You'll need to run certbot manually."
    fi
else
    echo "   ✅ SSL certificate already exists"
fi
echo ""

# Step 6: Start/Restart services
echo "6️⃣  Starting services..."
sudo systemctl restart crm-frontend.service
sudo systemctl reload nginx
echo "   ✅ Services restarted"
echo ""

# Step 7: Wait for service to start
echo "7️⃣  Waiting for service to start..."
sleep 3
echo ""

# Step 8: Check service status
echo "8️⃣  Checking service status..."
if sudo systemctl is-active --quiet crm-frontend.service; then
    echo "   ✅ Frontend service is running"
    sudo systemctl status crm-frontend.service --no-pager -l | head -15
else
    echo "   ❌ Frontend service is not running!"
    sudo systemctl status crm-frontend.service --no-pager -l
    echo ""
    echo "Check logs:"
    sudo journalctl -u crm-frontend.service -n 30 --no-pager
    exit 1
fi
echo ""

# Step 9: Test the application
echo "9️⃣  Testing application..."
echo "   Testing http://localhost:3000/"
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1)
echo "   Local: HTTP $LOCAL_TEST"

if [ -f /etc/letsencrypt/live/frontend.onsync-test.xyz/fullchain.pem ]; then
    echo "   Testing https://frontend.onsync-test.xyz/"
    PUBLIC_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://frontend.onsync-test.xyz/ 2>&1)
    echo "   Public: HTTP $PUBLIC_TEST"
    
    if [ "$PUBLIC_TEST" = "200" ]; then
        echo "   ✅ Frontend is accessible via HTTPS!"
    fi
else
    echo "   ⚠️  SSL not configured, skipping public test"
fi
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo ""
echo "📋 SUMMARY:"
echo "   - Frontend built and ready"
echo "   - systemd service: crm-frontend.service"
echo "   - nginx configured and running"
echo "   - Application running on port 3000"
echo ""
echo "🌐 ACCESS:"
echo "   - Local: http://localhost:3000"
if [ -f /etc/letsencrypt/live/frontend.onsync-test.xyz/fullchain.pem ]; then
    echo "   - Public: https://frontend.onsync-test.xyz"
fi
echo ""
echo "📊 MANAGE SERVICE:"
echo "   - Status:  sudo systemctl status crm-frontend.service"
echo "   - Logs:    sudo journalctl -u crm-frontend.service -f"
echo "   - Restart: sudo systemctl restart crm-frontend.service"
echo ""
echo "=========================================="
