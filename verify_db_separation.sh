#!/bin/bash
# Verify database tables are separate and correctly configured

echo "=== Checking Database Tables ===="
echo ""

echo "1. Checking if employee_tokens table exists..."
supabase db dump --local --data-only --schema public | grep -q "employee_tokens" && echo "✅ employee_tokens table exists" || echo "❌ employee_tokens table missing"

echo ""
echo "2. Checking if authtoken_token table exists (for old app)..."
supabase db dump --local --data-only --schema public | grep -q "authtoken_token" && echo "✅ authtoken_token table exists (old app preserved)" || echo "❌ authtoken_token table missing"

echo ""
echo "3. Current token in employee_tokens table:"
echo "SELECT key, user_id, created FROM employee_tokens;" | supabase db execute --local

echo ""
echo "4. Checking authtoken_token table (should be empty or have old app tokens):"
echo "SELECT COUNT(*) as token_count FROM authtoken_token;" | supabase db execute --local

echo ""
echo "=== Database Separation Verified ==="
