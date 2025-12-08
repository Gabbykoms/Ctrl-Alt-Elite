# 🗺️ Bantam Shuttle Backend - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Student    │  │    Driver    │  │     Admin    │              │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          │ HTTP + WebSocket │ HTTP + WebSocket │ HTTP + WebSocket
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────────────┐
│                      BACKEND API (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Routes:                                                      │   │
│  │  • /api/auth      (login, register, verify)                │   │
│  │  • /api/rides     (request, status, history)               │   │
│  │  • /api/shuttles  (list, details)                          │   │
│  │  • /api/routes    (list, stops)                            │   │
│  │  • /api/stops     (list, create, update, delete)           │   │
│  │  • /api/drivers   (list, details, clock in/out)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Business Logic:                                              │   │
│  │  • Authentication (JWT, email verification)                │   │
│  │  • Ride Assignment (smart matching)                        │   │
│  │  • State Machine (ride lifecycle)                          │   │
│  │  • Socket.IO Events (real-time updates)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────▼──────────────────┬──────────────────────────────────────┘
          │                  │
          │                  │ REST API / Events
          │                  │
┌─────────▼──────────────────▼───────────────────────────────────────┐
│                    DATABASE LAYER ✅ COMPLETE                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Supabase PostgreSQL                                          │  │
│  │                                                               │  │
│  │  Tables:                                                     │  │
│  │   • users, students, drivers (authentication & profiles)    │  │
│  │   • stops, routes, route_stops (network)                   │  │
│  │   • shuttles (fleet vehicles)                              │  │
│  │   • rides (booking & tracking)                             │  │
│  │   • shifts (driver hours)                                  │  │
│  │                                                               │  │
│  │  Features:                                                   │  │
│  │   ✅ Normalized schema                                       │  │
│  │   ✅ Foreign keys & constraints                              │  │
│  │   ✅ 15+ performance indexes                                 │  │
│  │   ✅ Row-level security (RLS)                               │  │
│  │   ✅ Auto-updating timestamps                                │  │
│  │   ✅ Sample data included                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────▼──────────────────┬──────────────────────────────────────┘
          │                  │
          │                  │
┌─────────▼──────────────────▼────────────────────────────────────────┐
│           SUPPORTING MICROSERVICES (Separate Processes)             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRACKING SERVICE (Spring Boot - Java)                            │
│  ├─ GPS Ingestion: Receives location updates from driver phones   │
│  ├─ Location Queries: /v1/locations/latest/org/trinity            │
│  ├─ SSE Streaming: Real-time location feed                        │
│  └─ Ride Tracking: Track driver + student during ride            │
│                                                                     │
│  AI SERVICE (FastAPI - Python)                                    │
│  ├─ RAG Pipeline: Retrieve & generate responses                   │
│  ├─ Vector DB: pgvector for semantic search                       │
│  ├─ Knowledge Base: Shuttle FAQs, policies, routes                │
│  └─ Chat Endpoint: /chat/ for AI responses                        │
│                                                                     │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Student Requesting a Ride

```
┌──────────────────────────────────────────────────────────────────┐
│ STUDENT REQUESTS RIDE                                            │
└──────────────────────────────────────────────────────────────────┘

1. Frontend sends ride request
   POST /api/rides/request
   ├─ userId (from JWT token)
   ├─ pickupLatitude, pickupLongitude
   ├─ dropoffLatitude, dropoffLongitude
   └─ passengerCount

2. Backend validates & creates ride
   ├─ Check user is authenticated ✓
   ├─ Validate coordinates ✓
   ├─ Insert into rides table ✓
   └─ status = 'requested'

3. Ride assignment algorithm runs
   ├─ Find available shuttles ✓
   ├─ Calculate distance to pickup ✓
   ├─ Check capacity ✓
   ├─ Assign best match ✓
   └─ status = 'driver_assigned'

4. Backend notifies stakeholders
   ├─ Socket.IO → Driver: "New ride available"
   ├─ Socket.IO → Student: "Ride confirmed, ETA 5 min"
   └─ API → Tracking Service: "Start tracking ride #123"

5. Tracking Service receives GPS updates
   ├─ Driver phone sends location every 5 seconds
   ├─ Tracking Service stores in Redis
   └─ Broadcasts to connected clients via SSE

6. Frontend receives real-time updates
   ├─ Student sees driver moving on map
   ├─ Driver sees student pickup location
   └─ ETA updates continuously

7. Driver arrives & trip completes
   ├─ Driver marks: "Arrived at pickup"
   ├─ Student enters vehicle
   ├─ Driver marks: "Trip started"
   ├─ Tracking Service continues streaming location
   ├─ Driver marks: "Trip completed"
   └─ Ride status = 'completed'

8. System updates
   ├─ Ride history saved
   ├─ Driver stats updated
   └─ Feedback system ready
```

## Database Relationships

```
USERS (Core)
  │
  ├─→ STUDENTS (1:1)
  │     │
  │     └─→ RIDES (1:many)
  │         ├─→ pickup at STOPS
  │         ├─→ dropoff at STOPS
  │         └─→ served by SHUTTLES
  │
  └─→ DRIVERS (1:1)
      ├─→ SHIFTS (1:many)
      │   ├─→ drives SHUTTLES
      │   └─→ clock in/out tracking
      │
      └─→ SHUTTLES (assigned)
          ├─→ on ROUTES
          ├─→ serves STOPS
          └─→ carries RIDES

ROUTES (Network)
  └─→ ROUTE_STOPS (junction table)
      └─→ STOPS (many:many mapping)
```

## Key Technologies

```
BACKEND STACK:
├─ Runtime: Node.js 20+
├─ Framework: Express.js
├─ Language: TypeScript
├─ Database: Supabase (PostgreSQL)
├─ Authentication: JWT
├─ Real-time: Socket.IO
├─ Validation: Zod
└─ Testing: Jest/Vitest

SUPPORTING SERVICES:
├─ Tracking: Spring Boot + WebFlux (Java)
├─ AI: FastAPI + LangChain (Python)
└─ Frontend: React + TypeScript (Node.js)
```

## API Endpoints (Implemented/Planned)

```
AUTHENTICATION
├─ POST   /api/auth/register              ← Next to implement
├─ POST   /api/auth/login                 ← Next to implement
├─ GET    /api/auth/me                    ← Next to implement
└─ POST   /api/auth/logout                ← Next to implement

RIDES (Core Feature)
├─ POST   /api/rides/request              ← Next to implement
├─ GET    /api/rides                      ✓ Query by student
├─ GET    /api/rides/:id                  ✓ Get details
├─ PATCH  /api/rides/:id/status           ← Next to implement
└─ PATCH  /api/rides/:id/cancel           ← Next to implement

SHUTTLES
├─ GET    /api/shuttles                   ✓ List all
├─ GET    /api/shuttles/:id               ✓ Get details
├─ POST   /api/shuttles                   ← Admin only
├─ PATCH  /api/shuttles/:id               ← Admin only
└─ DELETE /api/shuttles/:id               ← Admin only

STOPS
├─ GET    /api/stops                      ✓ List all
├─ GET    /api/stops/:id                  ✓ Get details
├─ POST   /api/stops                      ← Admin only
├─ PATCH  /api/stops/:id                  ← Admin only
└─ DELETE /api/stops/:id                  ← Admin only

ROUTES
├─ GET    /api/routes                     ✓ List all
├─ GET    /api/routes/:id                 ✓ Get with stops
├─ POST   /api/routes                     ← Admin only
├─ PATCH  /api/routes/:id                 ← Admin only
└─ DELETE /api/routes/:id                 ← Admin only

DRIVERS
├─ GET    /api/drivers                    ← Admin only
├─ GET    /api/drivers/:id                ✓ Get details
├─ POST   /api/drivers/clock-in           ← Driver use
├─ POST   /api/drivers/clock-out          ← Driver use
└─ PATCH  /api/drivers/:id/status         ← Driver use
```

## Development Workflow

```
┌─────────────────────────────────┐
│  1. Design in DATABASE_SETUP.md │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  2. Implement in database.ts    │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  3. Create/Update API routes    │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  4. Test locally with curl/API  │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  5. Wire to frontend components │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  6. Test end-to-end in browser  │
└─────────────────────────────────┘
```

## Getting Started

```
# 1. Setup database (5-10 min)
See: backend/DATABASE_SETUP.md

# 2. Install dependencies
npm install

# 3. Start backend server
npm run dev

# 4. Test database connection
npx tsx src/utils/testDatabase.ts

# 5. Check routes are responding
curl http://localhost:3000/health

# 6. Start frontend (in separate terminal)
cd ../frontend
npm run dev

# 7. Open browser
http://localhost:5173
```

---

**Database layer is complete and ready! Next step: Authentication Implementation** 🚀
