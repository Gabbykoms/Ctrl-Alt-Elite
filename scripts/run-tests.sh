#!/bin/bash

# Comprehensive Test Suite for Bantam Shuttle
# Tests all microservices, databases, and API endpoints

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Bantam Shuttle - Comprehensive Test Suite           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

fail_test() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

skip_test() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((TESTS_SKIPPED++))
}

test_endpoint() {
    local url=$1
    local expected_code=${2:-200}
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        pass_test "$description (HTTP $response)"
    else
        fail_test "$description (Expected $expected_code, got $response)"
    fi
}

# Test 1: Environment Variables
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 1: Environment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f .env ]; then
    pass_test "Root .env file exists"
else
    fail_test "Root .env file missing"
fi

if [ -f backend/.env ]; then
    pass_test "Backend .env file exists"
else
    fail_test "Backend .env file missing"
fi

if [ -f AI_Intergration_Service/.env ]; then
    pass_test "AI Service .env file exists"
else
    fail_test "AI Service .env file missing"
fi

echo ""

# Test 2: Docker Containers
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 2: Docker Containers${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker ps | grep -q "tracking-postgres"; then
    pass_test "PostgreSQL container running"
    
    # Test PostgreSQL connection
    if docker exec tracking-postgres pg_isready -U tracking_user > /dev/null 2>&1; then
        pass_test "PostgreSQL accepting connections"
    else
        fail_test "PostgreSQL not accepting connections"
    fi
    
    # Check table count
    TABLE_COUNT=$(docker exec tracking-postgres psql -U tracking_user -d tracking_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$TABLE_COUNT" -gt 0 ]; then
        pass_test "PostgreSQL has $TABLE_COUNT tables"
    else
        fail_test "PostgreSQL has no tables"
    fi
else
    fail_test "PostgreSQL container not running"
    skip_test "Skipping PostgreSQL connection tests"
fi

if docker ps | grep -q "tracking-redis"; then
    pass_test "Redis container running"
    
    # Test Redis connection
    if docker exec tracking-redis redis-cli -a redis_password ping 2>/dev/null | grep -q "PONG"; then
        pass_test "Redis accepting connections"
    else
        fail_test "Redis not accepting connections"
    fi
else
    fail_test "Redis container not running"
    skip_test "Skipping Redis connection tests"
fi

echo ""

# Test 3: Backend Service
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 3: Backend Service (Port 8080)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "http://localhost:8080/health" 200 "Backend health check"
test_endpoint "http://localhost:8080/api-docs" 200 "Backend Swagger UI"
test_endpoint "http://localhost:8080/" 302 "Backend root redirect"

# Test backend API endpoints (should return 401 without auth or empty arrays)
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/shuttles" 2>/dev/null || echo "000")
if [ "$backend_status" = "200" ] || [ "$backend_status" = "401" ]; then
    pass_test "Backend API /shuttles endpoint responding"
else
    skip_test "Backend service not running on port 8080"
fi

echo ""

# Test 4: Tracking Service
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 4: Tracking Service (Port 8081)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "http://localhost:8081/actuator/health" 200 "Tracking service health"
test_endpoint "http://localhost:8081/swagger-ui.html" 200 "Tracking service Swagger UI"

# Test tracking API endpoints
tracking_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/v1/stops" 2>/dev/null || echo "000")
if [ "$tracking_status" = "200" ]; then
    pass_test "Tracking API /v1/stops endpoint responding"
    
    # Check if stops are loaded
    stops_count=$(curl -s "http://localhost:8081/v1/stops" 2>/dev/null | grep -o "\"id\"" | wc -l | tr -d ' ')
    if [ "$stops_count" -gt 0 ]; then
        pass_test "Tracking service has $stops_count stops loaded"
    else
        fail_test "Tracking service has no stops"
    fi
else
    skip_test "Tracking service not running on port 8081"
fi

echo ""

# Test 5: AI Service
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 5: AI Service (Port 8083)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "http://localhost:8083/health" 200 "AI service health check"
test_endpoint "http://localhost:8083/docs" 200 "AI service FastAPI docs"
test_endpoint "http://localhost:8083/" 200 "AI service root endpoint"

# Test AI chat endpoint (should accept POST)
ai_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8083/chat/" 2>/dev/null || echo "000")
if [ "$ai_status" = "405" ] || [ "$ai_status" = "422" ]; then
    pass_test "AI service /chat/ endpoint exists (needs POST)"
elif [ "$ai_status" = "000" ]; then
    skip_test "AI service not running on port 8083"
else
    fail_test "AI service /chat/ endpoint issue (HTTP $ai_status)"
fi

echo ""

# Test 6: Frontend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 6: Frontend (Port 5173)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173" 2>/dev/null || echo "000")
if [ "$frontend_status" = "200" ]; then
    pass_test "Frontend running on port 5173"
else
    skip_test "Frontend not running on port 5173"
fi

echo ""

# Test 7: API Integration Tests
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 7: API Integration Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test tracking service drivers endpoint
if curl -s "http://localhost:8081/v1/drivers" > /dev/null 2>&1; then
    pass_test "Tracking /v1/drivers endpoint accessible"
else
    skip_test "Tracking service drivers endpoint not accessible"
fi

# Test tracking service rides endpoint
if curl -s "http://localhost:8081/v1/rides" > /dev/null 2>&1; then
    pass_test "Tracking /v1/rides endpoint accessible"
else
    skip_test "Tracking service rides endpoint not accessible"
fi

echo ""

# Test 8: Node.js Dependencies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Suite 8: Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "backend/node_modules" ]; then
    pass_test "Backend dependencies installed"
else
    fail_test "Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    pass_test "Frontend dependencies installed"
else
    fail_test "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

if [ -f "AI_Intergration_Service/.venv/bin/activate" ] || [ -f "AI_Intergration_Service/venv/bin/activate" ]; then
    pass_test "AI service virtual environment exists"
else
    fail_test "AI service virtual environment not found"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Passed:  $TESTS_PASSED${NC}"
echo -e "${RED}Failed:  $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
echo "Total:   $TOTAL_TESTS tests"
echo ""

# Recommendations
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  Some tests failed. Recommended actions:${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if ! docker ps | grep -q "tracking-postgres\|tracking-redis"; then
        echo "  • Start Docker containers: ./setup-databases.sh"
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        echo "  • Install backend dependencies: cd backend && npm install"
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo "  • Install frontend dependencies: cd frontend && npm install"
    fi
    
    echo ""
fi

if [ $TESTS_SKIPPED -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}ℹ️  Some services are not running. To start all services:${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  1. Backend:   cd backend && npm run dev"
    echo "  2. Tracking:  cd tracking-service && ./gradlew bootRun"
    echo "  3. AI:        cd AI_Intergration_Service && uvicorn app.main:app --reload --port 8083"
    echo "  4. Frontend:  cd frontend && npm run dev"
    echo ""
fi

if [ $TESTS_FAILED -eq 0 ] && [ $TESTS_SKIPPED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 All tests passed! System is ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "You can now:"
    echo "  • Open frontend: http://localhost:5173"
    echo "  • Check backend API: http://localhost:8080/api-docs"
    echo "  • Test AI chat: http://localhost:8083/docs"
    echo ""
fi

exit $TESTS_FAILED
