#!/bin/bash

# Complete Setup Script for Bantam Shuttle
# This script sets up everything: dependencies, databases, and starts all services

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Complete Setup & Startup Script      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT=$(pwd)

# Function to print section headers
section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Prerequisites
section "Step 1: Checking Prerequisites"

echo -n "Checking Docker... "
if command_exists docker; then
    echo -e "${GREEN}✅ Installed$(docker --version | head -1)${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -n "Checking Node.js... "
if command_exists node; then
    echo -e "${GREEN}✅ Installed ($(node --version))${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo -n "Checking npm... "
if command_exists npm; then
    echo -e "${GREEN}✅ Installed ($(npm --version))${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    exit 1
fi

echo -n "Checking Python 3... "
if command_exists python3; then
    echo -e "${GREEN}✅ Installed ($(python3 --version))${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    echo "Please install Python 3 from: https://www.python.org/"
    exit 1
fi

echo -n "Checking Java... "
if command_exists java; then
    echo -e "${GREEN}✅ Installed ($(java -version 2>&1 | head -1))${NC}"
else
    echo -e "${YELLOW}⚠️  Not found (needed for tracking service)${NC}"
fi

# Step 2: Setup Docker Databases
section "Step 2: Setting Up Docker Databases (PostgreSQL + Redis)"

cd "$PROJECT_ROOT/tracking-service"

if docker ps | grep -q "tracking-postgres\|tracking-redis"; then
    echo -e "${YELLOW}⚠️  Containers already running${NC}"
    read -p "Restart containers? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping containers..."
        docker-compose down
        echo "Starting containers..."
        docker-compose up -d
    fi
else
    echo "Starting PostgreSQL and Redis containers..."
    docker-compose up -d
fi

echo "Waiting for databases to be ready..."
sleep 8

# Verify PostgreSQL
if docker exec tracking-postgres pg_isready -U tracking_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

# Verify Redis
if docker exec tracking-redis redis-cli -a redis_password ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis ready${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Step 3: Install Backend Dependencies
section "Step 3: Installing Backend Dependencies"

cd "$PROJECT_ROOT/backend"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies already installed${NC}"
    read -p "Reinstall? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules package-lock.json
        npm install
    fi
else
    echo "Installing backend dependencies..."
    npm install
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

cd "$PROJECT_ROOT"

# Step 4: Install Frontend Dependencies
section "Step 4: Installing Frontend Dependencies"

cd "$PROJECT_ROOT/frontend"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies already installed${NC}"
    read -p "Reinstall? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules package-lock.json
        npm install
    fi
else
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

cd "$PROJECT_ROOT"

# Step 5: Setup AI Service Environment
section "Step 5: Setting Up AI Service Python Environment"

cd "$PROJECT_ROOT/AI_Intergration_Service"

if [ -d ".venv" ] || [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
    read -p "Recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .venv venv
        python3 -m venv .venv
        source .venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    else
        source .venv/bin/activate 2>/dev/null || source venv/bin/activate
        pip install -r requirements.txt
    fi
else
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "Upgrading pip..."
    pip install --upgrade pip
    echo "Installing AI service dependencies..."
    pip install -r requirements.txt
fi

echo -e "${GREEN}✅ AI service environment ready${NC}"

cd "$PROJECT_ROOT"

# Step 6: Run Database Migrations
section "Step 6: Database Migration Instructions"

echo -e "${CYAN}Supabase databases need manual setup:${NC}"
echo ""
echo -e "${YELLOW}Backend Database:${NC}"
echo "  1. Open: https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb"
echo "  2. Go to SQL Editor"
echo "  3. Copy and paste: backend/database-migration.sql"
echo "  4. Click Run"
echo ""
echo -e "${YELLOW}AI Service Database:${NC}"
echo "  1. Open: https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso"
echo "  2. Go to SQL Editor"
echo "  3. Run: CREATE EXTENSION IF NOT EXISTS vector;"
echo "  4. Then run: cd AI_Intergration_Service && source .venv/bin/activate && python scripts/ingest_knowledge_base.py"
echo ""
read -p "Press Enter after completing Supabase setup (or Ctrl+C to skip)..."

# Step 7: Start All Services
section "Step 7: Starting All Microservices"

echo -e "${CYAN}This will start all services in separate terminal windows${NC}"
echo ""
read -p "Start all services now? (Y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Detect terminal type
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Starting services in new Terminal windows..."
        
        # Backend
        osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/backend' && npm run dev"
end tell
EOF
        
        # Tracking Service
        osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/tracking-service' && ./gradlew bootRun"
end tell
EOF
        
        # AI Service
        osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/AI_Intergration_Service' && source .venv/bin/activate && uvicorn app.main:app --reload --port 8083"
end tell
EOF
        
        # Frontend
        osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/frontend' && npm run dev"
end tell
EOF
        
        echo -e "${GREEN}✅ Services started in separate Terminal windows${NC}"
        
    else
        # Linux/Other - start in background
        echo "Starting services in background..."
        
        cd "$PROJECT_ROOT/backend"
        nohup npm run dev > ../logs/backend.log 2>&1 &
        echo $! > ../logs/backend.pid
        
        cd "$PROJECT_ROOT/tracking-service"
        nohup ./gradlew bootRun > ../logs/tracking.log 2>&1 &
        echo $! > ../logs/tracking.pid
        
        cd "$PROJECT_ROOT/AI_Intergration_Service"
        source .venv/bin/activate
        nohup uvicorn app.main:app --reload --port 8083 > ../logs/ai-service.log 2>&1 &
        echo $! > ../logs/ai-service.pid
        
        cd "$PROJECT_ROOT/frontend"
        nohup npm run dev > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        
        echo -e "${GREEN}✅ Services started in background${NC}"
        echo "View logs in: $PROJECT_ROOT/logs/"
    fi
    
    # Wait for services to start
    echo ""
    echo "Waiting for services to start (30 seconds)..."
    sleep 30
    
    # Check service status
    section "Step 8: Verifying Services"
    
    echo -n "Backend (8080)... "
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Not responding yet${NC}"
    fi
    
    echo -n "Tracking (8081)... "
    if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Not responding yet${NC}"
    fi
    
    echo -n "AI Service (8083)... "
    if curl -s http://localhost:8083/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Not responding yet${NC}"
    fi
    
    echo -n "Frontend (5173)... "
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Not responding yet${NC}"
    fi
fi

# Final Summary
section "🎉 Setup Complete!"

echo ""
echo -e "${GREEN}All components are set up!${NC}"
echo ""
echo -e "${CYAN}Access your application:${NC}"
echo "  • Frontend:          http://localhost:5173"
echo "  • Backend API Docs:  http://localhost:8080/api-docs"
echo "  • Tracking Swagger:  http://localhost:8081/swagger-ui.html"
echo "  • AI Service Docs:   http://localhost:8083/docs"
echo ""
echo -e "${CYAN}Database Management:${NC}"
echo "  • PostgreSQL:        localhost:5432 (tracking_db)"
echo "  • Redis:             localhost:6379"
echo "  • Backend Supabase:  https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb"
echo "  • AI Supabase:       https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo "  • Run tests:         ./run-tests.sh"
echo "  • Check env:         ./check-env.sh"
echo "  • View Docker:       docker ps"
echo "  • Stop Docker:       cd tracking-service && docker-compose down"
echo ""
echo -e "${YELLOW}Note:${NC} Services may take 1-2 minutes to fully start up."
echo "      Run './run-tests.sh' to verify everything is working."
echo ""
