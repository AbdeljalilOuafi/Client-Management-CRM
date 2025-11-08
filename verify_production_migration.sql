-- Verification queries for production migration

-- 1. Check employee_tokens table exists
SELECT 'employee_tokens table' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_tokens') 
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check Django auth fields on employees table
SELECT 'employees.role' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'employees.password',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'password')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'employees.is_active',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_active')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'employees.is_staff',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_staff')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'employees.is_superuser',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'is_superuser')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'employees.last_login',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_login')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 3. Check permission tables
SELECT 'employees_groups table' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees_groups')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'employees_user_permissions table',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees_user_permissions')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 4. Check account_id was added to payments
SELECT 'payments.account_id' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'account_id')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 5. Check account_id was added to instalments
SELECT 'instalments.account_id' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'account_id')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 6. Count existing records
SELECT 'Data Integrity Check' as section, '' as details
UNION ALL
SELECT '  Accounts', COUNT(*)::text FROM accounts
UNION ALL
SELECT '  Employees', COUNT(*)::text FROM employees
UNION ALL
SELECT '  Clients', COUNT(*)::text FROM clients
UNION ALL
SELECT '  Payments', COUNT(*)::text FROM payments
UNION ALL
SELECT '  Instalments', COUNT(*)::text FROM instalments;
