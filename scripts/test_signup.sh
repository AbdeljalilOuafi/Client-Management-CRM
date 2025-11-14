#!/bin/bash
# Test script for signup endpoint

echo "Testing signup endpoint..."
echo ""

curl -X POST http://127.0.0.1:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "account": {
      "name": "Test Company Inc",
      "email": "test@company.com",
      "ceo_name": "Jane Doe",
      "niche": "Technology",
      "location": "San Francisco, CA",
      "website_url": "https://testcompany.com",
      "timezone": "America/Los_Angeles"
    },
    "user": {
      "name": "Jane Doe",
      "email": "jane@testcompany.com",
      "password": "SecurePassword123!",
      "phone_number": "+14155551234",
      "job_role": "CEO"
    }
  }' | python -m json.tool

echo ""
echo "Test completed!"
