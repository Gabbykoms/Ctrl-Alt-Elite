# Driver Operations Feature - Architecture Report

## Date: March 11, 2026

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Overview](#current-architecture-overview)
3. [New Feature Requirements](#new-feature-requirements)
4. [Option Analysis](#option-analysis)
   - [Option A: Backend Service](#option-a-backend-service-nodejs)
   - [Option B: Tracking Service](#option-b-tracking-service-spring-boot--recommended)
   - [Option C: New Microservice](#option-c-new-microservice)
5. [Recommendation](#recommendation)
6. [Proposed Data Model](#proposed-data-model)
7. [Proposed API Endpoints](#proposed-api-endpoints)
8. [Admin Analytics Design](#admin-analytics-design)
9. [Migration Plan](#migration-plan)
10. [Comparison Matrix](#comparison-matrix)

---

## Executive Summary

This report evaluates three architectural approaches for adding driver operations features (time documentation, fuel/mileage logging, vehicle inspections, and admin analytics) to the Bantam Shuttle system. After analyzing the existing microservices, their database models, and service boundaries, the recommendation is to **extend the Tracking Service** as the natural home for these features.

---

## Current Architecture Overview

The Bantam Shuttle system is a 4-microservice architecture for Trinity College:

```
Frontend (React 18 + TypeScript) --> Backend (Node.js + Express) --> Tracking Service (Spring Boot Java)
                                                                 \-> AI Service (Python + FastAPI)
```

### Service Inventory

| Service | Tech Stack | Port | Database | Primary Responsibility |
|---------|-----------|------|----------|----------------------|
| **Backend** | Node.js / Express / TypeScript | 8080 | Supabase PostgreSQL | Auth, user management, API gateway |
| **Tracking** | Spring Boot 3.3.5 / Java 21 | 8081 | PostgreSQL 16 + Redis 7 | Real-time GPS, driver lifecycle, rides |
| **AI** | Python / FastAPI / LangChain | 8083 | Supabase + pgvector | RAG-powered chatbot |
| **Frontend** | React 18 / Vite / Tailwind | 5173 | -- | Student, Driver, Admin dashboards |

### Backend Service - Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (student, driver, admin roles) linked to Supabase auth |
| `students` | Student details (grade, school, emergency contact) |
| `drivers` | Driver profiles (license, vehicle info, availability) |
| `stops` | Bus stops with coordinates |
| `routes` | Shuttle routes with distance, duration, frequency |
| `route_stops` | Many-to-many junction (route <-> stop with ordering) |
| `shuttles` | Fleet vehicles (capacity, status, assigned driver/route, live location) |
| `rides` | Ride requests with full status lifecycle (8 states) |
| `shifts` | Driver shift tracking (clock_in, clock_out, hours_worked, notes) |

### Tracking Service - Database Tables

| Table | Purpose |
|-------|---------|
| `drivers` | Driver operational state (status ONLINE/OFFLINE, live GPS, shuttle/route assignment) |
| `rides` | Ride lifecycle (REQUESTED -> IN_PROGRESS -> COMPLETED/CANCELED) |
| `stops` | Campus stops with coordinates and soft-delete |

### Key Observation: Split-Brain Problem

Both the **Backend** and **Tracking Service** currently implement clock-in/clock-out logic independently:

- Backend: `POST /api/drivers/:id/clock-in` and `POST /api/drivers/:id/clock-out` (writes to `shifts` table)
- Tracking: `POST /v1/drivers/{id}/clock-in` and `POST /v1/drivers/{id}/clock-out` (updates driver status)

This duplication creates a split-brain issue where shift state can diverge between services.

---

## New Feature Requirements

### 1. Time Documentation
- Drivers must clock in and clock out with detailed shift logs
- Track total hours worked per shift, per day, per week
- Support notes and shift metadata

### 2. Fuel and Mileage Logging
- Record odometer readings at shift start and end
- Log fuel levels or refueling events during a shift
- Track fuel cost and station (optional)
- Calculate mileage per shift and per vehicle

### 3. Exterior Condition Reports (Vehicle Inspections)
- Pre-trip and post-trip vehicle inspection checklists
- Document: tires, lights, mirrors, body damage, cleanliness, fluids, brakes, horn
- Pass/fail classification for each inspection
- Free-text notes and damage descriptions

### 4. Admin Analytics Dashboard
- Fleet-wide summary statistics
- Per-driver performance metrics (hours, mileage, fuel usage)
- Fuel efficiency trends over time
- Inspection pass/fail rates by vehicle
- Hours worked aggregations and compliance reporting

---

## Option Analysis

### Option A: Backend Service (Node.js)

**What exists there already:** The `shifts` table with clock_in, clock_out, hours_worked, and notes. Driver CRUD with full auth/RBAC.

#### Pros
- Already has a shift tracking foundation (`shifts` table)
- Auth and role-based access control is built-in (admin routes are trivial to add)
- Supabase PostgreSQL is managed and production-ready

#### Cons
- The backend is the **auth gateway** -- it handles JWT, registration, email verification, and role management. Adding operational logging data bloats its responsibility and violates single-responsibility principle.
- The `shifts` table in the backend is a **duplication** of tracking service's clock-in/clock-out logic. This is already a split-brain problem that should be resolved, not extended.
- Different data access patterns: auth is low-write/high-read CRUD; operational logs are high-write append-only data.
- No Redis layer -- analytics queries would hit PostgreSQL directly without caching, leading to slower admin dashboard performance.
- Mixes user identity concerns (who is this person?) with operational concerns (what did they do during their shift?).

#### Verdict: NOT RECOMMENDED
The backend should remain a thin auth/gateway layer. Extending it with operational data would blur service boundaries.

---

### Option B: Tracking Service (Spring Boot) -- RECOMMENDED

**What exists there already:** Driver entity with status management (ONLINE/OFFLINE), clock-in/clock-out endpoints, ride lifecycle tracking, PostgreSQL 16 + Redis 7, location history.

#### Pros
- **Domain alignment** -- Clock-in/out, fuel, mileage, and vehicle inspections are all part of a driver's operational session. The tracking service already owns this bounded context (driver lifecycle management).
- **Existing foundation** -- Driver lifecycle management is already implemented here. New features extend existing models rather than creating parallel ones.
- **Data locality** -- Fuel and conditions correlate directly to shifts and rides. Joins are efficient within one database. Example: "Show me fuel consumed per ride" is a single-DB query, not a cross-service call.
- **Redis for analytics** -- Redis 7 is already deployed and configured. Cache computed aggregations (avg hours/week, fuel efficiency trends) with TTL instead of recomputing on every admin request.
- **Spring Boot strengths** -- JPA makes adding entities trivial. `@Scheduled` annotation enables background analytics pre-computation. Rich ecosystem for reporting and data processing.
- **Resolves the split-brain** -- Consolidating all shift logic here makes the tracking service the single source of truth for all driver operations. The backend's `shifts` table can be deprecated.
- **Existing infrastructure** -- PostgreSQL and Redis are already provisioned in Docker Compose and Kubernetes. No new infrastructure needed.

#### Cons
- No auth middleware today (relies on backend forwarding authenticated requests). Requires either:
  - (a) Continue routing through backend as a proxy (current pattern -- no changes needed), or
  - (b) Add JWT validation to tracking service (one-time effort, approximately 50 lines with Spring Security)
- Slightly expands the tracking service scope, but remains within the same domain boundary (driver operations).

#### Verdict: RECOMMENDED
The tracking service is the natural home for driver operations features.

---

### Option C: New Microservice

**Concept:** Create a dedicated "Driver Operations Service" with its own database, deployment pipeline, and API surface.

#### Pros
- Clean separation of concerns with a dedicated service
- Independent scaling for analytics workloads
- Could use a tech stack optimized for time-series/analytics (e.g., TimescaleDB)
- No risk of affecting existing tracking functionality

#### Cons
- **Over-engineering for scale** -- This is a college shuttle app. A 5th service means a new deployment, new CI/CD pipeline, new database, new Kubernetes config, new Docker Compose entry, new health checks, and ongoing maintenance burden.
- **Data duplication** -- Driver info lives in backend + tracking. A new service would need to sync or cross-query, adding latency and failure modes.
- **Cross-service analytics** -- "Show me driver X's fuel usage alongside their shift hours and ride count" would require querying 2-3 services and joining results in the application layer. This is both slower and more error-prone.
- **Team overhead** -- More services means more things to monitor, debug, and deploy. For a small team, this complexity is not justified.
- **Increased latency** -- Every cross-service call adds network overhead. Analytics that touch multiple data sources become significantly slower.

#### Verdict: NOT RECOMMENDED
The operational overhead does not justify the benefits at the current scale of this project.

---

## Recommendation

### Extend the Tracking Service

The tracking service should be extended to become the single source of truth for all driver operational data. This includes enhanced shift logging, fuel/mileage tracking, vehicle inspections, and analytics endpoints.

**Key reasons:**
1. It already owns the driver operational lifecycle (clock-in/out, status, location)
2. Data stays co-located with rides and driver state for efficient queries
3. Redis is available for caching analytics
4. Resolves the existing split-brain duplication between backend and tracking
5. Minimal infrastructure changes required

---

## Proposed Data Model

### New Tables (in tracking_db)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TRACKING SERVICE DB                           │
│                                                                      │
│  EXISTING:                                                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                       │
│  │ drivers  │───>│  rides   │    │  stops   │                       │
│  └──────────┘    └──────────┘    └──────────┘                       │
│       │                                                              │
│  NEW: │                                                              │
│       │    ┌─────────────────────┐                                   │
│       ├───>│    shift_logs       │                                   │
│       │    └─────────────────────┘                                   │
│       │                 │                                            │
│       │    ┌─────────────────────┐                                   │
│       ├───>│ vehicle_inspections │                                   │
│       │    └─────────────────────┘                                   │
│       │                                                              │
│       │    ┌─────────────────────┐                                   │
│       └───>│    fuel_logs        │                                   │
│            └─────────────────────┘                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### shift_logs

Replaces and enhances the backend's `shifts` table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique shift identifier |
| `driver_id` | VARCHAR (FK -> drivers) | Driver performing the shift |
| `shuttle_id` | VARCHAR | Assigned shuttle/vehicle |
| `clock_in_at` | BIGINT | Clock-in timestamp (epoch ms) |
| `clock_out_at` | BIGINT (nullable) | Clock-out timestamp (epoch ms) |
| `hours_worked` | DECIMAL(5,2) (nullable) | Computed hours worked |
| `start_odometer_mi` | DECIMAL(10,1) (nullable) | Odometer at shift start |
| `end_odometer_mi` | DECIMAL(10,1) (nullable) | Odometer at shift end |
| `fuel_level_start` | DECIMAL(5,2) (nullable) | Fuel level at start (percentage or gallons) |
| `fuel_level_end` | DECIMAL(5,2) (nullable) | Fuel level at end |
| `notes` | TEXT (nullable) | Free-text shift notes |
| `created_at_ms` | BIGINT | Record creation timestamp |

**Indexes:** `idx_shift_logs_driver_id`, `idx_shift_logs_shuttle_id`, `idx_shift_logs_clock_in_at`

### vehicle_inspections

Pre-trip and post-trip vehicle condition reports.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique inspection identifier |
| `shift_log_id` | VARCHAR (FK -> shift_logs) | Associated shift |
| `driver_id` | VARCHAR (FK -> drivers) | Inspecting driver |
| `shuttle_id` | VARCHAR | Inspected vehicle |
| `inspection_type` | VARCHAR | `PRE_TRIP` or `POST_TRIP` |
| `tire_condition` | VARCHAR | `GOOD`, `FAIR`, or `POOR` |
| `lights_working` | BOOLEAN | All lights functional |
| `mirrors_intact` | BOOLEAN | All mirrors intact |
| `body_damage_noted` | BOOLEAN | Any body damage observed |
| `body_damage_desc` | TEXT (nullable) | Description of damage if noted |
| `cleanliness` | VARCHAR | `CLEAN`, `ACCEPTABLE`, or `DIRTY` |
| `fluid_levels_ok` | BOOLEAN | All fluid levels acceptable |
| `brakes_ok` | BOOLEAN | Brakes functioning properly |
| `horn_working` | BOOLEAN | Horn functional |
| `overall_status` | VARCHAR | `PASS` or `FAIL` |
| `notes` | TEXT (nullable) | Additional observations |
| `created_at_ms` | BIGINT | Inspection timestamp |

**Indexes:** `idx_inspections_shift_log_id`, `idx_inspections_driver_id`, `idx_inspections_shuttle_id`, `idx_inspections_type`

### fuel_logs

Individual refueling events, either mid-shift or standalone.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique fuel log identifier |
| `driver_id` | VARCHAR (FK -> drivers) | Driver who refueled |
| `shuttle_id` | VARCHAR | Vehicle refueled |
| `shift_log_id` | VARCHAR (FK -> shift_logs, nullable) | Associated shift (if during a shift) |
| `gallons` | DECIMAL(6,2) | Gallons added |
| `odometer_reading_mi` | DECIMAL(10,1) | Odometer at time of refueling |
| `cost_usd` | DECIMAL(8,2) (nullable) | Cost of fuel |
| `station_name` | VARCHAR (nullable) | Fuel station name/location |
| `created_at_ms` | BIGINT | Refueling timestamp |

**Indexes:** `idx_fuel_logs_driver_id`, `idx_fuel_logs_shuttle_id`, `idx_fuel_logs_shift_log_id`, `idx_fuel_logs_created_at`

---

## Proposed API Endpoints

All endpoints live on the tracking service (port 8081).

### Shift Logs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/shifts/clock-in` | Create shift log and set driver ONLINE. Triggers PRE_TRIP inspection requirement. | Driver |
| `POST` | `/v1/shifts/{id}/clock-out` | Close shift log, compute hours, set driver OFFLINE. Triggers POST_TRIP inspection. | Driver |
| `GET` | `/v1/shifts/driver/{driverId}` | Get shift history for a driver (paginated) | Driver, Admin |
| `GET` | `/v1/shifts/{id}` | Get single shift with related inspections and fuel logs | Driver, Admin |
| `GET` | `/v1/shifts/active` | Get all currently active (open) shifts | Admin |

### Vehicle Inspections

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/inspections` | Submit an inspection report | Driver |
| `GET` | `/v1/inspections/shift/{shiftId}` | Get inspections for a specific shift | Driver, Admin |
| `GET` | `/v1/inspections/shuttle/{shuttleId}` | Get inspection history for a vehicle (paginated) | Admin |
| `GET` | `/v1/inspections/recent` | Get recent inspections across fleet | Admin |

### Fuel Logs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/fuel-logs` | Log a fuel entry | Driver |
| `GET` | `/v1/fuel-logs/driver/{driverId}` | Get fuel history for a driver (paginated) | Driver, Admin |
| `GET` | `/v1/fuel-logs/shuttle/{shuttleId}` | Get fuel history for a vehicle (paginated) | Admin |

### Admin Analytics (cached in Redis)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/v1/analytics/overview` | Fleet-wide summary: total hours, total mileage, avg fuel efficiency, inspection pass rate | Admin |
| `GET` | `/v1/analytics/drivers/{id}/summary` | Per-driver stats: hours this week/month, mileage, fuel usage, inspection history | Admin |
| `GET` | `/v1/analytics/fleet/fuel` | Fuel efficiency trends over time (daily/weekly aggregations) | Admin |
| `GET` | `/v1/analytics/fleet/inspections` | Inspection pass/fail rates by vehicle and over time | Admin |
| `GET` | `/v1/analytics/fleet/hours` | Hours worked aggregations by driver, day of week, and time period | Admin |

---

## Admin Analytics Design

### Caching Strategy

Analytics endpoints should use Redis caching to avoid expensive aggregation queries on every request:

```
Request --> Check Redis Cache --> Cache HIT --> Return cached result
                              --> Cache MISS --> Query PostgreSQL
                                             --> Compute aggregation
                                             --> Store in Redis (TTL: 5-15 min)
                                             --> Return result
```

### Suggested Cache TTLs

| Endpoint | TTL | Rationale |
|----------|-----|-----------|
| `/analytics/overview` | 5 minutes | High traffic, acceptable staleness |
| `/analytics/drivers/{id}/summary` | 10 minutes | Per-driver, moderate freshness needed |
| `/analytics/fleet/fuel` | 15 minutes | Trends change slowly |
| `/analytics/fleet/inspections` | 15 minutes | Historical data, low volatility |
| `/analytics/fleet/hours` | 10 minutes | May need near-real-time for active shifts |

### Pre-computation (Optional)

Use Spring's `@Scheduled` annotation to pre-compute expensive analytics during off-peak hours:

```java
@Scheduled(cron = "0 0 3 * * *")  // 3 AM daily
public void precomputeDailyAnalytics() {
    // Compute and cache daily summaries
}
```

---

## Migration Plan

### Phase 1: Database Schema
1. Add `shift_logs`, `vehicle_inspections`, and `fuel_logs` tables to `tracking-service/scripts/init_db.sql`
2. Create corresponding JPA entities: `ShiftLog.java`, `VehicleInspection.java`, `FuelLog.java`
3. Create Spring Data JPA repositories for each entity

### Phase 2: Core Endpoints
1. Create `ShiftController.java` with enhanced clock-in/clock-out that creates `shift_logs`
2. Create `InspectionController.java` for vehicle inspection CRUD
3. Create `FuelLogController.java` for fuel logging CRUD
4. Create DTOs for request/response payloads
5. Refactor existing `DriverController` clock-in/clock-out to delegate to shift service

### Phase 3: Analytics
1. Create `AnalyticsService.java` with aggregation queries
2. Create `AnalyticsController.java` with admin-only endpoints
3. Implement Redis caching for analytics responses
4. Add scheduled pre-computation for expensive queries (optional)

### Phase 4: Backend Deprecation
1. Deprecate the backend's `shifts` table
2. Deprecate backend's `POST /api/drivers/:id/clock-in` and `POST /api/drivers/:id/clock-out`
3. Update backend driver routes to proxy to tracking service for shift operations (or have frontend call tracking service directly through backend gateway)
4. Update frontend Driver Dashboard to use new endpoints

### Phase 5: Frontend Integration
1. Update Driver Dashboard with shift log forms (odometer, fuel level inputs at clock-in/clock-out)
2. Add vehicle inspection form (pre-trip required before driving, post-trip at clock-out)
3. Add fuel log entry form
4. Build Admin Analytics Dashboard with charts and tables

---

## Comparison Matrix

| Criterion | Backend | Tracking (Recommended) | New Service |
|-----------|---------|----------------------|-------------|
| Domain fit | Partial (has shifts) | **Strong (owns driver ops)** | Clean but isolated |
| Data locality | Separate DB from rides | **Same DB as rides/drivers** | Separate DB |
| Existing infra reuse | Supabase only | **PostgreSQL + Redis** | New everything |
| Analytics performance | No cache layer | **Redis for aggregations** | Would need own cache |
| Operational overhead | None | **Minimal (extend existing)** | High (new service + DB + CI/CD) |
| Resolves duplication | No | **Yes (consolidates shifts)** | No (adds more) |
| Cross-service queries | Needed for ride correlation | **Not needed (co-located)** | Needed for everything |
| Auth changes needed | None | Minimal (proxy or add JWT) | Full auth setup |
| Time to implement | Medium | **Low-Medium** | High |
| Scalability ceiling | Limited | **Good (Redis + PostgreSQL)** | Best (independent) |

---

## Conclusion

Extending the **Tracking Service** provides the best balance of domain alignment, data locality, infrastructure reuse, and implementation effort. It resolves the existing split-brain problem with shift management, keeps operationally related data co-located for efficient queries, and leverages the already-provisioned Redis cache for analytics performance. The alternative of a new microservice introduces unnecessary operational complexity for a project at this scale, while extending the backend would blur the boundary between identity management and operational logging.
