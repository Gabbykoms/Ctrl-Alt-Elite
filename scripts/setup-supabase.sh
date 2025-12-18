#!/bin/bash

# Supabase Database Setup Helper
# This script helps you set up Supabase databases for Backend and AI Service

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Supabase Database Setup Helper                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}This script will guide you through setting up your Supabase databases.${NC}"
echo ""

# Backend Supabase
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Backend Database Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Project URL: https://iarrtqyfimoukixvcizb.supabase.co"
echo ""
echo -e "${YELLOW}Steps:${NC}"
echo "  1. Open: https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb"
echo "  2. Go to: SQL Editor (left sidebar)"
echo "  3. Click: New Query"
echo "  4. Copy and run the SQL from: backend/database-migration.sql"
echo ""
echo -e "${CYAN}What this creates:${NC}"
echo "  • profiles table (user accounts)"
echo "  • students table"
echo "  • drivers table"
echo "  • stops, routes, route_stops (shuttle routes)"
echo "  • shuttles table (vehicles)"
echo "  • rides table (ride requests)"
echo "  • shifts table (driver work hours)"
echo ""
read -p "Press Enter after you've completed the backend setup..."
echo ""

# AI Service Supabase
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. AI Service Database Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Project URL: https://bwijyokpoqewpwbwwfso.supabase.co"
echo ""
echo -e "${YELLOW}Step 1: Enable pgvector extension${NC}"
echo "  1. Open: https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso"
echo "  2. Go to: SQL Editor"
echo "  3. Run this command:"
echo ""
echo -e "${CYAN}    CREATE EXTENSION IF NOT EXISTS vector;${NC}"
echo ""
read -p "Press Enter after enabling pgvector..."
echo ""

echo -e "${YELLOW}Step 2: Ingest knowledge base${NC}"
echo "  This will create tables and load AI training data"
echo ""
echo "  Run these commands:"
echo ""
echo -e "${CYAN}    cd AI_Intergration_Service${NC}"
echo -e "${CYAN}    python scripts/test_connection.py    # Verify connection${NC}"
echo -e "${CYAN}    python scripts/ingest_knowledge_base.py  # Load data${NC}"
echo ""
echo -e "${CYAN}What this creates:${NC}"
echo "  • documents table with vector embeddings"
echo "  • chat_history table for conversations"
echo "  • Knowledge base from JSON files (FAQs, routes, buildings, policies)"
echo ""
read -p "Press Enter after you've completed the AI service setup..."
echo ""

# Verification
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Supabase Setup Guide Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Verification checklist:${NC}"
echo "  □ Backend: profiles, students, drivers, stops, routes, shuttles, rides, shifts tables exist"
echo "  □ AI Service: documents and chat_history tables exist"
echo "  □ AI Service: pgvector extension is enabled"
echo "  □ AI Service: Knowledge base data is loaded"
echo ""
echo -e "${CYAN}Next step: Run ./start-services.sh to start all microservices${NC}"
echo ""
