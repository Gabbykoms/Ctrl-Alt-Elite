# Backend Routes - Technical Documentation

## Overview

All backend routes are configured to use the Supabase database with a complete database operations service layer.

---

## Routes Configuration

### Authentication Routes (`src/routes/auth.ts`)

**Data Source**: Supabase Auth + Users Table

**Operations**:
  - Register (creates user + profile)
  - Login (authenticates + returns token)
  - Logout
  - Get current user (protected)
  - Verify email
  - Refresh token

### Shuttles Routes (`src/routes/shuttles.ts`)

**Database Methods**: `db.getAllShuttles()`, `db.getShuttle()`, `db.createShuttle()`, `db.updateShuttle()`, `db.deleteShuttle()`

**Endpoints**:
- `GET /api/shuttles` - Retrieve all shuttles (public)
- `GET /api/shuttles/:id` - Retrieve single shuttle (public)
- `POST /api/shuttles` - Create shuttle (admin only)
- `PATCH /api/shuttles/:id` - Update shuttle (admin/driver)
- `DELETE /api/shuttles/:id` - Delete shuttle (admin only)
- `POST /api/shuttles/:id/location` - Update location (driver only)

**Database Table**: `shuttles` with foreign key relations

### Routes (`src/routes/routes.ts`)

**Database Methods**: `db.getAllRoutes()`, `db.getRoute()`, `db.createRoute()`, `db.updateRoute()`, `db.deleteRoute()`

**Endpoints**:
- `GET /api/routes` - Retrieve all routes (public)
- `GET /api/routes/:id` - Retrieve single route with stops
- `POST /api/routes` - Create route (admin only)
- `PATCH /api/routes/:id` - Update route (admin only)
- `DELETE /api/routes/:id` - Delete route (admin only)

**Database Tables**: `routes` with `route_stops` join table

### Stops Routes (`src/routes/stops.ts`)

**Database Methods**: `db.getAllStops()`, `db.getStop()`, `db.createStop()`, `db.updateStop()`, `db.deleteStop()`

**Endpoints**:
- `GET /api/stops` - Retrieve all stops (public)
- `GET /api/stops/:id` - Retrieve single stop
- `POST /api/stops` - Create stop (admin only)
- `PATCH /api/stops/:id` - Update stop (admin only)
- `DELETE /api/stops/:id` - Delete stop (admin only)

**Database Table**: `stops` (Trinity campus locations)

### Rides Routes (`src/routes/rides.ts`)

**Database Methods**: `db.getAllRides()`, `db.getRide()`, `db.createRide()`, `db.updateRide()`

**Endpoints**:
- `POST /api/rides/request` - Request new ride (authenticated students)
- `GET /api/rides` - Retrieve user's rides (authenticated)
- `GET /api/rides/:id` - Retrieve ride details
- `PATCH /api/rides/:id/cancel` - Cancel ride
- `PATCH /api/rides/:id/status` - Update ride status (admin/driver)

**Database Table**: `rides` with foreign keys to users, shuttles, and stops

### Drivers Routes (`src/routes/drivers.ts`)

**Database Methods**: `db.getDriver()`, `db.createDriver()`, `db.updateDriver()`, `db.getShiftsByDriver()`, `db.clockIn()`, `db.clockOut()`

**Endpoints**:
- `GET /api/drivers` - Retrieve all drivers (admin only)
- `GET /api/drivers/:id` - Retrieve driver details
- `POST /api/drivers` - Create driver (admin only)
- `PATCH /api/drivers/:id` - Update driver (admin only)
- `DELETE /api/drivers/:id` - Delete driver (admin only)
- `POST /api/drivers/:id/clock-in` - Clock in driver (start shift)
- `POST /api/drivers/:id/clock-out` - Clock out driver (end shift)
- `GET /api/drivers/:id/shifts` - Retrieve driver shifts

**Database Tables**: `drivers` with `shifts` relationship

---

## Database Service (`src/services/database.ts`)

Abstraction layer providing all CRUD operations for database entities.

#### Type Definitions
- `User` - Trinity user accounts
- `Student` - Student-specific data
- `Driver` - Driver information
- `Stop` - Shuttle stops (8 Trinity locations)
- `Route` - Shuttle routes with stops
- `Shuttle` - Vehicles with location tracking
- `Ride` - Ride requests from students
- `Shift` - Driver work shifts

### Database Operations

**User Operations**
- `getUser(userId)` - Retrieve user by ID
- `updateUser(userId, updates)` - Update user record

**Student Operations**
- `getStudent(userId)` - Retrieve student by user ID
- `createStudent(data)` - Create new student record
- `updateStudent(userId, updates)` - Update student record

**Driver Operations**
- `getDriver(userId)` - Retrieve driver by user ID
- `createDriver(data)` - Create new driver record
- `updateDriver(userId, updates)` - Update driver record
- `getShiftsByDriver(driverId)` - Retrieve all shifts for driver
- `getCurrentShift(driverId)` - Get active shift
- `clockIn(driverId, shuttleId?)` - Create clock-in entry
- `clockOut(shiftId)` - Create clock-out entry

**Stop Operations**
- `getAllStops()` - Retrieve all stops
- `getStop(stopId)` - Retrieve stop by ID
- `createStop(data)` - Create new stop
- `updateStop(stopId, updates)` - Update stop record
- `deleteStop(stopId)` - Delete stop

**Route Operations**
- `getAllRoutes()` - Retrieve all routes
- `getRoute(routeId)` - Retrieve route by ID
- `createRoute(data)` - Create new route
- `updateRoute(routeId, updates)` - Update route record
- `deleteRoute(routeId)` - Delete route

**Shuttle Operations**
- `getAllShuttles()` - Retrieve all shuttles
- `getShuttle(shuttleId)` - Retrieve shuttle by ID
- `createShuttle(data)` - Create new shuttle
- `updateShuttle(shuttleId, updates)` - Update shuttle record
- `deleteShuttle(shuttleId)` - Delete shuttle

**Ride Operations**
- `getAllRides()` - Retrieve all rides
- `getRidesByStudent(studentId)` - Retrieve rides for specific student
- `getRide(rideId)` - Retrieve ride by ID
- `createRide(data)` - Create new ride
- `updateRide(rideId, updates)` - Update ride record

---

## Authentication & Authorization

### Public Routes (no authentication required)
- `GET /api/shuttles`
- `GET /api/shuttles/:id`
- `GET /api/stops`
- `GET /api/stops/:id`
- `GET /api/routes`
- `GET /api/routes/:id`

### Protected Routes (authentication required)

**Middleware**: `authenticateToken`
- Validates JWT token
- Extracts: userId, userEmail, userRole

### Role-Based Access Control
- `requireAdmin` - Restricts to admin role
- `requireDriver` - Restricts to driver role
- `requireRole(roles)` - Custom role verification

---

## Data Models

Database schema with proper structure:

```
users (Trinity auth accounts)
├── id (UUID)
├── email (@trincoll.edu)
├── name
├── role (student/driver/admin)
└── timestamps

students
├── id
├── user_id (FK)
├── student_id
├── school
└── emergency_contact_info

drivers
├── id
├── user_id (FK)
├── license_number
├── vehicle_info
└── availability

stops (8 Trinity locations)
├── id
├── name, description
├── latitude, longitude
└── is_active

routes
├── id
├── name, description
├── distance, duration, frequency
├── is_active
└── route_stops (join table)

shuttles
├── id
├── name, vehicle_number
├── capacity, current_passengers
├── status (active/offline/maintenance)
├── current_latitude, current_longitude
├── assigned_driver_id (FK)
└── assigned_route_id (FK)

rides
├── id
├── student_id (FK)
├── shuttle_id (FK)
├── start_stop_id, end_stop_id (FKs)
├── status (requested → completed)
├── pickup/dropoff coordinates
├── timestamps
└── passenger_count

shifts
├── id
├── driver_id (FK)
├── shuttle_id (FK)
├── clock_in, clock_out
└── hours_worked
```

---

## Setup Instructions

1. **Create Database Tables** in Supabase
   ```sql
   -- Run migrations from docs/database-schema.sql
   ```

2. **Set Environment Variables**
   ```env
   SUPABASE_URL=your-url
   SUPABASE_ANON_KEY=your-key
   SUPABASE_SERVICE_ROLE_KEY=your-key
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Backend**
   ```bash
   npm run dev
   ```

5. **Seed Mock Data** (optional)
   ```bash
   npm run seed
   ```

---

## Implementation Status

- Full CRUD operations for all entities
- Real-time location tracking for shuttles
- Ride request and management system
- Driver shift tracking and management
- Route and stop management
- User authentication and authorization
- Email verification
- Role-based access control
- Error handling and logging
- Type-safe database operations
- Foreign key relationship handling

---

## Status Summary

| Component | Implementation | Database |
|-----------|-----------------|----------
| Authentication | Complete | Supabase |
| Shuttles | Complete | Supabase |
| Routes | Complete | Supabase |
| Stops | Complete | Supabase |
| Rides | Complete | Supabase |
| Drivers | Complete | Supabase |
| Database Service | Complete | Supabase |
| Middleware | Complete | N/A |

---

## Frontend Integration

The backend is ready for frontend integration:

1. Update `frontend/src/services/apiService.ts` with backend endpoints
2. Replace mock data in frontend contexts with API calls
3. Configure environment variables for backend URL
4. Test all API endpoints with real database

**Backend Configuration**: Fully configured with Supabase database


