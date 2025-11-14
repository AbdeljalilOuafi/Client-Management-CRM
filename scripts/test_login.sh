#!/bin/bash
# Test login endpoint with the created user

echo "Testing login endpoint..."
echo ""

TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@testcompany.com",
    "password": "SecurePassword123!"
  }' | python -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "Login successful! Token: $TOKEN"
echo ""

echo "Testing /api/auth/me/ endpoint with token..."
curl -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Token $TOKEN" | python -m json.tool

echo ""
echo "Test completed!"
