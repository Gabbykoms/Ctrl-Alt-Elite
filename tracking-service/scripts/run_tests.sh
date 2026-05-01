#!/usr/bin/env bash
# Master test runner — run with: bash scripts/run_tests.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a && source "$ENV_FILE" && set +a

echo "================================================"
echo "  Running stops tests"
echo "================================================"
bash "$SCRIPT_DIR/test_stops.sh"

echo ""
echo "================================================"
echo "  Running shift report tests"
echo "================================================"
bash "$SCRIPT_DIR/test_shifts.sh"
