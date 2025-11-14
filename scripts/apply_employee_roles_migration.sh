#!/bin/bash
# Apply the employee roles migration to the Supabase database

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

echo "Applying migration: 20251112193700_add_employee_roles.sql"
echo "=================================================="

# Apply the migration
psql "$DATABASE_URL" -f supabase/migrations/20251112193700_add_employee_roles.sql

if [ $? -eq 0 ]; then
    echo "=================================================="
    echo "✅ Migration applied successfully!"
    echo ""
    echo "The following roles are now available:"
    echo "  - super_admin"
    echo "  - admin"
    echo "  - employee"
    echo "  - coach"
    echo "  - closer"
    echo "  - setter"
else
    echo "=================================================="
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
