#!/bin/bash
# Quick fix script for DisallowedHost error
# Run this on your production server: bash fix_env.sh

set -e  # Exit on any error

echo "🔧 Fixing .env file format..."
echo ""

cd ~/Client-Management-CRM

# Backup existing .env
if [ -f .env ]; then
    echo "📦 Backing up current .env to .env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create new .env with correct format (NO spaces, NO quotes)
cat > .env << 'EOF'
SECRET_KEY=6=_5$_cu1f#q$*^4v@$#bl+5obwam4-ajfrd!%u8)d^di4sads
DEBUG=False
ALLOWED_HOSTS=backend.onsync-test.xyz,www.backend.onsync-test.xyz
DATABASE_URL=postgresql://postgres.iqsugeurjktibkalmsim:GRnjFJylmJmBcxnt@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
CORS_ALLOWED_ORIGINS=https://frontend.onsync-test.xyz,https://www.frontend.onsync-test.xyz
DJANGO_LOG_LEVEL=INFO
EOF

echo "✅ Created new .env file"
echo ""

# Verify
echo "📄 .env file contents:"
cat .env
echo ""

# Set proper permissions
chmod 644 .env
echo "✅ Set file permissions to 644"
echo ""

# Test environment loading
echo "🧪 Testing environment loading..."
source venv/bin/activate
if python test_env_loading.py; then
    echo ""
    echo "✅ Environment loading test passed!"
else
    echo ""
    echo "⚠️  Environment loading test had issues. Check output above."
fi
echo ""

# Restart service
echo "🔄 Restarting crm-backend service..."
sudo systemctl restart crm-backend.service
echo ""

# Check status
echo "📊 Service status:"
sudo systemctl status crm-backend.service --no-pager -l
echo ""

# Check recent logs
echo "📋 Recent logs:"
sudo journalctl -u crm-backend.service -n 20 --no-pager
echo ""

# Test API
echo "🌐 Testing API endpoint..."
if curl -I https://backend.onsync-test.xyz/health/ 2>&1 | grep -q "HTTP"; then
    echo "✅ API is responding!"
else
    echo "⚠️  API might not be responding. Check logs above."
fi
echo ""

echo "=" 
echo "✅ Fix complete!"
echo ""
echo "Next steps:"
echo "1. Test the signup endpoint: https://backend.onsync-test.xyz/api/auth/signup/"
echo "2. If you still see errors, check logs: sudo journalctl -u crm-backend.service -f"
echo "="
