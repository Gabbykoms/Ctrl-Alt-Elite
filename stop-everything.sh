#!/bin/bash

# Stop All Services Script for Bantam Shuttle
# This script stops all running services and Docker containers

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Bantam Shuttle - Stop All Services                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT=$(pwd)

echo -e "${BLUE}Stopping all services...${NC}"
echo ""

# Stop Docker containers
echo -e "${YELLOW}1. Stopping Docker containers...${NC}"
cd "$PROJECT_ROOT/tracking-service"
if docker ps | grep -q "tracking-postgres\|tracking-redis"; then
    docker-compose down
    echo -e "${GREEN}✅ Docker containers stopped${NC}"
else
    echo -e "${YELLOW}⚠️  No containers running${NC}"
fi

cd "$PROJECT_ROOT"

# Kill Node.js processes (backend & frontend)
echo ""
echo -e "${YELLOW}2. Stopping Node.js services...${NC}"

# Find and kill processes on specific ports
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -n "  Stopping backend (port 8080)... "
    kill $(lsof -ti:8080) 2>/dev/null
    echo -e "${GREEN}✅${NC}"
else
    echo -e "  Backend (port 8080)... ${YELLOW}not running${NC}"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -n "  Stopping frontend (port 5173)... "
    kill $(lsof -ti:5173) 2>/dev/null
    echo -e "${GREEN}✅${NC}"
else
    echo -e "  Frontend (port 5173)... ${YELLOW}not running${NC}"
fi

# Kill Java processes (tracking service)
echo ""
echo -e "${YELLOW}3. Stopping Java services...${NC}"
if lsof -ti:8081 > /dev/null 2>&1; then
    echo -n "  Stopping tracking service (port 8081)... "
    kill $(lsof -ti:8081) 2>/dev/null
    echo -e "${GREEN}✅${NC}"
else
    echo -e "  Tracking service (port 8081)... ${YELLOW}not running${NC}"
fi

# Kill Python processes (AI service)
echo ""
echo -e "${YELLOW}4. Stopping Python services...${NC}"
if lsof -ti:8083 > /dev/null 2>&1; then
    echo -n "  Stopping AI service (port 8083)... "
    kill $(lsof -ti:8083) 2>/dev/null
    echo -e "${GREEN}✅${NC}"
else
    echo -e "  AI service (port 8083)... ${YELLOW}not running${NC}"
fi

# Kill any remaining processes from PID files if they exist
if [ -d "logs" ]; then
    echo ""
    echo -e "${YELLOW}5. Cleaning up PID files...${NC}"
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid 2>/dev/null
                echo -e "  Killed process $pid from $pidfile"
            fi
            rm "$pidfile"
        fi
    done
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All services stopped${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To start services again, run: ./start-everything.sh"
echo ""
