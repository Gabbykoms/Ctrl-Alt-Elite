#!/bin/bash

# Generate secrets.yaml from .env file
# Usage: ./generate-secrets.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in your values first."
  exit 1
fi

# Source the .env file
set -a
source "$ENV_FILE"
set +a

kubectl create secret generic bantam-secrets \
  --namespace=elite-dev \
  --from-literal=supabase-url="$SUPABASE_URL" \
  --from-literal=supabase-anon-key="$SUPABASE_ANON_KEY" \
  --from-literal=supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --dry-run=client -o yaml > "$SCRIPT_DIR/secrets.yaml"

echo "secrets.yaml generated successfully."
