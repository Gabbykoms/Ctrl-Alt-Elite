# RabbitMQ Local Testing Guide

This guide walks you through testing the RabbitMQ integration locally before deploying to Kubernetes.

## Prerequisites

- Docker and Docker Compose installed
- Python 3.12+ (for running the AI service locally)
- `pika` library for the test publisher script

## Step 1: Setup Environment

1. **Create a local `.env` file** in the `AI_Intergration_Service` directory:

```bash
cd AI_Intergration_Service
cp .env.example .env
```

2. **Edit `.env`** and add your actual credentials:
   - `AI_DATABASE_URL` - Your Supabase database URL
   - `AI_OPENAI_API_KEY` - Your OpenAI API key
   - `AI_SUPABASE_URL` and `AI_SUPABASE_KEY` - Your Supabase credentials

The RabbitMQ settings are already configured for local testing:
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

## Step 2: Start Services with Docker Compose

Start RabbitMQ and the AI service:

```bash
cd AI_Intergration_Service/docker
docker-compose up -d
```

This will start:
- **RabbitMQ** on ports `5672` (AMQP) and `15672` (Management UI)
- **AI Service** on port `8083`

Check the logs:

```bash
docker-compose logs -f ai-service
```

Look for these success messages:
- `✅ Successfully connected to RabbitMQ`
- `✅ RabbitMQ service initialized and consumers started`
- `📡 Started consuming from queue: shuttle.updates`
- `🔔 Started consuming from queue: shuttle.alerts`

## Step 3: Verify RabbitMQ is Running

### Option A: Management UI (Recommended)

Open your browser and go to: **http://localhost:15672**

- **Username:** `guest`
- **Password:** `guest`

You should see:
- Overview page with server status
- Empty queues (no messages yet)

### Option B: Command Line

Check RabbitMQ container status:

```bash
docker ps | grep rabbitmq
docker logs trinity-rabbitmq
```

## Step 4: Run the Test Publisher

Install the `pika` library (if not already installed):

```bash
pip install pika
```

Run the test publisher script:

```bash
cd AI_Intergration_Service
python scripts/test_rabbitmq.py
```

You should see output like:

```
🚀 RabbitMQ Test Publisher
==================================================
✅ Connected to RabbitMQ
📦 Queues declared: shuttle.updates, shuttle.alerts

📡 Publishing test messages...
--------------------------------------------------

🚍 Publishing shuttle updates...
✅ Published shuttle update: shuttle-001 at {'lat': 41.3083, 'lng': -72.9279}
✅ Published shuttle update: shuttle-002 at {'lat': 41.3100, 'lng': -72.9300}
✅ Published shuttle update: shuttle-003 at {'lat': 41.3050, 'lng': -72.9250}

🔔 Publishing shuttle alerts...
🔔 Published alert: delay - Shuttle delayed by 10 minutes due to traffic
🔔 Published alert: detour - Route detour due to road construction
🔔 Published alert: cancelled - Shuttle service temporarily suspended

==================================================
✅ Test messages published successfully!

Queue Stats:
  - shuttle.updates: 3 messages
  - shuttle.alerts: 3 messages
```

## Step 5: Verify Messages are Consumed

### Check AI Service Logs

```bash
cd AI_Intergration_Service/docker
docker-compose logs -f ai-service
```

You should see messages like:

```
✅ Updated cache for shuttle shuttle-001: active at {'lat': 41.3083, 'lng': -72.9279}
✅ Updated cache for shuttle shuttle-002: active at {'lat': 41.3100, 'lng': -72.9300}
✅ Updated cache for shuttle shuttle-003: idle at {'lat': 41.3050, 'lng': -72.9250}
🔔 New alert: delay - Shuttle delayed by 10 minutes due to traffic
🔔 New alert: detour - Route detour due to road construction
🔔 New alert: cancelled - Shuttle service temporarily suspended
```

### Check RabbitMQ Management UI

Go to **http://localhost:15672** → **Queues** tab

- `shuttle.updates` should show **0 messages** (all consumed)
- `shuttle.alerts` should show **0 messages** (all consumed)
- Check the "Message rates" graphs to see activity

## Step 6: Test the AI Service API

Check if RabbitMQ connection status is exposed:

```bash
curl http://localhost:8083/ | jq
```

Expected output:

```json
{
  "service": "Trinity Shuttle AI Service",
  "version": "1.0.0",
  "status": "running",
  "rabbitmq_connected": true,
  "docs": "/docs",
  "health": "/health"
}
```

## Step 7: Verify Cached Data (Optional)

To verify the AI service is caching shuttle data, you can add a test endpoint or check logs. The `RabbitMQService` maintains:

- `shuttle_updates_cache` - Dictionary of shuttle updates by ID
- `shuttle_alerts_cache` - List of recent alerts (last 50)

You can modify the AI service to expose this data for testing.

## Troubleshooting

### RabbitMQ Won't Start

**Error:** `rabbitmq container exited with code 1`

**Solution:**
```bash
# Remove old volumes
docker-compose down -v
docker volume rm trinity-rabbitmq-data trinity-rabbitmq-logs
docker-compose up -d
```

### AI Service Can't Connect to RabbitMQ

**Error:** `Failed to connect to RabbitMQ: [Errno 61] Connection refused`

**Check:**
1. RabbitMQ is running: `docker ps | grep rabbitmq`
2. Port 5672 is accessible: `netstat -an | grep 5672`
3. Check RabbitMQ logs: `docker logs trinity-rabbitmq`

**Solution:**
```bash
# Wait for RabbitMQ to fully start (takes ~30 seconds)
docker-compose restart ai-service
```

### Test Publisher Script Fails

**Error:** `ModuleNotFoundError: No module named 'pika'`

**Solution:**
```bash
pip install pika
```

**Error:** `Connection refused to localhost:5672`

**Solution:** Make sure RabbitMQ container is running:
```bash
docker ps | grep rabbitmq
```

### Messages Not Being Consumed

**Check:**
1. AI service logs for errors
2. RabbitMQ Management UI → Queues → Check for "Ready" messages
3. Verify queue names match in both publisher and consumer

## Running Locally Without Docker

If you want to run the AI service directly (not in Docker):

1. **Start RabbitMQ only:**

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.12-management-alpine
```

2. **Install Python dependencies:**

```bash
cd AI_Intergration_Service
pip install -r requirements.txt
```

3. **Set environment variables** (or use `.env` file):

```bash
export AI_DATABASE_URL="your-database-url"
export AI_OPENAI_API_KEY="your-openai-key"
export RABBITMQ_HOST="localhost"
# ... other variables
```

4. **Run the AI service:**

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload
```

5. **Run test publisher:**

```bash
python scripts/test_rabbitmq.py
```

## Next Steps

Once local testing is successful:

1. ✅ **RabbitMQ works locally** - Messages are published and consumed
2. 🚀 **Deploy RabbitMQ to Kubernetes** - Create K8s deployment
3. 🔄 **Update backend/tracking services** - Add RabbitMQ publishers
4. 🧠 **Enhance RAG service** - Inject cached shuttle data into chat context
5. 📊 **Add monitoring** - Prometheus metrics for RabbitMQ

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Check RabbitMQ status
docker exec trinity-rabbitmq rabbitmqctl status

# List RabbitMQ queues
docker exec trinity-rabbitmq rabbitmqctl list_queues

# Publish test message multiple times
for i in {1..10}; do python scripts/test_rabbitmq.py; sleep 2; done
```

## RabbitMQ Management UI Features

Access: **http://localhost:15672** (guest/guest)

- **Overview** - Server status, node info, message rates
- **Connections** - Active client connections (AI service consumer)
- **Channels** - AMQP channels per connection
- **Queues** - Queue list, message counts, publish/consume rates
- **Admin** - User management, virtual hosts, policies

## Resources

- [RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq)
- [aio-pika Documentation](https://aio-pika.readthedocs.io/)
- [RabbitMQ Management UI Guide](https://www.rabbitmq.com/management.html)
