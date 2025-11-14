#!/bin/bash

# Test script for payment-details endpoint
# Usage: ./test_payment_details.sh <client_id> <token>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <client_id> <token>"
    echo "Example: $0 1 abc123token"
    exit 1
fi

CLIENT_ID=$1
TOKEN=$2

echo "========================================="
echo "Testing Payment Details Endpoint"
echo "========================================="
echo ""
echo "Client ID: $CLIENT_ID"
echo ""

curl -X GET "http://127.0.0.1:8000/api/clients/${CLIENT_ID}/payment-details/" \
  -H "Authorization: Token ${TOKEN}" \
  -H "Content-Type: application/json" \
  | python -m json.tool

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="
