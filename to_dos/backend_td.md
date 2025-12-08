# Backend TODO

## High Priority

### 1. Complete Database Service (`src/services/database.ts`)
- [x] Set up Supabase connection with connection pooling
- [x] Implement database query methods for all entities:
  - [x] Users (create, read, update, delete, authenticate)
  - [x] Shuttles (CRUD operations)
  - [x] Routes (CRUD operations)
  - [x] Stops (CRUD operations)
  - [x] Rides (create, read, update status, cancel)
  - [x] Drivers (CRUD operations)
- [x] Add error handling & retry logic
- [x] Create database migration script
- [x] Create database setup guide with SQL schema
- [x] Create database test utility

### 2. Implement Authentication Flow (`src/routes/auth.ts` + `src/middleware/auth.ts`)
- [ ] Complete register endpoint with email validation (@trincoll.edu)
- [ ] Implement JWT token generation & refresh logic
- [ ] Add password hashing (bcrypt)
- [ ] Complete login endpoint with validation
- [ ] Implement logout endpoint
- [ ] Add email verification workflow
- [ ] Complete JWT verification middleware

### 3. Implement Ride Assignment Logic (`src/routes/rides.ts`)
- [ ] Build shuttle matching algorithm:
  - [ ] Find available shuttles within campus area
  - [ ] Calculate distance from shuttle to pickup location
  - [ ] Check shuttle capacity
  - [ ] Prioritize shuttles on compatible routes
- [ ] Add estimated time calculations
- [ ] Handle no-shuttle-available scenarios
- [ ] Implement ride assignment notification to driver

### 4. Implement Ride Status State Machine (`src/routes/rides.ts`)
- [ ] Define state transitions: requested → accepted → in-progress → completed/cancelled
- [ ] Add driver acceptance/rejection logic
- [ ] Implement ride pickup event
- [ ] Implement ride completion event
- [ ] Add cancellation workflow with reason tracking
- [ ] Emit Socket.IO events for status changes

### 5. Wire Backend ↔ Tracking Service Communication
- [ ] Implement POST request to Tracking Service when ride starts (`/v1/rides/{rideId}/start`)
- [ ] Implement POST request when ride ends (`/v1/rides/{rideId}/end`)
- [ ] Add health check endpoint for Tracking Service verification
- [ ] Handle errors if Tracking Service is unavailable

## Medium Priority

### 6. Complete Error Handler Middleware (`src/middleware/errorHandler.ts`)
- [ ] Standardize error response format
- [ ] Map HTTP status codes appropriately
- [ ] Add request logging
- [ ] Implement error tracking/reporting

### 7. Input Validation with Zod
- [ ] Apply Zod schemas to all route handlers
- [ ] Create centralized validation middleware
- [ ] Add custom error messages for validation failures
- [ ] Test validation on edge cases

### 8. Add Comprehensive Tests (`tests/` folder)
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Unit tests for all route handlers
- [ ] Integration tests with Supabase
- [ ] E2E tests for ride request flow
- [ ] Mock Socket.IO events in tests

### 9. Implement Role-Based Access Control (RBAC)
- [ ] Define user roles: student, driver, admin
- [ ] Add role validation middleware
- [ ] Restrict endpoints based on user roles
- [ ] Add permission checks for sensitive operations

### 10. Socket.IO Event Broadcasting
- [ ] Complete shuttle location update events
- [ ] Implement driver status update events
- [ ] Add ride status change broadcasts
- [ ] Handle Socket.IO connection/disconnection

## Low Priority

### 11. Add Structured Logging (Winston/Pino)
- [ ] Set up logging framework
- [ ] Add contextual logging to all routes
- [ ] Implement log levels (debug, info, warn, error)

### 12. Implement Request Rate Limiting
- [ ] Add rate limiting middleware
- [ ] Define rate limits per endpoint
- [ ] Return 429 Too Many Requests on limit exceeded

### 13. Add API Documentation (OpenAPI/Swagger)
- [ ] Generate OpenAPI specification
- [ ] Add route descriptions & examples
- [ ] Document request/response schemas

### 14. Performance Optimization
- [ ] Add caching for frequently accessed data (shuttles, routes, stops)
- [ ] Implement database query optimization
- [ ] Add indexes for common queries

### 15. Environment Configuration
- [ ] Complete .env.example with all required variables
- [ ] Add environment-specific configs (dev, staging, production)
- [ ] Implement config validation on startup
