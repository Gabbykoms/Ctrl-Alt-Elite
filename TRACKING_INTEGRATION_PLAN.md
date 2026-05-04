# Tracking Service → Frontend Integration Plan

## Current State Summary

### Tracking Service (Spring Boot, port 8081) — What's Active vs Commented Out

**ACTIVE (working endpoints):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/stops` | GET | Get all active stops → `{stops, total, timestamp}` |
| `/v1/stops/{stopId}` | GET | Get single stop |
| `/v1/stops` | POST | Create stop (requires `stopId`, `name`, `latitude`, `longitude`) |
| `/v1/stops/{stopId}` | PUT | Update stop |
| `/v1/stops/{stopId}` | DELETE | Soft-delete stop |
| `/v1/shifts/clock-in` | POST | Clock in driver → body: `{driver_id, driver_name, starting_mileage, radio_number?, vehicle_license?, condition_notes?}` |
| `/v1/shifts/clock-out` | POST | Clock out driver → body: `{driver_id, ending_mileage, condition_notes?}` |
| `/v1/shifts/driver/{driverId}` | GET | Get shifts for a driver → `{shifts, total, driver_id}` |

**COMMENTED OUT (not available):**
- `GET /v1/locations/latest/org/{org}` — bus location query
- `POST /v1/locations:single` — GPS ingest from buses
- `GET /sse/geo` — Server-Sent Events stream
- All `/v1/rides/` endpoints — ride tracking
- All `/v1/drivers/` endpoints — driver CRUD in tracking service

---

## Problems Found (Gaps Between Frontend and Backend)

### 1. URL Mismatches — Shift Reports (apiService.ts)

The frontend calls URLs that don't exist in the tracking service:

| Frontend calls | Actual endpoint | Status |
|---------------|----------------|--------|
| `POST /v1/driver-shift-reports/start` | `POST /v1/shifts/clock-in` | BROKEN |
| `PATCH /v1/driver-shift-reports/{id}/end` | `POST /v1/shifts/clock-out` | BROKEN |
| `GET /v1/driver-shift-reports/driver/{driverId}` | `GET /v1/shifts/driver/{driverId}` | BROKEN |

**Extra payload mismatch on clock-out:**
- Frontend sends the report `id` in the URL path
- Backend's `/v1/shifts/clock-out` takes `driver_id` in the request body — no `id` needed

### 2. Missing `stopId` Field on Create Stop

`trackingAPI.createStop()` sends `{ name, latitude, longitude }` but the backend requires a `stopId` field too. Every create call currently fails with a 400 error.

**Decision:** Generate the `stopId` on the frontend from the stop name as a kebab-case slug, e.g. `"Mather Hall"` → `"mather-hall"`. The tracking service will not be touched for this. Since the `id` column is a primary key (unique constraint), we must guard against duplicate names client-side before sending.

### 3. Location Endpoints Are Commented Out

Both `DriverDashboard` and `AdminDashboard` poll `GET /v1/locations/latest/org/trinity` every 5 seconds to show live bus positions. This endpoint is commented out — no bus markers ever appear on the map.

Driver geolocation sending also calls `POST /v1/rides/{rideId}/start` (via `trackingAPI.startRideTracking`) — also commented out.

### 4. "Clock In/Out" Button Is Disconnected from the Shift Report API

The big green/red "Clock In / Clock Out" toggle button in `DriverDashboard` only flips a local boolean `isClockedIn`. It has no connection to `handleStartShiftReport` or `handleEndShiftReport`. Drivers have to manually use the separate "Start Shift Report" / "End Shift Report" buttons in the form below.

### 5. Driver "My Shifts" Tab Uses Mock Data

`DriverDashboard` line 87: `const shifts = getDriverShifts(user.id)` — this reads from `mockShifts.ts` (hardcoded fake data). Should read from `GET /v1/shifts/driver/{driverId}`.

### 6. Admin "Shifts" Tab Uses Mock Data

`AdminDashboard` line 501: `<AdminShiftsView shifts={mockShifts} />` — same problem. Real shifts from the tracking service are never shown to the admin.

Additionally, there's **no endpoint to get all drivers' shifts at once** in the tracking service. Only per-driver lookups exist (`GET /v1/shifts/driver/{driverId}`). For admin view we need a new endpoint.

---

## Integration Plan

### Phase 1 — Fix URL Mismatches in apiService.ts
**Scope: Frontend only. No backend changes. Highest priority — nothing else works until this is fixed.**

- [ ] Change `startDriverShiftReport` URL from `/v1/driver-shift-reports/start` → `/v1/shifts/clock-in`
- [ ] Change `endDriverShiftReport` from `PATCH /v1/driver-shift-reports/{id}/end` → `POST /v1/shifts/clock-out`
  - Remove `id` from the URL, send `driver_id` in the body instead
  - Update `EndDriverShiftReportPayload` interface to include `driver_id`
  - Update `DriverDashboard.handleEndShiftReport()` to pass `user.id` in payload
- [ ] Change `getDriverShiftReportsByDriver` URL to `/v1/shifts/driver/{driverId}`
  - Response is now `{shifts, total, driver_id}` — unwrap the `shifts` array when loading open reports

---

### Phase 2 — Fix Stop Creation (Missing stopId)
**Scope: Frontend only. No tracking service changes.**

- [ ] In `AdminDashboard.handleAddStop()`, generate `stopId` from the stop name using a kebab-case slug:
  ```ts
  const stopId = stopName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  ```
- [ ] Before calling the API, check if a stop with the same slug already exists in the local `stops` state array — if so, show an error and abort (prevents a unique constraint violation on the DB)
- [ ] Pass `stopId` in the `createStop` payload alongside `name`, `latitude`, `longitude`
- [ ] Verify create/delete flow end-to-end

---

### Phase 3 — Wire Up Clock In/Out Button to Shift Report
**Scope: Frontend only. UX quality fix.**

Currently drivers need to:
1. Fill in the shift report form
2. Click "Start Shift Report"
3. Separately click the "Clock In" toggle (purely cosmetic)

These should be unified:

- [ ] "Clock In" button click → runs `handleStartShiftReport()` → on success, set `isClockedIn = true`
- [ ] "Clock Out" button click → runs `handleEndShiftReport()` → on success, set `isClockedIn = false`
- [ ] On page load, if there's an open shift report, set `isClockedIn = true` and populate form (most of this already works, just needs the button wired)
- [ ] Keep the shift form visible but disable it while not clocked in (or hide it until Clock In is pressed)

---

### Phase 4 — Replace Driver "My Shifts" Mock Data with Real Data
**Scope: Frontend only.**

- [ ] Remove `getDriverShifts(user.id)` from mock data import
- [ ] Load real shifts via `trackingAPI.getDriverShiftReportsByDriver(user.id)` (response: `{shifts}`)
- [ ] Adapt `ShiftsList` component or create a new component — real `DriverShiftReport` has different fields than mock `Shift`:
  - Real: `reportDate, radioNumber, driverName, vehicleLicense, startingMileage, endingMileage, conditionNotes, status, clockInTime, clockOutTime`
  - Mock: `shiftDate, startTime, endTime, vehicle, route, passengers, notes, status`
  - Fields like `route` and `passengers` don't exist in real data yet
- [ ] Show "In Progress" badge for shifts with no `endingMileage`

---

### Phase 5 — Replace Admin "Shifts" Mock Data with Real Data
**Scope: Backend + Frontend.**

The tracking service has no "get all shifts" endpoint. Need to add one.

**Backend (tracking service):**
- [ ] Add `GET /v1/shifts` endpoint in `DriverShiftReportController` that returns all shift reports, optionally filtered by `?status=` and `?date=`
- [ ] Add corresponding repository method `findAllOrderByClockInTimeDesc()`

**Frontend:**
- [ ] In `AdminDashboard`, replace `mockShifts` with a call to `GET /v1/shifts` (new endpoint above)
- [ ] Wire `AdminShiftsView` to use real data — adapt the component to work with `DriverShiftReport` type

---

### Phase 6 — GPS Location Tracking
**Scope: Backend + Frontend. Most complex, needs backend work first.**

This phase makes the live map actually show moving buses.

**Backend (tracking service) — uncomment and wire up:**
- [ ] Uncomment `IngestController` (`POST /v1/locations:single`) — receives GPS pings from buses
- [ ] Uncomment `LocationQueryController` (`GET /v1/locations/latest/org/{org}`) — returns latest location per device
- [ ] Decide on location store: `InMemoryLocationSink` (already exists) vs Redis (RedisLocationSink also exists but needs Redis running)
- [ ] Wire up `LocationSink` bean properly so ingest and query use the same store
- [ ] Test round-trip: POST a GeoPoint → GET it back via org query

**Frontend — Driver location sending:**
- [ ] Replace `trackingAPI.startRideTracking()` (commented out ride endpoint) with a direct call to `POST /v1/locations:single`
- [ ] Send GeoPoint payload: `{org: "trinity", deviceId: user.id, latMicro, lonMicro, tsEventMs, ...}`
- [ ] Continue sending every 5 seconds while clocked in (existing `watchPosition` interval can stay)

**Frontend — Live map bus display:**
- [ ] `GET /v1/locations/latest/org/trinity` polling already exists in both dashboards — it just needs the backend endpoint uncommented
- [ ] No frontend changes needed beyond the ingest change above

---

## Summary Table

| Phase | What | Backend work? | Frontend work? | Priority |
|-------|------|:---:|:---:|:---:|
| 1 | Fix shift API URLs in apiService.ts | — | Yes | Critical |
| 2 | Fix missing stopId on create stop | — | Yes | High |
| 3 | Wire Clock In/Out button to shift API | — | Yes | High |
| 4 | Driver shifts: real data instead of mock | — | Yes | Medium |
| 5 | Admin shifts: real data + new endpoint | Yes | Yes | Medium |
| 6 | GPS location tracking (live map buses) | Yes | Yes | Medium |

Phases 1–3 are pure frontend and unblock everything. Phase 6 is the most effort but also the most visible feature.

---

## After the Demo

### Move stopId generation to the tracking service

Currently the frontend generates `stopId` as a kebab-case slug from the stop name (e.g. `"Mather Hall"` → `"mather-hall"`) and sends it to the backend. This was a demo shortcut to avoid touching the tracking service.

The proper fix: remove the `stopId` field from the `POST /v1/stops` request body entirely and have the tracking service auto-generate a UUID inside `StopStore.createStop()`. The frontend payload is then just `{ name, latitude, longitude, description? }` — which is what `trackingAPI.createStop()` already sends today.
