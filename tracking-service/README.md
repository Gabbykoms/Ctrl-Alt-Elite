# Tracking Service

Real-time GPS ingestion and location distribution service for the Bantam Shuttle tracking system.

This microservice:
- Receives GPS updates from **driver phones** 
- Stores **latest location** of each shuttle with optional Redis persistence
- Tracks rides with **ride-scoped location queries**
- Exposes endpoints for **students**, **drivers**, and **admins** to access live bus positions
- Integrates with the **backend microservice** via Socket.IO for real-time events

---

## Features

✅ **Driver GPS ingestion** via REST (`POST /v1/locations:single`)  
✅ **Real-time updates** via Server-Sent Events (`GET /sse/geo`)  
✅ **Persistent storage** with Redis (with in-memory fallback)  
✅ **Ride-scoped tracking** — isolate driver/student locations per ride  
✅ **CORS enabled** for frontend + backend integration  
✅ **Socket.IO bridge** to backend microservice  
✅ **REST endpoints** for querying latest bus locations  
✅ **Swagger UI** for API documentation & testing  
✅ **Spring Boot 3.3** + WebFlux (reactive, high-throughput)

---

## Project Structure

```
src/main/java/com/javashams/tracking/
  api/
    GeoSseController.java         -- SSE stream endpoint
    IngestController.java         -- GPS ingestion endpoint
    LocationQueryController.java  -- query latest locations
    RideTrackingController.java   -- ride-scoped tracking endpoints
  config/
    WebConfig.java                -- CORS configuration
    RedisConfig.java              -- Redis setup
  messaging/
    SocketIOBridge.java           -- Socket.IO listener/broadcaster
  model/
    GeoPoint.java                 -- GPS event record
    dto/
      DriverLocationDto.java      -- driver location response
      StudentLocationDto.java     -- student location response
      RideTrackingDto.java        -- ride context
  services/
    LocationSink.java             -- interface for location storage
    InMemoryLocationSink.java     -- in-memory implementation
    RedisLocationSink.java        -- Redis-backed implementation
    RideTrackingService.java      -- manage ride-scoped tracking
```

---

## Architecture & Data Flow

### Typical Ride Lifecycle

```
1. BACKEND (Node.js)
   └─ Student requests ride
   └─ Creates Ride in DB
   └─ POST /v1/rides/{rideId}/start (to Tracking Service)
   └─ Emits 'ride-status-update' via Socket.IO

2. DRIVER (Phone)
   └─ Clocks in
   └─ Continuously sends GPS via POST /v1/locations:single
   └─ Tracking Service receives and stores in Redis

3. TRACKING SERVICE (Spring Boot)
   └─ Stores driver's lat/lng
   └─ Updates ride's driver-location
   └─ Broadcasts via SSE and Socket.IO

4. FRONTEND (React)
   └─ Polls or streams from Tracking Service
   └─ GET /v1/rides/{rideId}/driver-location
   └─ Updates map with live driver position

5. RIDE COMPLETE
   └─ Backend calls POST /v1/rides/{rideId}/end
   └─ Tracking Service cleans up
```

---

## API Endpoints

### Location Ingestion & Streaming

**POST /v1/locations:single** — Driver sends GPS update  
Accepts `GeoPoint` with lat/lng in **microdegrees** (1e6 factor)

```bash
curl -X POST http://localhost:8080/v1/locations:single \
  -H "Content-Type: application/json" \
  -d '{
    "org": "trinity",
    "deviceId": "bus-1",
    "tripId": "trip-123",
    "tsEventMs": 1731945000000,
    "tsServerMs": 0,
    "latMicro": 41746200,    # 41.7462°
    "lonMicro": -72691900,   # -72.6919°
    "accM": 5.0,
    "spdMps": 10.0,
    "brgDeg": 135.0,
    "seq": 1,
    "idempotency": "bus-1-1731945000000-1"
  }'
```

**GET /sse/geo?org=trinity** — Real-time SSE stream  
Returns live GPS updates as they arrive

```bash
curl -N "http://localhost:8080/sse/geo?org=trinity"
```

### Location Queries

**GET /v1/locations/latest?org=trinity&deviceId=bus-1** — Get single shuttle's latest location  
**GET /v1/locations/latest/org/trinity** — Get all shuttles' latest locations

```bash
curl "http://localhost:8080/v1/locations/latest?org=trinity&deviceId=bus-1"
```

### Ride-Scoped Tracking ⭐ (NEW)

**POST /v1/rides/{rideId}/start** — Initialize tracking for a ride  
Called by backend when ride is confirmed

```bash
curl -X POST http://localhost:8080/v1/rides/ride-abc123/start \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "ride-abc123",
    "student_id": "student-1",
    "driver_id": "driver-1",
    "shuttle_id": "bus-1",
    "status": "confirmed",
    "pickup_latitude": 41.7462,
    "pickup_longitude": -72.6919,
    "dropoff_latitude": 41.7470,
    "dropoff_longitude": -72.6910,
    "created_at_ms": 1731945000000,
    "completed_at_ms": null
  }'
```

**GET /v1/rides/{rideId}/driver-location** — Get driver's current position for a ride  
Called by frontend (student view) to track driver

```bash
curl "http://localhost:8080/v1/rides/ride-abc123/driver-location"
```

Response:
```json
{
  "driver_id": "bus-1",
  "shuttle_id": "bus-1",
  "latitude": 41.7462,
  "longitude": -72.6919,
  "heading": 135.0,
  "speed_mps": 10.0,
  "accuracy_meters": 5.0,
  "timestamp_ms": 1731945000000
}
```

**GET /v1/rides/{rideId}/student-location** — Get student's pickup location for a ride  
Called by frontend (driver view) to navigate to student

```bash
curl "http://localhost:8080/v1/rides/ride-abc123/student-location"
```

**GET /v1/rides/{rideId}/context** — Get full ride tracking context (admin/debug)  
**POST /v1/rides/{rideId}/end** — End tracking for a ride (cleanup)

---

## Running the Service

### Local Development (Without Docker)

```bash
# Prerequisites: Java 21+, Redis running on localhost:6379

./gradlew bootRun
```

Service starts on `http://localhost:8080`

### With Docker Compose

```bash
# Start tracking service + Redis
docker-compose up

# Service: http://localhost:8080
# Redis: localhost:6379
```

### Environment Variables

```bash
PORT=8080                              # Server port
REDIS_HOST=localhost                   # Redis host
REDIS_PORT=6379                        # Redis port
REDIS_PASSWORD=                        # Redis password (optional)
SOCKET_IO_BACKEND_URL=http://localhost:3000  # Backend microservice URL
```

---

## Storage Options

### 1. In-Memory (Default)

No configuration needed. Locations stored in RAM, cleared on restart.

**Best for:** Local dev, testing

### 2. Redis (Recommended for Production)

Configure Redis connection in `application.yaml`:

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
```

**Features:**
- Persistent across restarts
- Fast O(1) lookups
- Automatic TTL (1 hour default)
- Scales horizontally

**Best for:** Production, multi-instance deployments

---

## Integration with Backend & Frontend

### Backend (Node.js) Integration

The backend can:

1. **Initialize ride tracking**
   ```typescript
   POST http://localhost:8080/v1/rides/{rideId}/start
   ```

2. **Query driver location**
   ```typescript
   GET http://localhost:8080/v1/rides/{rideId}/driver-location
   ```

3. **Listen for updates** via Socket.IO events from Tracking Service

### Frontend (React) Integration

The frontend can:

1. **Poll for driver location**
   ```typescript
   GET http://localhost:8080/v1/rides/{rideId}/driver-location
   ```

2. **Subscribe to SSE stream** (for live updates)
   ```typescript
   GET /sse/geo?org=trinity
   ```

3. **Query all active shuttles**
   ```typescript
   GET http://localhost:8080/v1/locations/latest/org/trinity
   ```

---

## Socket.IO Events

The service listens for events from the backend and processes them:

### Incoming (from Backend)

- `shuttle-location-update` — Driver location with optional rideId
- `driver-status-update` — Driver clocked in/out
- `ride-status-update` — Ride lifecycle events (requested, confirmed, completed, cancelled)

### Outgoing (to Backend)

Currently configured to listen only. Emit support available via `SocketIOBridge.emit()`.

---

## Testing & Debugging

### Swagger UI

Interactive API testing available at:

```
http://localhost:8080/swagger-ui.html
```

### Health Check

```bash
curl http://localhost:8080/health
```

### Test Ingesting GPS

```bash
# Store a location
curl -X POST http://localhost:8080/v1/locations:single \
  -H "Content-Type: application/json" \
  -d '{"org":"trinity","deviceId":"bus-1","tripId":"t1","tsEventMs":1731945000000,"tsServerMs":0,"latMicro":41746200,"lonMicro":-72691900,"accM":5,"spdMps":10,"brgDeg":135,"seq":1,"idempotency":"id1"}'

# Query it
curl "http://localhost:8080/v1/locations/latest?org=trinity&deviceId=bus-1"

# Stream updates (in another terminal)
curl -N "http://localhost:8080/sse/geo?org=trinity"
```

### Test Ride Tracking

```bash
# Start a ride
curl -X POST http://localhost:8080/v1/rides/ride-123/start \
  -H "Content-Type: application/json" \
  -d '{"ride_id":"ride-123","student_id":"s1","driver_id":"d1","shuttle_id":"bus-1","status":"confirmed","pickup_latitude":41.7462,"pickup_longitude":-72.6919,"dropoff_latitude":41.7470,"dropoff_longitude":-72.6910,"created_at_ms":1731945000000,"completed_at_ms":null}'

# Query driver location for ride
curl "http://localhost:8080/v1/rides/ride-123/driver-location"

# End ride
curl -X POST http://localhost:8080/v1/rides/ride-123/end
```

---

## Architecture Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Spring Boot WebFlux | Reactive, high-throughput, scales easily |
| **Storage** | Redis (with in-memory fallback) | Fast O(1) ops, TTL support, pub/sub capable |
| **Streaming** | Server-Sent Events (SSE) | Simple, one-way push, browser-native |
| **Integration** | Socket.IO bridge | Compatible with Node.js backend |
| **Serialization** | JSON | Standard, frontend-friendly |

---

## Future Extensions

- **Historical tracking** — Store location trails per ride
- **ETA computation** — Calculate arrival times
- **Geofencing** — Alert when driver near pickup/dropoff
- **Analytics** — Track utilization, efficiency metrics
- **Kafka integration** — Scale event distribution
- **WebSocket support** — Bi-directional real-time (vs SSE one-way)

---

## GeoPoint Data Model

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `org` | String | `trinity` | Organization namespace |
| `deviceId` | String | `bus-1` | Shuttle/device identifier |
| `tripId` | String | `trip-123` | Logical trip context |
| `tsEventMs` | Long | `1731945000000` | GPS timestamp (device time) |
| `tsServerMs` | Long | `1731945005000` | Server receipt time |
| `latMicro` | Int | `41746200` | Latitude × 1e6 |
| `lonMicro` | Int | `-72691900` | Longitude × 1e6 |
| `accM` | Double | `5.0` | Accuracy in meters |
| `spdMps` | Double | `10.0` | Speed m/s |
| `brgDeg` | Double | `135.0` | Bearing in degrees |
| `seq` | Long | `1` | Sequence for ordering |
| `idempotency` | String | `bus-1-1731945000000-1` | Unique event ID (deduplication) |

Convert microdegrees to decimal: `latMicro / 1_000_000.0 = latitude`

