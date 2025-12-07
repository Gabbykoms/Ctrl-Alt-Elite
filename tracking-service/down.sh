#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Tracking Service - Shutdown                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "Stopping and removing Docker containers..."
docker compose down

echo ""
echo "Services stopped successfully"
echo ""
echo "Note: Data is preserved. Run './up.sh' to restart."
