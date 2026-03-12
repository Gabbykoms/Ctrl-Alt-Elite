# Chat Queue Implementation - Testing Guide

## What Changed

The AI service now uses RabbitMQ to queue chat requests instead of processing them synchronously.

### Architecture Flow:
```
Frontend → POST /chat/ → Database (create record) → RabbitMQ (publish)
                ↓ (returns immediately)
            request_id

Background Worker ← RabbitMQ (consume) → Process with RAG → Update database

Frontend → Poll GET /chat/response/{request_id} → Get result
```

## Setup & Testing

### 1. Run Database Migration

```bash
cd AI_Intergration_Service
python scripts/run_migrations.py
```

This creates the `chat_requests` table.

### 2. Start Services

```bash
cd docker
docker-compose up -d
```

Watch logs:
```bash
docker-compose logs -f ai-service
```

Look for:
- `✅ Successfully connected to RabbitMQ`
- `📡 Started consuming from queue: chat.requests`

### 3. Test with Script

```bash
cd ..
python scripts/test_chat_queue.py
```

This publishes 5 test chat messages to the queue.

### 4. Check Processing

**Watch AI service logs:**
```bash
docker-compose logs -f ai-service
```

You should see:
```
📤 Published chat request: abc-123...
🔄 Processing chat request: abc-123...
✅ Completed chat request: abc-123...
```

**Check database:**
```sql
-- Connect to your Supabase database
SELECT request_id, message, status, created_at, completed_at 
FROM chat_requests 
ORDER BY created_at DESC;
```

**Check RabbitMQ UI:**
- Open http://localhost:15672 (guest/guest)
- Go to Queues tab
- See `chat.requests` queue activity

### 5. Test API Endpoints

**Submit request:**
```bash
curl -X POST http://localhost:8083/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are shuttle operating hours?",
    "session_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

Response:
```json
{
  "request_id": "abc-123-def-456",
  "status": "queued",
  "message": "Your request is being processed"
}
```

**Poll for response:**
```bash
curl http://localhost:8083/chat/response/abc-123-def-456
```

Status while processing:
```json
{
  "request_id": "abc-123-def-456",
  "status": "processing",
  "response": null,
  "created_at": "2025-12-16T10:30:00Z",
  "completed_at": null
}
```

When completed:
```json
{
  "request_id": "abc-123-def-456",
  "status": "completed",
  "response": "The shuttle operates from 7 AM to 11 PM on weekdays...",
  "sources": [...],
  "created_at": "2025-12-16T10:30:00Z",
  "completed_at": "2025-12-16T10:30:05Z"
}
```

## Frontend Changes Needed

The frontend needs to be updated to handle the new async pattern. See the implementation plan in the chat.py comments.

Key changes in `AiChat.tsx`:
1. Submit request → Get request_id
2. Start polling GET /chat/response/{request_id}
3. Update UI when status becomes "completed"
4. Handle timeout (30 seconds)

## Database Schema

**Table: chat_requests**
```sql
id              UUID PRIMARY KEY
request_id      VARCHAR(100) UNIQUE  -- For polling
session_id      UUID                 -- Chat session
user_id         UUID                 -- Optional
message         TEXT                 -- User query
status          VARCHAR(20)          -- queued|processing|completed|failed
response        TEXT                 -- AI response (when completed)
sources         JSONB                -- Source documents
error_message   TEXT                 -- Error (if failed)
created_at      TIMESTAMP
started_at      TIMESTAMP
completed_at    TIMESTAMP
```

## Configuration

**Environment Variables:**
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_CHAT_REQUESTS_QUEUE=chat.requests
```

## Monitoring

**Check queue depth:**
```bash
docker exec trinity-rabbitmq rabbitmqctl list_queues
```

**Check processing status:**
```sql
SELECT status, COUNT(*) 
FROM chat_requests 
GROUP BY status;
```

**Failed requests:**
```sql
SELECT request_id, message, error_message, created_at
FROM chat_requests
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Troubleshooting

**Consumer not processing:**
- Check RabbitMQ connection in logs
- Verify queue exists in RabbitMQ UI
- Check database connection

**Requests stuck in "queued":**
- Consumer may have crashed
- Check AI service logs for errors
- Restart service: `docker-compose restart ai-service`

**Database errors:**
- Run migration: `python scripts/run_migrations.py`
- Check database URL in .env
- Verify table exists: `\dt chat_requests`
