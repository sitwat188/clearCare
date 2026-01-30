#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ClearCare+ API Endpoint Testing${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (200)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 2: Register Patient
echo -e "${YELLOW}2. Testing Register Patient...${NC}"
REGISTER_PATIENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Patient",
    "role": "patient"
  }')
HTTP_CODE=$(echo "$REGISTER_PATIENT_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_PATIENT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Patient registration successful (201)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    # Extract tokens
    PATIENT_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    PATIENT_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.refreshToken' 2>/dev/null)
else
    echo -e "${RED}✗ Patient registration failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 3: Register Provider
echo -e "${YELLOW}3. Testing Register Provider...${NC}"
REGISTER_PROVIDER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.provider@example.com",
    "password": "TestPassword123!",
    "firstName": "Dr. Test",
    "lastName": "Provider",
    "role": "provider"
  }')
HTTP_CODE=$(echo "$REGISTER_PROVIDER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_PROVIDER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Provider registration successful (201)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    # Extract tokens
    PROVIDER_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    PROVIDER_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.refreshToken' 2>/dev/null)
else
    echo -e "${RED}✗ Provider registration failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 4: Register Admin (Should Fail)
echo -e "${YELLOW}4. Testing Register Admin (Should Fail)...${NC}"
REGISTER_ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "TestPassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "administrator"
  }')
HTTP_CODE=$(echo "$REGISTER_ADMIN_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_ADMIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Admin registration correctly rejected (400)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 5: Login with Patient
echo -e "${YELLOW}5. Testing Login (Patient)...${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "TestPassword123!"
  }')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login successful (200)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    # Extract tokens
    LOGIN_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    LOGIN_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.refreshToken' 2>/dev/null)
else
    echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 6: Login with Wrong Password (Should Fail)
echo -e "${YELLOW}6. Testing Login with Wrong Password (Should Fail)...${NC}"
LOGIN_WRONG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "WrongPassword"
  }')
HTTP_CODE=$(echo "$LOGIN_WRONG_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_WRONG_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Wrong password correctly rejected (401)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 7: Get Current User (Protected - Requires Auth)
if [ -n "$LOGIN_ACCESS_TOKEN" ] && [ "$LOGIN_ACCESS_TOKEN" != "null" ]; then
    echo -e "${YELLOW}7. Testing Get Current User (Protected)...${NC}"
    ME_RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/auth/me \
      -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
    HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
    BODY=$(echo "$ME_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get current user successful (200)${NC}"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}✗ Get current user failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
else
    echo -e "${RED}7. Skipping Get Current User (no access token)${NC}"
fi
echo ""

# Test 8: Get Current User Without Token (Should Fail)
echo -e "${YELLOW}8. Testing Get Current User Without Token (Should Fail)...${NC}"
ME_NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/auth/me)
HTTP_CODE=$(echo "$ME_NO_TOKEN_RESPONSE" | tail -n1)
BODY=$(echo "$ME_NO_TOKEN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Unauthorized access correctly rejected (401)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 9: Refresh Token
if [ -n "$LOGIN_REFRESH_TOKEN" ] && [ "$LOGIN_REFRESH_TOKEN" != "null" ]; then
    echo -e "${YELLOW}9. Testing Refresh Token...${NC}"
    REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/refresh \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $LOGIN_REFRESH_TOKEN" \
      -d "{\"refreshToken\": \"$LOGIN_REFRESH_TOKEN\"}")
    HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
    BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Refresh token successful (200)${NC}"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
        NEW_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    else
        echo -e "${RED}✗ Refresh token failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
else
    echo -e "${RED}9. Skipping Refresh Token (no refresh token)${NC}"
fi
echo ""

# Test 10: Logout (Protected)
if [ -n "$LOGIN_ACCESS_TOKEN" ] && [ "$LOGIN_ACCESS_TOKEN" != "null" ]; then
    echo -e "${YELLOW}10. Testing Logout (Protected)...${NC}"
    LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/logout \
      -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
    HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Logout successful (200)${NC}"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}✗ Logout failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
else
    echo -e "${RED}10. Skipping Logout (no access token)${NC}"
fi
echo ""

# Test 11: Validation Errors - Invalid Email
echo -e "${YELLOW}11. Testing Validation - Invalid Email (Should Fail)...${NC}"
INVALID_EMAIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }')
HTTP_CODE=$(echo "$INVALID_EMAIL_RESPONSE" | tail -n1)
BODY=$(echo "$INVALID_EMAIL_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Invalid email correctly rejected (400)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 12: Validation Errors - Short Password
echo -e "${YELLOW}12. Testing Validation - Short Password (Should Fail)...${NC}"
SHORT_PASSWORD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "123",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }')
HTTP_CODE=$(echo "$SHORT_PASSWORD_RESPONSE" | tail -n1)
BODY=$(echo "$SHORT_PASSWORD_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Short password correctly rejected (400)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 13: Duplicate Email Registration (Should Fail)
echo -e "${YELLOW}13. Testing Duplicate Email Registration (Should Fail)...${NC}"
DUPLICATE_EMAIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Patient",
    "role": "patient"
  }')
HTTP_CODE=$(echo "$DUPLICATE_EMAIL_RESPONSE" | tail -n1)
BODY=$(echo "$DUPLICATE_EMAIL_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "409" ]; then
    echo -e "${GREEN}✓ Duplicate email correctly rejected (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
