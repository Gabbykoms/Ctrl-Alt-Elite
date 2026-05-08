#!/bin/bash

# Generate ai-secrets.yaml from AI_Intergration_Service/.env
# Usage: ./generate-ai-secrets.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../AI_Intergration_Service/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

kubectl create secret generic bantam-ai-secrets \
  --namespace=elite-dev \
  --from-literal=AI_DATABASE_URL="$AI_DATABASE_URL" \
  --from-literal=AI_OPENAI_API_KEY="$AI_OPENAI_API_KEY" \
  --from-literal=AI_SUPABASE_URL="$AI_SUPABASE_URL" \
  --from-literal=AI_SUPABASE_KEY="$AI_SUPABASE_KEY" \
  --from-literal=OPENWEATHER_API_KEY="$OPENWEATHER_API_KEY" \
  --from-literal=RABBITMQ_PASSWORD="$RABBITMQ_PASSWORD" \
  --dry-run=client -o yaml > "$SCRIPT_DIR/ai-secrets.yaml"

echo "ai-secrets.yaml generated successfully."
