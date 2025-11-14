#!/bin/bash
# Clean test accounts from database
# Run this on production server if you want to remove test data

echo "🧹 Cleaning Test Data"
echo "=========================================="
echo ""

cd ~/Client-Management-CRM
source venv/bin/activate

echo "⚠️  WARNING: This will delete test accounts from the database!"
echo ""
echo "Test accounts to be deleted:"
echo "  - support@company.com"
echo "  - ouafi@example.com"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "Deleting test data..."

python manage.py shell << 'PYTHON_EOF'
from api.models import Account, Employee

# Delete test accounts
test_emails = [
    'support@company.com',
    'ouafi@example.com',
]

deleted_accounts = 0
deleted_employees = 0

for email in test_emails:
    # Delete by account email
    accounts = Account.objects.filter(email=email)
    count = accounts.count()
    if count > 0:
        accounts.delete()
        deleted_accounts += count
        print(f"✅ Deleted account: {email}")
    
    # Delete by employee email
    employees = Employee.objects.filter(email=email)
    count = employees.count()
    if count > 0:
        employees.delete()
        deleted_employees += count
        print(f"✅ Deleted employee: {email}")

print(f"\n📊 Summary:")
print(f"   Accounts deleted: {deleted_accounts}")
print(f"   Employees deleted: {deleted_employees}")
PYTHON_EOF

echo ""
echo "✅ Test data cleaned!"
echo ""
echo "🧪 Now you can test signup again:"
echo "curl -X POST https://backend.onsync-test.xyz/api/auth/signup/ \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{...}'"
echo ""
echo "=========================================="
