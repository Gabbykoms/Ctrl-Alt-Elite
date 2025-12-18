#!/bin/bash

# Database Setup Script for Bantam Shuttle
# This script sets up all required databases for the project

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Bantam Shuttle - Database Setup Script              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed ($(docker --version))${NC}"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker Desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon is running${NC}"
echo ""

# Step 2: Setup Tracking Service Database (PostgreSQL + Redis)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Setting up Tracking Service Database${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd tracking-service

# Check if containers are already running
if docker ps | grep -q "tracking-postgres\|tracking-redis"; then
    echo -e "${YELLOW}⚠️  Tracking service containers already running${NC}"
    read -p "Do you want to restart them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing containers..."
        docker-compose down
    else
        echo "Skipping tracking service setup"
        cd ..
        echo ""
        exit 0
    fi
fi

echo "Starting PostgreSQL and Redis containers..."
docker-compose up -d

echo "Waiting for databases to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "tracking-postgres"; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

if docker ps | grep -q "tracking-redis"; then
    echo -e "${GREEN}✅ Redis container is running${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

# Verify PostgreSQL connection
echo "Verifying PostgreSQL connection..."
if docker exec tracking-postgres pg_isready -U tracking_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is accepting connections${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# Verify Redis connection
echo "Verifying Redis connection..."
if docker exec tracking-redis redis-cli -a redis_password ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is accepting connections${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

# Show table count
echo "Checking database tables..."
TABLE_COUNT=$(docker exec tracking-postgres psql -U tracking_user -d tracking_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✅ Found $TABLE_COUNT tables in tracking database${NC}"

cd ..
echo ""

# Step 3: Instructions for Supabase setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Supabase Database Setup (Manual)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}⚠️  Supabase databases need manual setup${NC}"
echo ""
echo "Backend Database (https://iarrtqyfimoukixvcizb.supabase.co):"
echo "  1. Open Supabase SQL Editor"
echo "  2. Copy contents of: backend/database-migration.sql"
echo "  3. Paste and run in SQL Editor"
echo ""
echo "AI Service Database (https://bwijyokpoqewpwbwwfso.supabase.co):"
echo "  1. Open Supabase SQL Editor"
echo "  2. Run: CREATE EXTENSION IF NOT EXISTS vector;"
echo "  3. Copy contents of: AI_Intergration_Service/scripts/ingest_knowledge_base.py"
echo "  4. Run: cd AI_Intergration_Service && python scripts/ingest_knowledge_base.py"
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Local Databases Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Complete Supabase setup (see instructions above)"
echo "  2. Run: ./start-services.sh to start all microservices"
echo ""
