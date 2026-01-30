#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "Testing API Endpoints..."
echo "========================="
echo ""

# Test 1: Health
echo "1. Health Check:"
curl -s $BASE_URL/health | jq . || curl -s $BASE_URL/health
echo ""
echo ""

# Test 2: Register (this should work if routes are registered)
echo "2. Register Patient:"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newpatient@test.com",
    "password": "TestPassword123!",
    "firstName": "New",
    "lastName": "Patient",
    "role": "patient"
  }' | jq . || curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newpatient@test.com",
    "password": "TestPassword123!",
    "firstName": "New",
    "lastName": "Patient",
    "role": "patient"
  }'
echo ""
echo ""

# Test 3: List all available routes (if possible)
echo "3. Checking if server is responding:"
curl -s -I $BASE_URL/health | head -5
echo ""
