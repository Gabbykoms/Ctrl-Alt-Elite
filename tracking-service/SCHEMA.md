# Database Schema

Tracking service database schema for Trinity College Bantam Shuttle system.

---

## Drivers Table

Stores driver profiles and real-time location data.

```sql
CREATE TABLE drivers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    shuttle_id VARCHAR(255),
    route_id VARCHAR(255),
    current_lat DECIMAL(10, 6),
    current_lng DECIMAL(10, 6),
    last_location_update_at_ms BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE'
);
```

**Key Fields:**
- `status` - `OFFLINE` (clocked out) or `ONLINE` (clocked in, available for rides)
- `current_lat/lng` - Updated during driver shifts, cleared on clock-out
- `last_location_update_at_ms` - Timestamp of last location update

**Indexes:**
```sql
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_shuttle_id ON drivers(shuttle_id);
```

---

## Rides Table

Stores ride orders with driver assignments.

```sql
CREATE TABLE rides (
    ride_id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    driver_id VARCHAR(255),
    shuttle_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    pickup_lat DECIMAL(10, 6) NOT NULL,
    pickup_lng DECIMAL(10, 6) NOT NULL,
    dropoff_lat DECIMAL(10, 6) NOT NULL,
    dropoff_lng DECIMAL(10, 6) NOT NULL,
    created_at_ms BIGINT NOT NULL,
    completed_at_ms BIGINT
);
```

**Key Fields:**
- `driver_id` - Nullable: `NULL` if no driver available, set when auto-assigned
- `status` - `REQUESTED` (waiting for driver) → `IN_PROGRESS` (assigned) → `COMPLETED` or `CANCELED`
- `created_at_ms/completed_at_ms` - Ride lifecycle timestamps

**Indexes:**
```sql
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_student_id ON rides(student_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_shuttle_id ON rides(shuttle_id);
```

**Status Lifecycle:**
```
REQUESTED 
  ↓ (driver assigned)
IN_PROGRESS
  ↓ (ride completed)
COMPLETED
  
OR:
REQUESTED
  ↓ (ride cancelled)
CANCELED
```

---

## Stops Table

Pre-loaded with Trinity College shuttle stops.

```sql
CREATE TABLE stops (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at_ms BIGINT NOT NULL,
    updated_at_ms BIGINT NOT NULL
);
```

**Key Fields:**
- `is_active` - Soft delete indicator (true = active, false = deleted)
- `created_at_ms/updated_at_ms` - Timestamps for auditing

**Indexes:**
```sql
CREATE INDEX idx_stops_is_active ON stops(is_active);
```

**Pre-loaded Stops (Trinity College Campus):**

| Stop ID | Name | Latitude | Longitude |
|---------|------|----------|-----------|
| stop-1 | Main Quad | 41.747 | -72.683 |
| stop-2 | Long Walk | 41.749 | -72.685 |
| stop-3 | Athletic Center | 41.745 | -72.680 |
| stop-4 | Science Center | 41.748 | -72.686 |
| stop-5 | Library | 41.746 | -72.684 |
| stop-6 | Crescent Neighborhood | 41.751 | -72.690 |
| stop-7 | Vernon Street | 41.743 | -72.675 |
| stop-8 | Summit's | 41.753 | -72.692 |

---

## Data Model Relationships

```
DRIVERS (1) ─── (Many) RIDES
  id (PK)  ───────  driver_id (FK)
  
  Auto-assignment logic:
  - When ride created, query: SELECT * FROM drivers 
    WHERE shuttle_id = ride.shuttle_id AND status = 'ONLINE'
  - Assign first available driver
  - If no driver found, ride.driver_id remains NULL (REQUESTED status)

STOPS (Many) ─── (Many) DRIVERS & RIDES
  id (PK) ───────  referenced in pickup/dropoff coordinates
  
  Semantic relationship:
  - Drivers assign shuttle_id (which serves specific stops)
  - Rides use latitude/longitude (not stop_id)
  - Matching stops to rides done via proximity calculation in app
```

---

## Constraints & Validations

### NOT NULL Constraints
- Drivers: `id`, `name`, `status`
- Rides: `ride_id`, `student_id`, `shuttle_id`, `status`, `pickup_lat`, `pickup_lng`, `dropoff_lat`, `dropoff_lng`, `created_at_ms`
- Stops: `id`, `name`, `latitude`, `longitude`, `created_at_ms`, `updated_at_ms`

### Default Values
- Drivers: `status` defaults to `'OFFLINE'`
- Rides: `status` defaults to `'REQUESTED'`
- Stops: `is_active` defaults to `true`

### Value Ranges
- `latitude`: -90.0 to 90.0 decimal degrees
- `longitude`: -180.0 to 180.0 decimal degrees
- `status` (drivers): `'OFFLINE'` | `'ONLINE'`
- `status` (rides): `'REQUESTED'` | `'IN_PROGRESS'` | `'COMPLETED'` | `'CANCELED'`

---

## Migrations & Updates

### Init Script
Auto-runs on service startup via `init_db.sql`:
- Creates all tables
- Creates indexes
- Pre-loads 8 Trinity College stops

### Schema Changes
To modify schema after initial setup:

1. Update `init_db.sql` with new DDL
2. Restart service: `docker-compose down -v && docker-compose up -d`
3. Redeploy application

**Note:** `-v` flag removes volumes (deletes data). For production, use database migration tools like Flyway.

---

## Performance Considerations

### Index Strategy
- `idx_drivers_status` → Fast queries for online drivers
- `idx_drivers_shuttle_id` → Auto-assignment queries
- `idx_rides_status` → Pending/active ride queries
- `idx_rides_student_id` → Student's ride history
- `idx_rides_driver_id` → Driver's assigned rides
- `idx_stops_is_active` → List active stops only

### Typical Query Performance
| Query | Complexity | Time |
|-------|-----------|------|
| Get online drivers for shuttle | O(n) index scan | <1ms |
| Get pending rides | O(n) index scan | <1ms |
| Get ride by ID | O(1) PK lookup | <1ms |
| Create ride (with auto-assign) | O(n) + insert | <5ms |

### Connection Pool
- Max connections: 20 (PostgreSQL default)
- Suitable for MVP (single instance)
- For production, increase via environment variables

---

## Backup & Recovery

### PostgreSQL Backup
```bash
# Full database backup
docker exec tracking-service_postgres_1 pg_dump -U postgres tracking_db > backup.sql

# Restore backup
docker exec -i tracking-service_postgres_1 psql -U postgres tracking_db < backup.sql
```

### Volume Backup
```bash
# Backup PostgreSQL volume
docker run --rm -v tracking-service_postgres-data:/data -v $(pwd):/backup \
  busybox tar czf /backup/postgres-backup.tar.gz /data
```

---

## Future Enhancements

- **Soft deletes** - Add `deleted_at_ms` columns for audit trail
- **Location history** - New table to store GPS trail per driver
- **Ride history archive** - Archive completed rides to separate table
- **Partitioning** - Partition rides by `created_at_ms` for large datasets
- **Replication** - Read replicas for analytics
- **Full-text search** - Index driver names, stop descriptions
