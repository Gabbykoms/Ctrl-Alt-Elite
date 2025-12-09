#!/bin/bash
set -e

echo "=== Trinity Shuttle AI Service - Docker Startup ==="

# Validate required environment variables
if [ -z "$AI_DATABASE_URL" ]; then
    echo "ERROR: AI_DATABASE_URL not set"
    echo "   Set SUPABASE AI_DATABASE_URL in your .env file"
    exit 1
fi

if [ -z "$AI_OPENAI_API_KEY" ]; then
    echo "ERROR: AI_OPENAI_API_KEY not set"
    exit 1
fi

echo "✓ AI_DATABASE_URL is set (Supabase)"
echo "✓ AI_OPENAI_API_KEY is set"
echo "✓ Using OpenAI LLM"

# Optional ingestion on startup
if [ "$INGEST_KB" = "true" ]; then
    echo ""
    echo "🚀 Running knowledge base ingestion..."
    cd /app
    python scripts/ingest_knowledge_base.py
    echo "✓ Ingestion complete"
    echo ""
fi

# Start the service
echo "Starting Trinity Shuttle AI Service on port 8083..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8083
