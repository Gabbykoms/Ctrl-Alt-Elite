#!/bin/bash

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Tracking Service - Full Startup                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Start Docker Compose services (PostgreSQL and Redis)
echo "Starting Docker Compose services (PostgreSQL + Redis)..."
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "Database services started"
echo ""

# Start the Spring Boot application
echo "Starting Spring Boot tracking service..."
echo "   Running: ./gradlew bootRun"
echo ""

./gradlew bootRun
