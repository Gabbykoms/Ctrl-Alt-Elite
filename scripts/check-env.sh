#!/bin/bash

# Environment Variables Check Script for Bantam Shuttle
# This script verifies all required environment variables are set

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Environment Variables Check          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load root .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local is_optional=$2
    
    if [ -z "$var_value" ] || [ "$var_value" = "<your_token>" ] || [ "$var_value" = "<your_key>" ] || [ "$var_value" = "<random_string>" ]; then
        if [ "$is_optional" = "optional" ]; then
            echo -e "  ${YELLOW}⚠️  $var_name${NC} - Optional, not set"
        else
            echo -e "  ${RED}❌ $var_name${NC} - MISSING or placeholder"
            return 1
        fi
    else
        echo -e "  ${GREEN}✅ $var_name${NC} - Set"
    fi
    return 0
}

errors=0

# Frontend Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_var "VITE_MAPBOX_TOKEN" || ((errors++))
check_var "VITE_API_BASE_URL" || ((errors++))
check_var "VITE_SOCKET_URL" || ((errors++))
check_var "VITE_TRACKING_SERVICE_URL" || ((errors++))
check_var "VITE_AI_SERVICE_URL" || ((errors++))
echo ""

# Backend Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_var "SUPABASE_URL" || ((errors++))
check_var "SUPABASE_ANON_KEY" || ((errors++))
check_var "SUPABASE_SERVICE_ROLE_KEY" || ((errors++))
check_var "JWT_SECRET" || ((errors++))
check_var "TRACKING_SERVICE_URL" || ((errors++))
check_var "AI_SERVICE_URL" || ((errors++))
echo ""

# Tracking Service Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚗 Tracking Service Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_var "DB_HOST" || ((errors++))
check_var "DB_PORT" || ((errors++))
check_var "DB_NAME" || ((errors++))
check_var "DB_USER" || ((errors++))
check_var "DB_PASSWORD" || ((errors++))
check_var "REDIS_HOST" || ((errors++))
check_var "REDIS_PORT" || ((errors++))
check_var "REDIS_PASSWORD" || ((errors++))
echo ""

# AI Service Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 AI Service Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_var "DATABASE_URL" || ((errors++))
check_var "SUPABASE_URL" || ((errors++))
check_var "SUPABASE_KEY" || ((errors++))
check_var "OPENAI_API_KEY" || ((errors++))
check_var "OPENWEATHER_API_KEY" "optional"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are set!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start databases: cd tracking-service/docker && docker-compose up -d"
    echo "  2. Start backend: cd backend && npm run dev"
    echo "  3. Start tracking: cd tracking-service && ./gradlew bootRun"
    echo "  4. Start AI: cd AI_Intergration_Service && uvicorn app.main:app --reload --port 8083"
    echo "  5. Start frontend: cd frontend && npm run dev"
else
    echo -e "${RED}❌ Found $errors missing or placeholder environment variables${NC}"
    echo ""
    echo "Please update the .env file with proper values before starting services."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $errors
