#!/usr/bin/env python
"""Test script for the signup endpoint"""
import requests
import json

url = "http://127.0.0.1:8000/api/auth/signup/"
data = {
    "account": {
        "name": "Acme Corp",
        "subscription_plan": "premium",
        "max_users": 10
    },
    "user": {
        "email": "admin@acme.com",
        "password": "SecurePass123!",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890"
    }
}

print("Testing signup endpoint...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print("\nSending request...")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"\nError: {e}")
    print(f"Response Text: {response.text if 'response' in locals() else 'No response'}")
