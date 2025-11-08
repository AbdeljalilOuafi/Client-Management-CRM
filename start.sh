#!/bin/bash

# Quick Start Script for Client Management CRM

echo "========================================="
echo "Client Management CRM - Quick Start"
echo "========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Check database connection
echo "✅ Checking database connection..."
python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed!"
    echo "Please ensure your Supabase instance is running:"
    echo "  supabase start"
    exit 1
fi

echo "✅ Database connection successful!"

# Check for accounts
echo "✅ Checking for accounts in database..."
ACCOUNT_COUNT=$(python manage.py shell -c "from api.models import Account; print(Account.objects.count())" 2>/dev/null)

if [ "$ACCOUNT_COUNT" = "0" ]; then
    echo "⚠️  No accounts found in database!"
    echo "Please create an account in your Supabase database first."
    echo ""
    echo "You can do this via SQL:"
    echo "  INSERT INTO accounts (name, email, created_at, updated_at) VALUES ('Test Company', 'test@example.com', NOW(), NOW());"
    exit 1
fi

echo "✅ Found $ACCOUNT_COUNT account(s)"

# Check for superadmin
echo "✅ Checking for superadmin user..."
SUPERADMIN_EXISTS=$(python manage.py shell -c "from api.models import Employee; print(Employee.objects.filter(role='super_admin').exists())" 2>/dev/null)

if [ "$SUPERADMIN_EXISTS" != "True" ]; then
    echo "⚠️  No superadmin found. Creating one..."
    python manage.py create_superadmin --email=admin@example.com --password=admin123 --name="Super Admin"
    echo ""
fi

echo ""
echo "========================================="
echo "🚀 Starting Development Server..."
echo "========================================="
echo ""
echo "API will be available at: http://127.0.0.1:8000/api/"
echo "Admin panel at: http://127.0.0.1:8000/admin/"
echo ""
echo "Test credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python manage.py runserver
