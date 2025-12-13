# Tracking Service Testing Guide

This guide provides curl examples for testing all tracking service endpoints. Ensure the application is running on `http://localhost:8081`.

## Table of Contents

1. [Driver Endpoints](#driver-endpoints)
2. [Ride Endpoints](#ride-endpoints)
3. [Stops Endpoints](#stops-endpoints)

---

## Driver Endpoints

### 1. Create a Driver

**Endpoint:** `POST /v1/drivers`

Creates a new driver. The `id` field is optional and will be auto-generated if not provided.
All location fields and status are automatically set during creation.

```bash
curl -X POST http://localhost:8081/v1/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "id": "driver-7a74a5bd-5b66-4a1f-b736-612a4a398984",
  "name": "John Doe",
  "shuttleId": null,
  "routeId": null,
  "currentLat": null,
  "currentLng": null,
  "lastLocationUpdateAtMs": null,
  "status": "OFFLINE"
}
```

**Note:** You can optionally provide an `id` field if you want to use a specific identifier:
```bash
curl -X POST http://localhost:8081/v1/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "driver-001",
    "name": "John Doe"
  }'
```

### 2. Get All Drivers

**Endpoint:** `GET /v1/drivers`

```bash
curl -X GET http://localhost:8081/v1/drivers
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": "driver-uuid-123",
    "name": "John Doe",
    "shuttleId": "shuttle-1",
    "routeId": "route-1",
    "currentLat": null,
    "currentLng": null,
    "lastLocationUpdateAtMs": null,
    "status": "OFFLINE"
  }
]
```

### 3. Get Driver by ID

**Endpoint:** `GET /v1/drivers/{id}`

```bash
curl -X GET http://localhost:8081/v1/drivers/driver-uuid-123
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Doe",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": null,
  "currentLng": null,
  "lastLocationUpdateAtMs": null,
  "status": "OFFLINE"
}
```

### 4. Clock In Driver

**Endpoint:** `POST /v1/drivers/{id}/clock-in`

```bash
curl -X POST "http://localhost:8081/v1/drivers/driver-uuid-123/clock-in?latitude=41.2033&longitude=-72.5743&shuttleId=shuttle-1"
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Doe",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": 41.2033,
  "currentLng": -72.5743,
  "lastLocationUpdateAtMs": 1699564800000,
  "status": "ONLINE"
}
```

### 5. Clock Out Driver

**Endpoint:** `POST /v1/drivers/{id}/clock-out`

```bash
curl -X POST http://localhost:8081/v1/drivers/driver-uuid-123/clock-out
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Doe",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": null,
  "currentLng": null,
  "lastLocationUpdateAtMs": null,
  "status": "OFFLINE"
}
```

### 6. Update Driver Location

**Endpoint:** `POST /v1/drivers/{id}/update-location`

```bash
curl -X POST "http://localhost:8081/v1/drivers/driver-uuid-123/update-location?latitude=41.2050&longitude=-72.5750"
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Doe",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": 41.2050,
  "currentLng": -72.5750,
  "lastLocationUpdateAtMs": 1699564801000,
  "status": "ONLINE"
}
```

### 7. Update Driver Details

**Endpoint:** `PUT /v1/drivers/{id}`

```bash
curl -X PUT http://localhost:8081/v1/drivers/driver-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "shuttleId": "shuttle-2",
    "routeId": "route-2"
  }'
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Smith",
  "shuttleId": "shuttle-2",
  "routeId": "route-2",
  "currentLat": 41.2050,
  "currentLng": -72.5750,
  "lastLocationUpdateAtMs": 1699564801000,
  "status": "ONLINE"
}
```

### 8. Get Online Drivers

**Endpoint:** `GET /v1/drivers/status/online`

```bash
curl -X GET http://localhost:8081/v1/drivers/status/online
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": "driver-uuid-123",
    "name": "John Smith",
    "shuttleId": "shuttle-2",
    "routeId": "route-2",
    "currentLat": 41.2050,
    "currentLng": -72.5750,
    "lastLocationUpdateAtMs": 1699564801000,
    "status": "ONLINE"
  }
]
```

### 9. Get Drivers by Shuttle

**Endpoint:** `GET /v1/drivers/shuttle/{shuttleId}`

```bash
curl -X GET http://localhost:8081/v1/drivers/shuttle/shuttle-1
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": "driver-uuid-123",
    "name": "John Smith",
    "shuttleId": "shuttle-1",
    "routeId": "route-1",
    "currentLat": null,
    "currentLng": null,
    "lastLocationUpdateAtMs": null,
    "status": "OFFLINE"
  }
]
```

### 10. Get Online Drivers by Shuttle

**Endpoint:** `GET /v1/drivers/shuttle/{shuttleId}/online`

```bash
curl -X GET http://localhost:8081/v1/drivers/shuttle/shuttle-1/online
```

**Expected Response:** `200 OK`
```json
[
  {
    "id": "driver-uuid-456",
    "name": "Jane Doe",
    "shuttleId": "shuttle-1",
    "routeId": "route-1",
    "currentLat": 41.2033,
    "currentLng": -72.5743,
    "lastLocationUpdateAtMs": 1699564800000,
    "status": "ONLINE"
  }
]
```

### 11. Delete Driver

**Endpoint:** `DELETE /v1/drivers/{id}`

```bash
curl -X DELETE http://localhost:8081/v1/drivers/driver-uuid-123
```

**Expected Response:** `204 No Content`

---

## Ride Endpoints

### 1. Create Ride (Auto-Assignment)

**Endpoint:** `POST /v1/rides/create`

Creates a ride and automatically assigns an online driver for the shuttle if available.

```bash
curl -X POST http://localhost:8081/v1/rides/create \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "ride-uuid-001",
    "studentId": "student-001",
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "REQUESTED"
  }'
```

**Expected Response:** `201 Created`

If online driver available:
```json
{
  "rideId": "ride-uuid-001",
  "studentId": "student-001",
  "driverId": "driver-uuid-123",
  "shuttleId": "shuttle-1",
  "pickupLat": 41.2000,
  "pickupLng": -72.5700,
  "dropoffLat": 41.2100,
  "dropoffLng": -72.5800,
  "status": "IN_PROGRESS",
  "createdAtMs": 1699564800000,
  "updatedAtMs": 1699564800000
}
```

If no online driver available:
```json
{
  "rideId": "ride-uuid-001",
  "studentId": "student-001",
  "driverId": null,
  "shuttleId": "shuttle-1",
  "pickupLat": 41.2000,
  "pickupLng": -72.5700,
  "dropoffLat": 41.2100,
  "dropoffLng": -72.5800,
  "status": "REQUESTED",
  "createdAtMs": 1699564800000,
  "updatedAtMs": 1699564800000
}
```

### 2. Get All Rides

**Endpoint:** `GET /v1/rides`

```bash
curl -X GET http://localhost:8081/v1/rides
```

**Expected Response:** `200 OK`
```json
[
  {
    "rideId": "ride-uuid-001",
    "studentId": "student-001",
    "driverId": "driver-uuid-123",
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "IN_PROGRESS",
    "createdAtMs": 1699564800000,
    "updatedAtMs": 1699564800000
  }
]
```

### 3. Get Ride Details

**Endpoint:** `GET /v1/rides/{rideId}`

```bash
curl -X GET http://localhost:8081/v1/rides/ride-uuid-001
```

**Expected Response:** `200 OK`
```json
{
  "rideId": "ride-uuid-001",
  "studentId": "student-001",
  "driverId": "driver-uuid-123",
  "shuttleId": "shuttle-1",
  "pickupLat": 41.2000,
  "pickupLng": -72.5700,
  "dropoffLat": 41.2100,
  "dropoffLng": -72.5800,
  "status": "IN_PROGRESS",
  "createdAtMs": 1699564800000,
  "updatedAtMs": 1699564800000
}
```

### 4. Get Driver Location for Ride

**Endpoint:** `GET /v1/rides/{rideId}/driver-location-details`

Returns the full driver object with current location for a ride.

```bash
curl -X GET http://localhost:8081/v1/rides/ride-uuid-001/driver-location-details
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Smith",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": 41.2050,
  "currentLng": -72.5750,
  "lastLocationUpdateAtMs": 1699564801000,
  "status": "ONLINE"
}
```

### 5. Update Ride

**Endpoint:** `PUT /v1/rides/{rideId}`

```bash
curl -X PUT http://localhost:8081/v1/rides/ride-uuid-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Expected Response:** `200 OK`
```json
{
  "rideId": "ride-uuid-001",
  "studentId": "student-001",
  "driverId": "driver-uuid-123",
  "shuttleId": "shuttle-1",
  "pickupLat": 41.2000,
  "pickupLng": -72.5700,
  "dropoffLat": 41.2100,
  "dropoffLng": -72.5800,
  "status": "COMPLETED",
  "createdAtMs": 1699564800000,
  "updatedAtMs": 1699564810000
}
```

### 6. Update Driver Location in Ride

**Endpoint:** `PUT /v1/rides/{rideId}/update-driver-location`

```bash
curl -X PUT "http://localhost:8081/v1/rides/ride-uuid-001/update-driver-location?latitude=41.2075&longitude=-72.5760"
```

**Expected Response:** `200 OK`
```json
{
  "id": "driver-uuid-123",
  "name": "John Smith",
  "shuttleId": "shuttle-1",
  "routeId": "route-1",
  "currentLat": 41.2075,
  "currentLng": -72.5760,
  "lastLocationUpdateAtMs": 1699564812000,
  "status": "ONLINE"
}
```

### 7. Get Pending Rides

**Endpoint:** `GET /v1/rides/pending`

Returns all rides with `driverId = null` (waiting for driver assignment).

```bash
curl -X GET http://localhost:8081/v1/rides/pending
```

**Expected Response:** `200 OK`
```json
[
  {
    "rideId": "ride-uuid-002",
    "studentId": "student-002",
    "driverId": null,
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "REQUESTED",
    "createdAtMs": 1699564800000,
    "updatedAtMs": 1699564800000
  }
]
```

### 8. Get Active Rides

**Endpoint:** `GET /v1/rides/active`

Returns all rides with status `REQUESTED` or `IN_PROGRESS`.

```bash
curl -X GET http://localhost:8081/v1/rides/active
```

**Expected Response:** `200 OK`
```json
[
  {
    "rideId": "ride-uuid-001",
    "studentId": "student-001",
    "driverId": "driver-uuid-123",
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "IN_PROGRESS",
    "createdAtMs": 1699564800000,
    "updatedAtMs": 1699564800000
  }
]
```

### 9. Get Rides by Student

**Endpoint:** `GET /v1/rides/student/{studentId}`

```bash
curl -X GET http://localhost:8081/v1/rides/student/student-001
```

**Expected Response:** `200 OK`
```json
[
  {
    "rideId": "ride-uuid-001",
    "studentId": "student-001",
    "driverId": "driver-uuid-123",
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "IN_PROGRESS",
    "createdAtMs": 1699564800000,
    "updatedAtMs": 1699564800000
  }
]
```

### 10. Get Rides by Driver

**Endpoint:** `GET /v1/rides/driver/{driverId}`

```bash
curl -X GET http://localhost:8081/v1/rides/driver/driver-uuid-123
```

**Expected Response:** `200 OK`
```json
[
  {
    "rideId": "ride-uuid-001",
    "studentId": "student-001",
    "driverId": "driver-uuid-123",
    "shuttleId": "shuttle-1",
    "pickupLat": 41.2000,
    "pickupLng": -72.5700,
    "dropoffLat": 41.2100,
    "dropoffLng": -72.5800,
    "status": "IN_PROGRESS",
    "createdAtMs": 1699564800000,
    "updatedAtMs": 1699564800000
  }
]
```

---

## Stops Endpoints

### 1. Get All Stops

**Endpoint:** `GET /v1/stops`

```bash
curl -X GET http://localhost:8081/v1/stops
```

**Expected Response:** `200 OK`
```json
[
  {
    "stopId": "stop-001",
    "name": "Main Quad",
    "latitude": 41.2010,
    "longitude": -72.5740
  },
  {
    "stopId": "stop-002",
    "name": "Library",
    "latitude": 41.2030,
    "longitude": -72.5750
  }
]
```

### 2. Get Stop by ID

**Endpoint:** `GET /v1/stops/{stopId}`

```bash
curl -X GET http://localhost:8081/v1/stops/stop-001
```

**Expected Response:** `200 OK`
```json
{
  "stopId": "stop-001",
  "name": "Main Quad",
  "latitude": 41.2010,
  "longitude": -72.5740
}
```

### 3. Create Stop

**Endpoint:** `POST /v1/stops`

```bash
curl -X POST http://localhost:8081/v1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "stopId": "stop-003",
    "name": "Student Center",
    "latitude": 41.2020,
    "longitude": -72.5760
  }'
```

**Expected Response:** `201 Created`
```json
{
  "stopId": "stop-003",
  "name": "Student Center",
  "latitude": 41.2020,
  "longitude": -72.5760
}
```

### 4. Update Stop

**Endpoint:** `PUT /v1/stops/{stopId}`

```bash
curl -X PUT http://localhost:8081/v1/stops/stop-001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Quad - Updated",
    "latitude": 41.2015,
    "longitude": -72.5745
  }'
```

**Expected Response:** `200 OK`
```json
{
  "stopId": "stop-001",
  "name": "Main Quad - Updated",
  "latitude": 41.2015,
  "longitude": -72.5745
}
```

### 5. Delete Stop

**Endpoint:** `DELETE /v1/stops/{stopId}`

```bash
curl -X DELETE http://localhost:8081/v1/stops/stop-001
```

**Expected Response:** `204 No Content`

---

## Testing Workflow

### Complete Driver & Ride Workflow

1. **Create a driver:**
   ```bash
   DRIVER_ID=$(curl -s -X POST http://localhost:8081/v1/drivers \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice"}' | jq -r '.id')
   echo $DRIVER_ID
   ```

2. **Clock in the driver:**
   ```bash
   curl -X POST "http://localhost:8081/v1/drivers/$DRIVER_ID/clock-in?latitude=41.2033&longitude=-72.5743&shuttleId=shuttle-1"
   ```

3. **Create a ride (will auto-assign):**
   ```bash
   RIDE_ID=$(curl -s -X POST http://localhost:8081/v1/rides/create \
     -H "Content-Type: application/json" \
     -d '{"rideId":"ride-001","studentId":"student-001","shuttleId":"shuttle-1","pickupLat":41.2000,"pickupLng":-72.5700,"dropoffLat":41.2100,"dropoffLng":-72.5800,"status":"REQUESTED"}' | jq -r '.rideId')
   echo $RIDE_ID
   ```

4. **Get driver location for ride:**
   ```bash
   curl -X GET http://localhost:8081/v1/rides/$RIDE_ID/driver-location-details
   ```

5. **Update ride to completed:**
   ```bash
   curl -X PUT http://localhost:8081/v1/rides/$RIDE_ID \
     -H "Content-Type: application/json" \
     -d '{"status":"COMPLETED"}'
   ```

6. **Clock out driver:**
   ```bash
   curl -X POST http://localhost:8081/v1/drivers/$DRIVER_ID/clock-out
   ```

---

## Swagger UI

For interactive API testing, open your browser to:

```
http://localhost:8081/swagger-ui.html
```

This provides an interactive interface to test all endpoints with automatic request/response documentation.
