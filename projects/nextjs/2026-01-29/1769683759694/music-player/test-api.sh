#!/bin/bash
# Simple API test script

echo "Testing Music Player API Endpoints"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4

  echo -n "Testing: $description ... "

  response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:3000$endpoint" 2>&1)
  status=$(echo "$response" | tail -n1)

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC} (Status: $status)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status)"
    FAILED=$((FAILED + 1))
  fi
}

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null; then
  echo -e "${GREEN}Server is running${NC}"
  echo ""
else
  echo -e "${RED}Server is not running. Please start with 'npm run dev'${NC}"
  exit 1
fi

# Test endpoints (expecting 401 Unauthorized since we're not authenticated)
echo "Testing API endpoints (expecting 401 - Unauthorized):"
echo ""

test_endpoint "GET" "/api/tracks" "401" "GET /api/tracks"
test_endpoint "GET" "/api/tracks/123" "401" "GET /api/tracks/[id]"
test_endpoint "GET" "/api/albums" "401" "GET /api/albums"
test_endpoint "GET" "/api/albums/123" "401" "GET /api/albums/[id]"
test_endpoint "GET" "/api/artists" "401" "GET /api/artists"
test_endpoint "GET" "/api/artists/123" "401" "GET /api/artists/[id]"
test_endpoint "GET" "/api/playlists" "401" "GET /api/playlists"
test_endpoint "POST" "/api/playlists" "401" "POST /api/playlists"
test_endpoint "GET" "/api/favorites" "401" "GET /api/favorites"
test_endpoint "POST" "/api/favorites" "401" "POST /api/favorites"
test_endpoint "GET" "/api/playhistory" "401" "GET /api/playhistory"
test_endpoint "POST" "/api/playhistory" "401" "POST /api/playhistory"

echo ""
echo "==================================="
echo "Test Summary:"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "==================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed${NC}"
  exit 1
fi
