# Tracking Service

**Real-time GPS ingestion and location distribution service** for the Trinity College Bantam Shuttle system.

This Spring Boot microservice:
- 📍 **Receives GPS updates** from driver phones via REST API
- 💾 **Stores latest location** of each shuttle (Redis + in-memory fallback)
- 🚕 **Tracks rides** with ride-scoped location queries (driver + student positions)
- 🗺️ **Exposes REST endpoints** for students, drivers, and admins to query live bus positions
- 🔌 **Integrates with backend** via Socket.IO for real-time event communication
- 📡 **Streams live updates** via Server-Sent Events (SSE) for real-time map updates
- ⚡ **High-throughput** reactive architecture using Spring WebFlux

---

## Features at a Glance

| Feature | Endpoint | Purpose |
|---------|----------|---------|
| **GPS Ingestion** | `POST /v1/locations:single` | Drivers send real-time GPS updates |
| **Live Streaming** | `GET /sse/geo?org=trinity` | Real-time GPS stream via Server-Sent Events |
| **Query All Buses** | `GET /v1/locations/latest/org/trinity` | Get all active shuttle locations |
| **Query One Bus** | `GET /v1/locations/latest?org=trinity&deviceId=bus-1` | Get specific bus location |
| **Start Ride Tracking** | `POST /v1/rides/{rideId}/start` | Initialize tracking for a ride |
| **Get Driver Location** | `GET /v1/rides/{rideId}/driver-location` | Get driver's current position (for student) |
| **Get Student Location** | `GET /v1/rides/{rideId}/student-location` | Get student's pickup/dropoff (for driver) |
| **Get Ride Context** | `GET /v1/rides/{rideId}/context` | Full ride state (admin/debug) |
| **End Ride Tracking** | `POST /v1/rides/{rideId}/end` | Stop tracking a ride |
| **Get All Stops** | `GET /v1/stops` | Get all active shuttle stops |
| **Get Single Stop** | `GET /v1/stops/{stopId}` | Get specific stop details |
| **Create Stop** | `POST /v1/stops` | Create new stop (admin) |
| **Update Stop** | `PUT /v1/stops/{stopId}` | Update stop info (admin) |
| **Delete Stop** | `DELETE /v1/stops/{stopId}` | Delete/deactivate stop (admin) |

**Tech Stack**: Spring Boot 3.3 + WebFlux (reactive) | Redis (persistent) | SSE (streaming) | Socket.IO (backend integration) | Swagger UI (interactive docs)

---

## Project Structure

```
src/main/java/com/javashams/tracking/
├── TrackingApplication.java              -- Main Spring Boot entry point
├── api/
│   ├── GeoSseController.java            -- SSE endpoint for real-time GPS stream
│   ├── IngestController.java            -- GPS ingestion endpoint (POST /v1/locations:single)
│   ├── LocationQueryController.java     -- Query latest bus locations
│   ├── RideTrackingController.java      -- Ride-scoped endpoints (start/end/driver-location/student-location/context)
│   └── StopsController.java             -- Stop management endpoints (CRUD operations)
├── config/
│   ├── WebConfig.java                   -- CORS configuration
│   └── RedisConfig.java                 -- Redis connection pooling
├── messaging/
│   └── SocketIOBridge.java              -- Socket.IO listener for backend events
├── model/
│   ├── GeoPoint.java                    -- GPS data record (lat/lng in microdegrees)
│   └── dto/
│       ├── StopDto.java                 -- Stop data model (name, location, active status)
│       ├── RideTrackingDto.java         -- Ride tracking data model
│       ├── DriverLocationDto.java       -- Driver location (lat/lng in decimal degrees)
│       └── StudentLocationDto.java      -- Student location (pickup/dropoff)
├── services/
│   ├── LocationSink.java                -- GPS storage interface (Redis or in-memory)
│   ├── RideTrackingService.java         -- Ride tracking logic and state management
│   └── StopStore.java                   -- Stop management service (in-memory + Redis capable)
└── resources/
    └── application.yaml                 -- Configuration (Redis, logging, etc.)
│       ├── DriverLocationDto.java       -- Response: driver location (decimal degrees)
│       ├── StudentLocationDto.java      -- Response: student pickup/dropoff
│       └── RideTrackingDto.java         -- Response: complete ride context
└── services/
    ├── LocationSink.java                -- Interface for location storage
    ├── InMemoryLocationSink.java        -- In-memory implementation (dev/test)
    ├── RedisLocationSink.java           -- Redis-backed implementation (production)
    ├── RideTrackingService.java         -- Manage ride-scoped location tracking
    └── StopStore.java                   -- Manage shuttle stops/routes

src/main/resources/
└── application.yaml                     -- Configuration (Redis, port, etc.)
```

---

## Architecture & Data Flow

### Ride Tracking Lifecycle

```
STEP 1: RIDE CREATION (Backend Node.js)
   └─ Student requests ride (app)
   └─ Backend confirms ride in DB
   └─ Backend calls: POST /v1/rides/{rideId}/start
      └─ Tracking Service stores ride context
      └─ Creates mapping: shuttle_id → rideId (for GPS updates)

STEP 2: DRIVER SENDS GPS (Driver Phone)
   └─ Driver is clocked in, actively moving
   └─ Phone GPS sends: POST /v1/locations:single
      └─ deviceId: "bus-1", latMicro: 41746000, lonMicro: -72685000, etc.
      └─ Tracking Service receives GPS

STEP 3: GPS PROCESSING (Tracking Service)
   └─ Store GPS in LocationSink (Redis or in-memory)
   └─ Find rideId via shuttleToRideMapping (bus-1 → ride-123)
   └─ Update ride's driver location: rideDriverLocations[ride-123] = new position
   └─ Broadcast to SSE subscribers: /sse/geo?org=trinity
   └─ (Optional) Emit Socket.IO event to backend

STEP 4: FRONTEND TRACKS DRIVER (React App)
   Option A - POLLING (Current implementation):
      └─ Frontend polls every 5 seconds
      └─ GET /v1/rides/{rideId}/driver-location
      └─ Updates green B marker on map
   
   Option B - STREAMING (Available):
      └─ Frontend subscribes to SSE stream
      └─ GET /sse/geo?org=trinity
      └─ Real-time updates as GPS arrives
      └─ Updates map instantly (no 5-sec delay)

STEP 5: RIDE COMPLETION
   └─ Backend calls: POST /v1/rides/{rideId}/end
   └─ Tracking Service cleans up:
      └─ Remove from rideContexts
      └─ Remove shuttleToRideMapping
      └─ Clear driver/student locations
   └─ Future queries return 404

STEP 6: NEW RIDE (if needed)
   └─ Mapping is cleared, shuttle is now available
   └─ Can be assigned to new ride via POST /v1/rides/{newRideId}/start
```

### Data Storage Architecture

```
LOCATION STORAGE (LocationSink)
├── In-Memory (Default - dev/test)
│   ├── Map<String, GeoPoint> latestByDevice
│   ├── Map<String, List<GeoPoint>> historyByDevice (optional)
│   └─ ❌ Lost on restart, ✅ Fast, ✅ Simple
│
└── Redis (Production - recommended)
    ├── Key: "geo:{org}:{deviceId}" → GeoPoint (current position)
    ├── Key: "geo:{org}:devices" → Set of device IDs (tracking index)
    ├── TTL: 1 hour (auto-expire inactive buses)
    └─ ✅ Persistent, ✅ Fast, ✅ Survives restarts, ✅ Scales horizontally

RIDE TRACKING STORAGE (RideTrackingService)
├── rideContexts: Map<String, RideTrackingDto>
│   └─ Stores ride metadata (ID, student_id, shuttle_id, pickup, dropoff, etc.)
│
├── rideDriverLocations: Map<String, DriverLocationDto>
│   └─ Stores driver's latest position for each ride
│   └─ Updated when GPS arrives for the shuttle_id
│
├── rideStudentLocations: Map<String, StudentLocationDto>
│   └─ Stores student's pickup/dropoff locations
│   └─ Set once at ride creation, doesn't change
│
└── shuttleToRideMapping: Map<String, String>
    └─ Key: shuttle_id (e.g., "bus-1")
    └─ Value: rideId (e.g., "ride-123")
    └─ Enables GPS → ride lookup when data arrives
    └─ Allows one shuttle per active ride (1:1 relationship)

STOP STORAGE (StopStore)
├── In-Memory Storage (primary - current implementation)
│   ├── Map<String, StopDto> stops
│   ├── Pre-loaded with 8 Trinity College default stops
│   ├── ❌ Lost on restart
│   └─ ✅ Fast, ✅ Simple, ✅ Suitable for campus stops (infrequently changed)
│
└── Future: Redis-backed storage for multi-instance deployments
    ├── Key: "stop:{stopId}" → StopDto (stop details)
    ├── Key: "stops:all" → Set of all active stop IDs
    └─ ✅ Persistent, ✅ Scales across instances
```

---

## Running the project

Make sure you have Java 21 in your system

```bash
    ./gradlew clean build -x test
    ./gradlew bootRun
```

## API Endpoints

### 1️⃣ Location Ingestion

**POST /v1/locations:single** — Driver sends GPS update  
Coordinates must be in **microdegrees** (multiply decimal degrees by 1,000,000)

```bash
curl -X POST http://localhost:8081/v1/locations:single \
  -H "Content-Type: application/json" \
  -d '{
    "org": "trinity",
    "deviceId": "bus-1",
    "tripId": "trip-123",
    "tsEventMs": 1731945000000,
    "tsServerMs": 0,
    "latMicro": 41746200,    # Microdegrees: 41.7462°N
    "lonMicro": -72691900,   # Microdegrees: -72.6919°W
    "accM": 5.0,             # Accuracy in meters
    "spdMps": 10.0,          # Speed in m/s
    "brgDeg": 135.0,         # Bearing/heading in degrees
    "seq": 1,                # Sequence number
    "idempotency": "bus-1-1731945000000-1"
  }'
```

**Key point:** When ride exists for this shuttle, driver location is automatically updated  
(via `POST /v1/rides/{rideId}/start` mapping)

---

### 2️⃣ Location Queries

**GET /v1/locations/latest/org/trinity** — Get all shuttles' latest locations  
Returns array of buses with coordinates in **microdegrees**

```bash
curl "http://localhost:8081/v1/locations/latest/org/trinity" | jq '.'
```

Response:
```json
[
  {
    "org": "trinity",
    "deviceId": "bus-1",
    "latMicro": 41746200,
    "lonMicro": -72691900,
    "spdMps": 10.0,
    "brgDeg": 135.0,
    "accM": 5.0,
    "tsServerMs": 1731945000000
  },
  {
    "org": "trinity",
    "deviceId": "bus-2",
    "latMicro": 41745100,
    "lonMicro": -72690500,
    "spdMps": 8.5,
    "brgDeg": 90.0,
    "accM": 4.2,
    "tsServerMs": 1731945005000
  }
]
```

**GET /v1/locations/latest?org=trinity&deviceId=bus-1** — Get single shuttle's location

```bash
curl "http://localhost:8081/v1/locations/latest?org=trinity&deviceId=bus-1"
```

---

### 3️⃣ Real-Time Streaming (SSE)

**GET /sse/geo?org=trinity** — Subscribe to live GPS stream  
Browser streams all GPS updates as Server-Sent Events (more efficient than polling)

```bash
curl -N "http://localhost:8081/sse/geo?org=trinity"
```

Output (raw stream):
```
data: {"org":"trinity","deviceId":"bus-1","latMicro":41746200,"lonMicro":-72691900,"spdMps":10.2,"brgDeg":135.1}
data: {"org":"trinity","deviceId":"bus-1","latMicro":41746250,"lonMicro":-72691850,"spdMps":10.1,"brgDeg":134.9}
```

**Use in frontend:**
```typescript
const eventSource = new EventSource('http://localhost:8081/sse/geo?org=trinity');
eventSource.addEventListener('message', (event) => {
  const gps = JSON.parse(event.data);
  updateMapPin(gps.deviceId, gps.latMicro / 1_000_000, gps.lonMicro / 1_000_000);
});
```

---

### 4️⃣ Ride-Scoped Tracking ⭐

**POST /v1/rides/{rideId}/start** — Initialize tracking for a ride  
Called by backend (Node.js) when ride is confirmed  
⚠️ **MUST be called BEFORE driver sends GPS** for that ride

```bash
RIDE_ID="ride-abc123"
curl -X POST http://localhost:8081/v1/rides/$RIDE_ID/start \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "'$RIDE_ID'",
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

Response: `200 OK` (ride registered, ready for GPS updates)

---

**GET /v1/rides/{rideId}/driver-location** — Get driver's current position  
Called by frontend (student view) to track incoming driver  
Coordinates in **decimal degrees** (not microdegrees!)  
Returns `404` if no GPS received yet or ride doesn't exist

```bash
RIDE_ID="ride-abc123"
curl "http://localhost:8081/v1/rides/$RIDE_ID/driver-location" | jq '.'
```

Response (when GPS has arrived):
```json
{
  "driver_id": "bus-1",
  "shuttle_id": "bus-1",
  "latitude": 41.7462,        # Decimal degrees
  "longitude": -72.6919,      # Decimal degrees
  "heading": 135.0,
  "speed_mps": 10.0,
  "accuracy_meters": 5.0,
  "timestamp_ms": 1731945000000
}
```

---

**GET /v1/rides/{rideId}/student-location** — Get student's pickup location  
Called by frontend (driver view) to navigate to pickup point  
Coordinates in **decimal degrees**

```bash
RIDE_ID="ride-abc123"
curl "http://localhost:8081/v1/rides/$RIDE_ID/student-location" | jq '.'
```

Response:
```json
{
  "student_id": "student-1",
  "latitude": 41.7462,
  "longitude": -72.6919,
  "timestamp_ms": 1731945000000
}
```

---

**GET /v1/rides/{rideId}/context** — Get full ride tracking context  
Admin/debug endpoint to see all ride state at once

```bash
RIDE_ID="ride-abc123"
curl "http://localhost:8081/v1/rides/$RIDE_ID/context" | jq '.'
```

Response includes: ride metadata, driver location, student location, timestamps

---

**POST /v1/rides/{rideId}/end** — End tracking for a ride  
Called by backend when ride is completed  
Cleans up tracking state, removes ride from active tracking

```bash
RIDE_ID="ride-abc123"
curl -X POST http://localhost:8081/v1/rides/$RIDE_ID/end \
  -H "Content-Type: application/json"
```

Response: `200 OK` (ride cleaned up, shuttle available for new rides)

---

## 5️⃣ Stops Management

**GET /v1/stops** — Get all active shuttle stops  
Public endpoint. Returns all active stops with coordinates

```bash
curl "http://localhost:8081/v1/stops" | jq '.'
```

Response:
```json
{
  "stops": [
    {
      "id": "stop-main-quad-1234567890",
      "name": "Main Quad",
      "latitude": 41.747,
      "longitude": -72.683,
      "description": "Main courtyard of Trinity College",
      "isActive": true,
      "createdAtMs": 1731945000000,
      "updatedAtMs": 1731945000000
    },
    {
      "id": "stop-athletic-center-1234567890",
      "name": "Athletic Center",
      "latitude": 41.745,
      "longitude": -72.680,
      "description": "Sports and athletic facilities",
      "isActive": true,
      "createdAtMs": 1731945000000,
      "updatedAtMs": 1731945000000
    }
  ],
  "total": 8,
  "timestamp": 1731945123456
}
```

**GET /v1/stops/{stopId}** — Get specific stop details  
Public endpoint. Returns single stop by ID

```bash
STOP_ID="stop-main-quad-1234567890"
curl "http://localhost:8081/v1/stops/$STOP_ID" | jq '.'
```

Response:
```json
{
  "id": "stop-main-quad-1234567890",
  "name": "Main Quad",
  "latitude": 41.747,
  "longitude": -72.683,
  "description": "Main courtyard of Trinity College",
  "isActive": true,
  "createdAtMs": 1731945000000,
  "updatedAtMs": 1731945000000
}
```

---

**POST /v1/stops** — Create new stop  
Admin-only endpoint. Creates new shuttle stop with coordinates

```bash
curl -X POST http://localhost:8081/v1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Dormitory",
    "latitude": 41.750,
    "longitude": -72.687,
    "description": "Recently renovated dormitory complex"
  }'
```

Response (HTTP 201 Created):
```json
{
  "id": "stop-new-dormitory-1234567890",
  "name": "New Dormitory",
  "latitude": 41.750,
  "longitude": -72.687,
  "description": "Recently renovated dormitory complex",
  "isActive": true,
  "createdAtMs": 1731945000000,
  "updatedAtMs": 1731945000000
}
```

---

**PUT /v1/stops/{stopId}** — Update stop  
Admin-only endpoint. Updates stop name, location, or description (all fields optional)

```bash
STOP_ID="stop-main-quad-1234567890"
curl -X PUT http://localhost:8081/v1/stops/$STOP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Quad (Updated)",
    "description": "Updated description for main quad"
  }'
```

Response:
```json
{
  "id": "stop-main-quad-1234567890",
  "name": "Main Quad (Updated)",
  "latitude": 41.747,
  "longitude": -72.683,
  "description": "Updated description for main quad",
  "isActive": true,
  "createdAtMs": 1731945000000,
  "updatedAtMs": 1731945200000
}
```

---

**DELETE /v1/stops/{stopId}** — Delete stop  
Admin-only endpoint. Soft delete (marks as inactive, data preserved)

```bash
STOP_ID="stop-main-quad-1234567890"
curl -X DELETE http://localhost:8081/v1/stops/$STOP_ID
```

Response:
```json
{
  "message": "Stop deleted successfully",
  "stop_id": "stop-main-quad-1234567890",
  "timestamp": 1731945300000
}
```

**Note:** Deletion is soft (marks as inactive). Stop data is preserved in storage but won't appear in `/v1/stops` list.

### Stop Data Model

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `id` | String | `stop-main-quad-123456` | Unique stop identifier |
| `name` | String | `Main Quad` | Stop name |
| `latitude` | Double | `41.747` | Stop location (decimal degrees) |
| `longitude` | Double | `-72.683` | Stop location (decimal degrees) |
| `description` | String | `Main courtyard...` | Stop description (optional) |
| `isActive` | Boolean | `true` | Whether stop is active (soft delete) |
| `createdAtMs` | Long | `1731945000000` | Creation timestamp |
| `updatedAtMs` | Long | `1731945000000` | Last update timestamp |

### Pre-Loaded Stops (Default)

When the service starts, it initializes with these Trinity College campus stops:

1. **Main Quad** (41.747, -72.683) - Main courtyard
2. **Long Walk** (41.749, -72.685) - Historic residential area
3. **Athletic Center** (41.745, -72.680) - Sports facilities
4. **Science Center** (41.748, -72.686) - Science building
5. **Library** (41.746, -72.684) - Study center
6. **Crescent Neighborhood** (41.751, -72.690) - Student residential area
7. **Vernon Street** (41.743, -72.675) - Off-campus location
8. **Summit's** (41.753, -72.692) - Dining and student center

You can list them immediately after startup:
```bash
curl "http://localhost:8081/v1/stops" | jq '.stops | map(.name)'
```

---

## Running the Service

### Prerequisites

- **Java 21** or higher
  ```bash
  java -version  # Must show version 21+
  ```
- **Redis** (optional, but required for production)
  ```bash
  # macOS
  brew install redis
  redis-server  # Starts on localhost:6379
  ```

### Local Development (In-Memory Storage)

**Without Redis** — Uses in-memory storage, sufficient for testing

```bash
cd /path/to/tracking-service
./gradlew bootRun
```

Service starts on `http://localhost:8081`

Test it:
```bash
curl "http://localhost:8081/v1/locations/latest/org/trinity"
```

### Local Development (With Redis)

**With Redis** — Persistent storage, closer to production behavior

```bash
# Terminal 1: Start Redis
redis-server --port 6379

# Terminal 2: Start tracking service
cd /path/to/tracking-service
./gradlew bootRun
```

Redis automatically detected on localhost:6379. Verify:
```bash
curl "http://localhost:8081/v1/locations/latest/org/trinity"
```

### Docker Compose (Recommended for Testing)

**Start both service and Redis together:**

```bash
cd /path/to/tracking-service
docker-compose up
```

Logs should show:
```
tracking-service | Started TrackingApplication
redis | Ready to accept connections
```

Access service: `http://localhost:8081`
Access Redis CLI: `docker exec -it tracking-service_redis_1 redis-cli`

### Configuration

Set via environment variables or `application.yaml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8081 | Service port |
| `REDIS_HOST` | localhost | Redis hostname |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | (none) | Redis password if secured |
| `REDIS_TIMEOUT` | 2000 | Redis operation timeout (ms) |
| `SOCKET_IO_BACKEND_URL` | http://localhost:3000 | Backend service URL for Socket.IO events |

Example:
```bash
REDIS_HOST=redis.production.com REDIS_PORT=6380 SERVER_PORT=8081 ./gradlew bootRun
```

### Build Options

```bash
# Build only
./gradlew build

# Build without tests
./gradlew build -x test

# Build and create executable JAR
./gradlew build
java -jar build/libs/tracking-service-0.0.1.jar

# Run tests
./gradlew test
```

### Health Check

Service is ready when:
```bash
curl http://localhost:8081/actuator/health
# Expected: {"status":"UP"}
```

### Swagger UI (Interactive API Documentation)

Available at: `http://localhost:8081/swagger-ui.html`

All endpoints documented with request/response examples

---

## Storage Options

### In-Memory (Default)

- ✅ Zero configuration
- ✅ Fast (all data in RAM)
- ❌ Lost on service restart
- ❌ Not suitable for multi-instance deployments

**Best for:** Local development, testing, demos

Automatic if Redis is unavailable. No configuration needed.

### Redis (Recommended for Production)

- ✅ Persistent across restarts
- ✅ Fast O(1) operations
- ✅ Scales horizontally (multiple instances)
- ✅ Built-in TTL (auto-cleanup of old GPS)
- ✅ Real-time pub/sub for events

**Configure in `application.yaml`:**

```yaml
spring:
  data:
    redis:
      host: localhost          # Redis host
      port: 6379              # Redis port
      timeout: 2000ms         # Operation timeout
      # password: secret      # Uncomment if secured
```

**Or via environment variables:**

```bash
REDIS_HOST=redis.prod.com REDIS_PORT=6380 ./gradlew bootRun
```

**How it works:**

```
GPS arrives → Stored in Redis:
  ├─ Key: "geo:trinity:bus-1" → Value: GeoPoint (current position)
  ├─ Key: "geo:trinity:devices" → Set of all active device IDs
  └─ TTL: 1 hour (auto-delete if no update for 1 hour)

Ride tracking → Stored in Application Memory:
  ├─ rideContexts: {rideId → RideDto}
  ├─ rideDriverLocations: {rideId → DriverLocationDto} (updated from GPS)
  └─ shuttleToRideMapping: {shuttleId → rideId}
  
NOTE: Ride tracking uses in-memory storage (not Redis)
      This maps driver GPS to specific rides in real-time
```

### Comparison

| Feature | In-Memory | Redis |
|---------|-----------|-------|
| Configuration | None | Required |
| Persistence | ❌ No | ✅ Yes |
| Multi-instance | ❌ No | ✅ Yes |
| Performance | ⚡ Very Fast | ⚡ Very Fast |
| Scalability | ❌ Single server | ✅ Horizontal |
| TTL cleanup | Manual | Automatic |
| Cost | Free | Free (OSS) |
| **Recommended for** | Dev/test | Production |

---

## Integration Guide

### Backend (Node.js/Express) Integration

**Complete ride lifecycle example:**

```typescript
import axios from 'axios';

const TRACKING_SERVICE = 'http://localhost:8081';

// Step 1: Student requests ride
async function createRide(rideId, studentId, shuttleId, pickup, dropoff) {
  // Create ride in your database
  const rideData = await db.rides.create({
    id: rideId,
    student_id: studentId,
    shuttle_id: shuttleId,
    status: 'confirmed',
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    dropoff_lat: dropoff.lat,
    dropoff_lng: dropoff.lng
  });
  
  // Register with Tracking Service (IMPORTANT: must happen before GPS)
  await axios.post(`${TRACKING_SERVICE}/v1/rides/${rideId}/start`, {
    ride_id: rideId,
    student_id: studentId,
    driver_id: 'system',
    shuttle_id: shuttleId,
    status: 'confirmed',
    pickup_latitude: pickup.lat,
    pickup_longitude: pickup.lng,
    dropoff_latitude: dropoff.lat,
    dropoff_longitude: dropoff.lng,
    created_at_ms: Date.now(),
    completed_at_ms: null
  });
  
  return rideData;
}

// Step 2: When ride is completed
async function completeRide(rideId) {
  // Update your database
  await db.rides.update(rideId, { status: 'completed' });
  
  // Unregister from Tracking Service
  await axios.post(`${TRACKING_SERVICE}/v1/rides/${rideId}/end`);
}

// Step 3: Query driver location for ride (useful for admin dashboard)
async function getDriverLocation(rideId) {
  const location = await axios.get(
    `${TRACKING_SERVICE}/v1/rides/${rideId}/driver-location`
  );
  return location.data; // { latitude, longitude, heading, speed_mps, ... }
}
```

**Key points:**
- `POST /v1/rides/{rideId}/start` must be called BEFORE driver sends any GPS
- Call `POST /v1/rides/{rideId}/end` when ride is completed to cleanup
- Use environment variable for `TRACKING_SERVICE` URL

### Frontend (React/TypeScript) Integration

**Student Dashboard - Track incoming driver:**

```typescript
import { useState, useEffect } from 'react';

export function StudentDashboard({ rideId }) {
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    // Option 1: POLLING (Simple, current implementation)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${TRACKING_SERVICE_URL}/v1/rides/${rideId}/driver-location`
        );
        if (response.ok) {
          const data = await response.json();
          setDriverLocation(data);
          // Update map marker: data.latitude, data.longitude
        }
      } catch (error) {
        console.error('Failed to fetch driver location:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [rideId]);

  return (
    <div>
      {driverLocation ? (
        <MapComponent
          driverLat={driverLocation.latitude}
          driverLng={driverLocation.longitude}
          driverHeading={driverLocation.heading}
        />
      ) : (
        <p>Loading driver location...</p>
      )}
    </div>
  );
}
```

**Option 2: STREAMING (Real-time, more efficient):**

```typescript
// Subscribe to live GPS stream (doesn't require polling)
useEffect(() => {
  const eventSource = new EventSource(
    `${TRACKING_SERVICE_URL}/sse/geo?org=trinity`
  );
  
  eventSource.addEventListener('message', (event) => {
    const gps = JSON.parse(event.data);
    if (gps.deviceId === shuttleId) {
      // Convert microdegrees to decimal for display
      setDriverLocation({
        latitude: gps.latMicro / 1_000_000,
        longitude: gps.lonMicro / 1_000_000,
        heading: gps.brgDeg,
        speed_mps: gps.spdMps
      });
    }
  });
  
  return () => eventSource.close();
}, [shuttleId]);
```

**Driver Dashboard - Show all available shuttles:**

```typescript
// Fetch all buses every 5 seconds
useEffect(() => {
  const loadBuses = async () => {
    const response = await fetch(
      `${TRACKING_SERVICE_URL}/v1/locations/latest/org/trinity`
    );
    const buses = await response.json();
    
    // buses is array of { deviceId, latMicro, lonMicro, spdMps, brgDeg, ... }
    // Convert microdegrees to decimal for map display
    const formatted = buses.map(bus => ({
      id: bus.deviceId,
      lat: bus.latMicro / 1_000_000,
      lng: bus.lonMicro / 1_000_000,
      speed: bus.spdMps,
      heading: bus.brgDeg
    }));
    
    setShuttles(formatted);
  };
  
  loadBuses();
  const interval = setInterval(loadBuses, 5000);
  return () => clearInterval(interval);
}, []);
```

**Key points:**
- Bus locations returned with **microdegrees** → divide by 1,000,000 for display
- Ride locations returned with **decimal degrees** (no conversion needed)
- Polling: Simple but higher latency (5-10 sec delay)
- Streaming (SSE): Real-time but requires EventSource support

### Socket.IO Integration (Advanced)

Tracking Service can emit events to backend via Socket.IO:

```typescript
// In your backend, listen for GPS events from Tracking Service
socket.on('gps:received', (data) => {
  // data: { org, deviceId, latMicro, lonMicro, spdMps, brgDeg, ... }
  console.log(`Bus ${data.deviceId} at ${data.latMicro / 1_000_000}...`);
  
  // Forward to frontend
  io.emit('bus:location-update', data);
});
```

**Note:** Socket.IO integration is currently listener-only (events received from Tracking Service). Set `SOCKET_IO_BACKEND_URL` environment variable to enable.

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

### Health & Status Endpoints

```bash
# Service health
curl http://localhost:8081/actuator/health

# Detailed metrics
curl http://localhost:8081/actuator/metrics

# Endpoint documentation
curl http://localhost:8081/actuator/mappings | jq '.' | head -50
```

### Swagger UI (Interactive Testing)

Access the built-in interactive API documentation:

```
http://localhost:8081/swagger-ui.html
```

You can test all endpoints directly in the browser with pre-filled examples.

### Testing GPS Ingestion

**Step 1: Send GPS data**

```bash
curl -X POST http://localhost:8081/v1/locations:single \
  -H "Content-Type: application/json" \
  -d '{
    "org": "trinity",
    "deviceId": "bus-1",
    "tripId": "trip-123",
    "tsEventMs": 1731945000000,
    "tsServerMs": 0,
    "latMicro": 41746200,
    "lonMicro": -72691900,
    "accM": 5.0,
    "spdMps": 10.0,
    "brgDeg": 135.0,
    "seq": 1,
    "idempotency": "bus-1-1731945000000-1"
  }'
```

**Step 2: Query stored location**

```bash
# Get single bus
curl "http://localhost:8081/v1/locations/latest?org=trinity&deviceId=bus-1" | jq '.'

# Get all buses
curl "http://localhost:8081/v1/locations/latest/org/trinity" | jq '.'
```

**Step 3: Stream live updates (keep terminal open)**

```bash
curl -N "http://localhost:8081/sse/geo?org=trinity" | tee /tmp/gps.log
```

Then in another terminal, send more GPS updates and watch them appear in the stream.

### Testing Ride Tracking

**Complete workflow:**

```bash
RIDE_ID="ride-abc123"
SHUTTLE_ID="bus-1"

# Step 1: Create ride
curl -X POST http://localhost:8081/v1/rides/$RIDE_ID/start \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "'$RIDE_ID'",
    "student_id": "student-1",
    "driver_id": "driver-1",
    "shuttle_id": "'$SHUTTLE_ID'",
    "status": "confirmed",
    "pickup_latitude": 41.7462,
    "pickup_longitude": -72.6919,
    "dropoff_latitude": 41.7470,
    "dropoff_longitude": -72.6910,
    "created_at_ms": '$(date +%s000)',
    "completed_at_ms": null
  }'

# Step 2: Send GPS for that shuttle (IMPORTANT: after ride creation)
curl -X POST http://localhost:8081/v1/locations:single \
  -H "Content-Type: application/json" \
  -d '{
    "org": "trinity",
    "deviceId": "'$SHUTTLE_ID'",
    "tripId": "trip-123",
    "tsEventMs": '$(date +%s000)',
    "tsServerMs": 0,
    "latMicro": 41746200,
    "lonMicro": -72691900,
    "accM": 5.0,
    "spdMps": 10.0,
    "brgDeg": 135.0,
    "seq": 1,
    "idempotency": "'$SHUTTLE_ID'-'$(date +%s000)'-1"
  }'

# Step 3: Query driver location for ride
curl "http://localhost:8081/v1/rides/$RIDE_ID/driver-location" | jq '.'

# Step 4: Query student location
curl "http://localhost:8081/v1/rides/$RIDE_ID/student-location" | jq '.'

# Step 5: View full context
curl "http://localhost:8081/v1/rides/$RIDE_ID/context" | jq '.'

# Step 6: End ride
curl -X POST http://localhost:8081/v1/rides/$RIDE_ID/end

# Step 7: Verify ride is cleaned (should return 404)
curl "http://localhost:8081/v1/rides/$RIDE_ID/driver-location"
```

**Expected output:**

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

### Debugging Common Issues

**Issue: `/v1/rides/{id}/driver-location` returns 404**

Cause: Either ride doesn't exist, or no GPS has arrived for the shuttle yet

Solutions:
1. Verify ride was created: `curl http://localhost:8081/v1/rides/{id}/context`
2. Verify GPS was sent: `curl http://localhost:8081/v1/locations/latest?org=trinity&deviceId={shuttleId}`
3. Ensure GPS sent AFTER ride created (timing matters!)

**Issue: GPS updates not appearing in stream**

Cause: Redis might be unavailable (falls back to in-memory silently)

Check:
```bash
redis-cli ping  # Should return PONG
```

**Issue: Logs show "Redis connection refused"**

Cause: Redis not running or wrong host/port

Fix:
```bash
# Check Redis is running
redis-server --port 6379

# Or use Docker
docker run -d -p 6379:6379 redis:latest
```

**Issue: Want to see detailed logs**

Add to `application.yaml`:

```yaml
logging:
  level:
    com.javashams.tracking: DEBUG
    org.springframework: INFO
```

Then:
```bash
./gradlew bootRun 2>&1 | grep "com.javashams"
```

### Testing Stops Management

**Step 1: Get all pre-loaded stops**

```bash
curl "http://localhost:8081/v1/stops" | jq '.stops | map({name, latitude, longitude})'
```

Expected output:
```json
[
  { "name": "Athletic Center", "latitude": 41.745, "longitude": -72.68 },
  { "name": "Crescent Neighborhood", "latitude": 41.751, "longitude": -72.69 },
  { "name": "Library", "latitude": 41.746, "longitude": -72.684 },
  { "name": "Long Walk", "latitude": 41.749, "longitude": -72.685 },
  { "name": "Main Quad", "latitude": 41.747, "longitude": -72.683 },
  { "name": "Science Center", "latitude": 41.748, "longitude": -72.686 },
  { "name": "Summit's", "latitude": 41.753, "longitude": -72.692 },
  { "name": "Vernon Street", "latitude": 41.743, "longitude": -72.675 }
]
```

**Step 2: Get a single stop**

```bash
# First, get the actual stop ID (they're auto-generated)
STOP_ID=$(curl -s "http://localhost:8081/v1/stops" | jq -r '.stops[0].id')
curl "http://localhost:8081/v1/stops/$STOP_ID" | jq '.'
```

**Step 3: Create a new stop**

```bash
curl -X POST http://localhost:8081/v1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "name": "McCook Student Center",
    "latitude": 41.7465,
    "longitude": -72.6825,
    "description": "Student activities and recreation center"
  }' | jq '.id'
```

Save the returned `id` for the next steps.

**Step 4: Update the stop**

```bash
STOP_ID="stop-mccook-student-center-123456"  # From step 3
curl -X PUT http://localhost:8081/v1/stops/$STOP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated: Main student activities and recreation center"
  }' | jq '.'
```

**Step 5: Delete the stop**

```bash
STOP_ID="stop-mccook-student-center-123456"  # From step 3
curl -X DELETE http://localhost:8081/v1/stops/$STOP_ID | jq '.'
```

**Step 6: Verify deletion**

```bash
# Query all stops again - should be back to original 8 (McCook's removed)
curl "http://localhost:8081/v1/stops" | jq '.total'
```

Should return: `8`

---

### Performance Testing

**Load test GPS ingestion (1000 updates):**

```bash
for i in {1..1000}; do
  curl -X POST http://localhost:8081/v1/locations:single \
    -H "Content-Type: application/json" \
    -d '{"org":"trinity","deviceId":"bus-'$((RANDOM % 10))'","tripId":"t'$i'","tsEventMs":'$(date +%s000)',"tsServerMs":0,"latMicro":'$((41746200 + RANDOM % 1000))',"lonMicro":'$((72691900 + RANDOM % 1000))',"accM":5,"spdMps":10,"brgDeg":135,"seq":'$i',"idempotency":"id-'$i'"}'
done
```

Monitor with:
```bash
curl http://localhost:8081/actuator/metrics | jq '.'
```

---

## Key Implementation Details

### Coordinate Systems ⚠️ (Important!)

**GPS Endpoints (POST /v1/locations:single, GET /sse/geo)**
- Format: **Microdegrees** (latitude × 1,000,000)
- Example: `latMicro: 41746200` = 41.7462° North
- Why: Integer storage is faster and avoids floating-point precision issues

**Ride Endpoints (GET /v1/rides/{id}/driver-location, etc.)**
- Format: **Decimal degrees** (standard lat/lng)
- Example: `latitude: 41.7462`
- Frontend doesn't need to convert

**Conversion Reference:**
```
Microdegrees → Decimal: divide by 1,000,000
41746200 / 1,000,000 = 41.7462°

Decimal → Microdegrees: multiply by 1,000,000
41.7462 × 1,000,000 = 41746200
```

### Ride Lifecycle & Timing ⚠️ (Critical!)

**Correct Sequence:**

```
1. Backend creates ride in DB
   └─ Calls: POST /v1/rides/{rideId}/start
   └─ Tracking Service stores ride context
   └─ Creates mapping: shuttle_id → rideId

2. Driver sends GPS
   └─ Calls: POST /v1/locations:single with deviceId = shuttle_id
   └─ Tracking Service looks up rideId via mapping
   └─ Updates rideDriverLocations[rideId] with new GPS

3. Frontend queries driver location
   └─ Calls: GET /v1/rides/{rideId}/driver-location
   └─ Returns updated location immediately
```

**Why timing matters:**
- If GPS arrives BEFORE ride creation → no mapping exists → location not stored for that ride
- Solution: Always create ride first, then send GPS

### GeoPoint Data Model

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `org` | String | `trinity` | Organization namespace |
| `deviceId` | String | `bus-1` | Shuttle identifier |
| `tripId` | String | `trip-123` | Logical trip context |
| `tsEventMs` | Long | `1731945000000` | GPS timestamp (device time) |
| `tsServerMs` | Long | `1731945005000` | Server receipt time |
| `latMicro` | Int | `41746200` | Latitude × 1e6 |
| `lonMicro` | Int | `-72691900` | Longitude × 1e6 |
| `accM` | Double | `5.0` | Accuracy in meters |
| `spdMps` | Double | `10.0` | Speed m/s |
| `brgDeg` | Double | `135.0` | Bearing in degrees |
| `seq` | Long | `1` | Sequence for ordering |
| `idempotency` | String | `bus-1-1731945000000-1` | Unique ID (deduplication) |

### RideTrackingDto Data Model

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `ride_id` | String | `ride-abc123` | Unique ride identifier |
| `student_id` | String | `student-1` | Student requesting ride |
| `driver_id` | String | `driver-1` | Driver providing ride |
| `shuttle_id` | String | `bus-1` | Shuttle assigned to ride |
| `status` | String | `confirmed` | Ride status |
| `pickup_latitude` | Double | `41.7462` | Pickup location (decimal°) |
| `pickup_longitude` | Double | `-72.6919` | Pickup location (decimal°) |
| `dropoff_latitude` | Double | `41.7470` | Dropoff location (decimal°) |
| `dropoff_longitude` | Double | `-72.6910` | Dropoff location (decimal°) |
| `created_at_ms` | Long | `1731945000000` | Creation timestamp |
| `completed_at_ms` | Long | `1731945300000` | Completion timestamp |

---

## Architecture Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Spring Boot 3.3 WebFlux | Reactive, high-throughput, minimal resource usage |
| **Language** | Java 21 | Latest LTS, records, pattern matching |
| **Storage** | Redis (fallback: in-memory) | Fast, scales, TTL support, pub/sub |
| **Streaming** | Server-Sent Events | Simple, browser-native, one-way push |
| **Integration** | Socket.IO bridge | Compatible with Node.js backend |
| **Serialization** | JSON | Standard, debuggable, frontend-friendly |
| **Build** | Gradle | Kotlin DSL, faster builds, better IDE support |

---

## Common Patterns

### Pattern 1: Real-Time Bus Tracking (Frontend)

```typescript
// Poll every 5 seconds (simple, works everywhere)
const interval = setInterval(() => {
  fetch('/v1/locations/latest/org/trinity')
    .then(r => r.json())
    .then(buses => updateMapMarkers(buses));
}, 5000);

// Better: Stream with SSE (real-time, no polling overhead)
const stream = new EventSource('/sse/geo?org=trinity');
stream.onmessage = (e) => updateMapMarker(JSON.parse(e.data));
```

### Pattern 2: Ride Tracking Workflow (Backend)

```typescript
// When student requests ride
async function requestRide(student, pickup, dropoff) {
  const ride = await db.rides.create({...});
  await trackingService.startRideTracking(ride.id, ride.shuttle_id, pickup, dropoff);
  return ride;
}

// Periodically check driver location
async function trackRide(rideId) {
  const location = await trackingService.getDriverLocation(rideId);
  notifyStudent(rideId, location); // Send to frontend
}

// When ride completes
async function completeRide(rideId) {
  await trackingService.endRideTracking(rideId);
  await db.rides.update(rideId, { status: 'completed' });
}
```

### Pattern 3: Error Handling

```typescript
// Handle missing/slow GPS
try {
  const location = await fetch(`/v1/rides/${rideId}/driver-location`);
  if (!location.ok) {
    if (location.status === 404) {
      console.warn('Driver location not yet available');
      // Retry in 5 seconds
    }
  }
} catch (error) {
  console.error('Tracking service unavailable', error);
  // Fallback to last known location
}
```

---

## Future Extensions

- **Historical tracking** — Store location trails per ride
- **ETA computation** — Calculate arrival times based on route
- **Geofencing** — Alert when driver near pickup/dropoff radius
- **Analytics** — Track utilization, efficiency, peak times
- **Kafka integration** — Scale event distribution to multiple consumers
- **WebSocket support** — Bi-directional real-time (vs SSE one-way)
- **Batch endpoints** — Query multiple rides at once
- **Location caching** — In-memory cache for frequently accessed locations

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Store GPS | O(1) | Single Redis write |
| Query latest location | O(1) | Direct key lookup |
| Start ride | O(1) | Add to hash map |
| Update ride driver location | O(1) | Hash map write |
| Stream GPS updates | O(N) | One write per update |
| End ride | O(1) | Hash map deletion |

**Throughput:** ~10,000 GPS updates/second per instance with Redis

---

## Support & Documentation

- **Issues:** Check the troubleshooting section above
- **API Reference:** [Swagger UI](http://localhost:8081/swagger-ui.html)
- **Source Code:** `/src/main/java/com/javashams/tracking/`
- **Configuration:** `src/main/resources/application.yaml`

Convert microdegrees to decimal: `latMicro / 1_000_000.0 = latitude`

