# Tracking Service

**Driver management and ride-tracking service** for the Trinity College Bantam Shuttle system.

This Spring Boot microservice manages:
- **Driver lifecycle** - clock-in/out with location tracking, status management
- **Ride persistence** - ride creation with automatic driver assignment
- **Real-time location tracking** - driver position updates and queries
- **Stop management** - pre-loaded Trinity College shuttle stops (CRUD)
- **Persistent storage** - PostgreSQL for drivers, rides, and stops
- **Auto-assignment** - automatically assigns available drivers to new rides

**Tech Stack**: Spring Boot 3.3.5 (Java 21) | PostgreSQL 16 | Redis 7 | Docker Compose | Spring Data JPA

---

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Java 21 JDK
- Gradle

### 1. Start Database & Cache

```bash
cd docker
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (database: `tracking_db`)
- **Redis 7** on `localhost:6379` (password: `redis_password`)
- Schema auto-initialized with drivers, rides, and stops tables

### 2. Run the Application

```bash
./gradlew bootRun
```

The service starts on `http://localhost:8081`

### 3. Access Swagger UI

Open your browser to: **`http://localhost:8081/swagger-ui.html`**

Interactive API documentation with try-it-out functionality.

---

For detailed database schema, indexes, constraints, and migration information, see **[SCHEMA.md](./SCHEMA.md)**.

---

## API Endpoints

For complete API endpoint documentation, see **[APIENDPOINTS.md](./APIENDPOINTS.md)**.

Includes all driver, ride, and stop management endpoints with request/response examples and interactive Swagger UI reference.

---

## Testing

For comprehensive API testing examples, including curl commands for all driver, ride, and stop endpoints, see **[TESTING.md](./TESTING.md)**.

Also includes:
- Complete testing workflows
- Debugging guides
- Performance testing examples
- Swagger UI reference

---

## Building & Deployment

### Build JAR
```bash
./gradlew build
```
Creates `build/libs/tracking-service-{version}.jar`

### Build Docker Image

Build a production-ready container image using Gradle:

```bash
./gradlew bootBuildImage
```

This command:
- Compiles the application
- Creates a Docker image named `tracking-service:0.1.0` (default version)
- Image size: ~741MB
- Uses Paketo buildpacks for optimized layering

**Customize the version:**

The image is named based on the `VERSION` environment variable. If not specified, it defaults to `0.1.0`.

```bash
# Build with default version (0.1.0)
./gradlew bootBuildImage
# Creates: tracking-service:0.1.0

# Build with custom version
VERSION=1.0.0 ./gradlew bootBuildImage
# Creates: tracking-service:1.0.0

# Export version for multiple builds
export VERSION=2.0.0
./gradlew bootBuildImage
# Creates: tracking-service:2.0.0
```

**Run the container:**

```bash
# Start docker-compose for databases first
docker-compose up -d

# Run the app container
docker run -d \
  --name tracking-app \
  --network tracking-service_tracking-network \
  -p 8081:8081 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://tracking-postgres:5432/tracking_db" \
  -e SPRING_DATASOURCE_USERNAME="tracking_user" \
  -e SPRING_DATASOURCE_PASSWORD="tracking_password" \
  -e SPRING_DATA_REDIS_HOST="tracking-redis" \
  -e SPRING_DATA_REDIS_PORT="6379" \
  -e SPRING_DATA_REDIS_PASSWORD="redis_password" \
  tracking-service:0.1.0
```

Verify the container is running:
```bash
curl http://localhost:8081/actuator/health
```

### Stop the Services
```bash
pkill -9 -f bootRun           # Stop Spring Boot app
cd docker && docker-compose down  # Stop containers (without -v to preserve data)
```

To also delete all data:
```bash
cd docker && docker-compose down -v
```

---

## Architecture Notes

**Auto-Assignment Logic:**
When a new ride is created, the service queries `GET /v1/drivers/shuttle/{shuttleId}/online` and assigns the first available driver. If no online drivers exist, the ride remains in `REQUESTED` status until a driver comes online.

**Persistence:**
All driver, ride, and stop data persists in PostgreSQL. Restarting the application or containers does not lose data (Docker volumes preserve database state).

**Data Flow:**
1. Driver clocks in → status = `ONLINE`, location recorded
2. Ride created → system auto-assigns online driver or waits
3. Driver updates location → coordinates updated in real-time
4. Ride completed → status = `COMPLETED`, timestamp recorded
5. Driver clocks out → status = `OFFLINE`, all locations cleared

---

## Notes on Redundant Controllers

The codebase includes three controllers that are over-engineered for the current MVP and can be ignored:

1. **IngestController** (`/v1/locations:single`) - Raw GPS telemetry ingestion. Drivers are managed via the DriverController directly; location updates are sent to the clock-in/update-location endpoints.

2. **LocationQueryController** (`/v1/locations/latest`) - Historical location queries. Real-time location is available via `/v1/rides/{rideId}/driver-location-details` for active rides.

3. **GeoSseController** (`/sse/geo`) - Server-Sent Events streaming. Current MVP provides location data on-demand via REST endpoints; real-time streaming can be added in future phases.

These three controllers are present in the codebase but **not required for current operations**.
