# Package Model Account Separation - Implementation Guide

## Summary
Updated the Package model to be account-specific instead of global. Each account can now have their own custom packages with the same names without conflicts.

## Changes Made

### 1. Model Updates (`api/models.py`)

**Package Model:**
- ✅ Added `account` ForeignKey to Account model
- ✅ Changed `package_name` from globally unique to unique per account
- ✅ Added `unique_together` constraint on `['account', 'package_name']`

```python
class Package(models.Model):
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    package_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'packages'
        unique_together = [['account', 'package_name']]
```

### 2. Serializer Updates (`api/serializers.py`)

**PackageSerializer:**
- ✅ Added `account` field
- ✅ Added `account_name` read-only field for display
- ✅ Updated fields list

```python
class PackageSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Package
        fields = ['id', 'account', 'account_name', 'package_name', 'description']
        read_only_fields = ['id', 'account_name']
```

### 3. ViewSet Updates (`api/views.py`)

**PackageViewSet:**
- ✅ Updated permission to `IsAccountMember`
- ✅ Added `get_queryset()` to filter by account
- ✅ Added `perform_create()` to auto-set account on creation

```python
def get_queryset(self):
    return Package.objects.filter(account_id=self.request.user.account_id)

def perform_create(self, serializer):
    serializer.save(account_id=self.request.user.account_id)
```

### 4. Database Migration

**File:** `supabase/migrations/20251112194500_add_account_to_packages.sql`

Changes:
- ✅ Adds `account_id` column with NOT NULL constraint
- ✅ Adds foreign key to accounts table with CASCADE delete
- ✅ Drops old global unique constraint on `package_name`
- ✅ Adds new unique constraint on `(account_id, package_name)`
- ✅ Creates index on `account_id` for performance
- ✅ Sets DEFAULT value to 1 for existing records

## Migration Steps

### Local Development
```bash
# Apply migration to local Supabase
supabase migration up

# Restart Django dev server
python manage.py runserver
```

### Production Deployment
```bash
# 1. Push migration to production database
supabase db push

# 2. Commit and push code changes
git add .
git commit -m "Add account_id to packages for account-specific packages"
git push origin main

# 3. On production server
ssh ubuntu@your-server
cd ~/Client-Management-CRM
git pull origin main
sudo systemctl restart crm-backend.service
```

## API Usage Examples

### Create Package (account auto-assigned)
```bash
curl -X POST "http://127.0.0.1:8000/api/packages/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_name": "Premium Coaching",
    "description": "12-week premium coaching package"
  }'
```

### List Packages (filtered by account)
```bash
curl -X GET "http://127.0.0.1:8000/api/packages/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Search Packages
```bash
curl -X GET "http://127.0.0.1:8000/api/packages/?search=coaching" \
  -H "Authorization: Token YOUR_TOKEN"
```

## Benefits

1. **Account Isolation:** Each account has their own packages
2. **Name Flexibility:** Different accounts can use the same package names
3. **Data Security:** Users can only see/manage packages in their account
4. **Automatic Assignment:** Account is automatically set on package creation
5. **Cascading Delete:** When account is deleted, their packages are deleted too

## Breaking Changes

⚠️ **Important:** Existing packages will be assigned to account_id = 1 by default in the migration. You may need to manually reassign packages to the correct accounts if you have existing data.

## Rollback Plan

If issues occur, you can rollback the migration:

```sql
-- Remove unique constraint
ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_account_package_name_unique;

-- Re-add global unique constraint
ALTER TABLE public.packages ADD CONSTRAINT packages_package_name_key UNIQUE (package_name);

-- Remove account_id column
ALTER TABLE public.packages DROP COLUMN IF EXISTS account_id;
```

## Testing Checklist

- [ ] Apply migration locally
- [ ] Create package via API (verify account auto-assignment)
- [ ] List packages (verify only account packages shown)
- [ ] Create package with duplicate name in different account (should succeed)
- [ ] Update package
- [ ] Delete package
- [ ] Apply migration to production
- [ ] Verify existing packages still work
- [ ] Test client package creation with account-specific packages

## Notes

- The `account` field will be automatically populated when creating packages via the API
- ClientPackages will continue to work normally as they reference Package by ID
- The unique constraint ensures no duplicate package names within an account
- Cross-account package sharing is prevented by the account filter in the ViewSet
