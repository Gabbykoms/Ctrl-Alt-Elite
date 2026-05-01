# API Endpoints

Complete API endpoint reference for the Tracking Service.

---

## Driver Management - `/v1/drivers`

### Create Driver
```http
POST /v1/drivers
Content-Type: application/json

{
  "id": "driver-001",
  "name": "John Doe"
}
```
**Response (201):** Driver created with status `OFFLINE`, location fields empty

---

### Clock In (Start Shift)
```http
POST /v1/drivers/{id}/clock-in?latitude=41.7465&longitude=-72.6928&shuttleId=shuttle-A
```
**Response (200):** Driver status set to `ONLINE` with current location recorded

---

### Clock Out (End Shift)
```http
POST /v1/drivers/{id}/clock-out
```
**Response (200):** Driver status set to `OFFLINE`, all location data cleared

---

### Update Location
```http
POST /v1/drivers/{id}/update-location?latitude=41.7500&longitude=-72.6950
```
**Response (200):** Updates driver position and timestamp

---

### Update Driver Info
```http
PUT /v1/drivers/{id}
Content-Type: application/json

{
  "name": "John Updated",
  "shuttleId": "shuttle-B",
  "routeId": "route-2"
}
```
**Response (200):** Updates name, shuttle, and route assignments

---

### Get All Drivers
```http
GET /v1/drivers
```
**Response (200):** Array of all drivers

---

### Get Specific Driver
```http
GET /v1/drivers/{id}
```
**Response (200):** Single driver details | (404) Driver not found

---

### Get Online Drivers
```http
GET /v1/drivers/status/online
```
**Response (200):** All drivers with status `ONLINE`

---

### Get Drivers by Shuttle
```http
GET /v1/drivers/shuttle/{shuttleId}
```
**Response (200):** All drivers assigned to shuttle

---

### Get Online Drivers for Shuttle
```http
GET /v1/drivers/shuttle/{shuttleId}/online
```
**Response (200):** Online drivers assigned to shuttle (used for auto-assignment)

---

### Delete Driver
```http
DELETE /v1/drivers/{id}
```
**Response (204):** Driver removed from database

---

## Driver Shift Reports - `/v1/shifts`

Manages driver shift reports. A driver clocks in at the start of a shift and clocks out at the end. `driver_name` is always provided by the client for now (see long-term plan for server-side lookup). `driver_id` references the `drivers` table.

### Clock In
```http
POST /v1/shifts/clock-in
Content-Type: application/json

{
  "driver_id": "d22fcfa1-ffdd-4422-af5b-3408467136a4",
  "driver_name": "John Doe",
  "radio_number": "R-01",
  "vehicle_license": "CT-BANTAM-1",
  "starting_mileage": 12000,
  "condition_notes": "Vehicle in good condition"
}
```
**Required:** `driver_id`, `driver_name`, `starting_mileage`
**Optional:** `radio_number`, `vehicle_license`, `condition_notes`

**Response (201):** Shift report created with `status: IN_PROGRESS`, `clock_in_time` set, `ending_mileage: null`, `clock_out_time: null`

**Response (409):** Driver already has an open shift

**Response (400):** Missing required field

---

### Clock Out
```http
POST /v1/shifts/clock-out
Content-Type: application/json

{
  "driver_id": "d22fcfa1-ffdd-4422-af5b-3408467136a4",
  "ending_mileage": 12450,
  "condition_notes": "Minor wear on front left tyre"
}
```
**Required:** `driver_id`, `ending_mileage`
**Optional:** `condition_notes`

**Response (200):** Shift updated with `status: COMPLETED`, `clock_out_time` set, `ending_mileage` recorded

**Response (400):** No open shift found, missing `ending_mileage`, or `ending_mileage < starting_mileage`

---

### Get Shift History for Driver
```http
GET /v1/shifts/driver/{driverId}
```
**Response (200):**
```json
{
  "shifts": [...],
  "total": 2,
  "driver_id": "d22fcfa1-ffdd-4422-af5b-3408467136a4"
}
```
Ordered by `clock_in_time` descending (most recent first)

---

## Ride Management - `/v1/rides`

### Create Ride (Auto-Assign Driver)
```http
POST /v1/rides/create
Content-Type: application/json

{
  "rideId": "ride-001",
  "studentId": "student-john",
  "shuttleId": "shuttle-A",
  "pickupLat": 41.7460,
  "pickupLng": -72.6928,
  "dropoffLat": 41.7480,
  "dropoffLng": -72.6920
}
```
**Response (201):**
- If online driver exists: `status: "IN_PROGRESS"`, `driverId` set
- If no online driver: `status: "REQUESTED"`, `driverId: null`

---

### Get All Rides
```http
GET /v1/rides
```
**Response (200):** Array of all rides

---

### Get Ride Details
```http
GET /v1/rides/{rideId}/details
```
**Response (200):** Single ride details

---

### Update Ride Status
```http
PUT /v1/rides/{rideId}
Content-Type: application/json

{
  "status": "COMPLETED",
  "completedAtMs": 1765232900000
}
```
**Response (200):** Ride status updated

---

### Get Driver Location for Ride
```http
GET /v1/rides/{rideId}/driver-location-details
```
**Response (200):** Driver with current location | (404) Ride or driver not found

---

### Query Pending Rides
```http
GET /v1/rides/query/pending
```
**Response (200):** All rides waiting for driver assignment

---

### Query Active Rides
```http
GET /v1/rides/query/active
```
**Response (200):** All rides in progress

---

### Get Rides by Student
```http
GET /v1/rides/student/{studentId}/active
```
**Response (200):** Active rides for student

---

### Get Rides by Driver
```http
GET /v1/rides/driver/{driverId}/assigned
```
**Response (200):** All rides assigned to driver

---

## Stop Management - `/v1/stops`

### Get All Stops
```http
GET /v1/stops
```
**Response (200):** Array of Trinity College shuttle stops

---

### Get Stop by ID
```http
GET /v1/stops/{stopId}
```
**Response (200):** Single stop details

---

### Create Stop
```http
POST /v1/stops
Content-Type: application/json

{
  "stopId": "stop-001",
  "name": "Stop Name",
  "latitude": 41.7465,
  "longitude": -72.6928,
  "description": "Optional description"
}
```
**Required:** `stopId`, `name`, `latitude`, `longitude`
**Optional:** `description`

**Response (201):** Stop created

---

### Update Stop
```http
PUT /v1/stops/{stopId}
Content-Type: application/json

{
  "name": "Updated Name",
  "latitude": 41.7465,
  "longitude": -72.6928
}
```
**Response (200):** Stop updated

---

### Delete Stop (Soft Delete)
```http
DELETE /v1/stops/{stopId}
```
**Response (200):** Stop soft-deleted (`is_active` set to `false`, still retrievable by ID)

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 404 | Not found |
| 400 | Bad request |
| 500 | Server error |

---

## Interactive Testing

For hands-on testing with Swagger UI:

**Access:** `http://localhost:8081/swagger-ui.html`

All endpoints are documented with interactive try-it-out functionality.

---

## Testing with curl

For comprehensive curl examples for all endpoints, see **[TESTING.md](./TESTING.md)**.

Examples include:
- Complete workflows (create driver → clock in → create ride → complete)
- Debugging queries
- Performance testing
- Error scenarios
