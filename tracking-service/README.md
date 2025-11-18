# 🚍 Tracking Service

Real-time GPS ingestion and location distribution service for the campus shuttle system.

This service receives GPS updates from a **driver user**, stores the **latest location** of each bus, and exposes endpoints for **students**, **admins**, and **drivers** to read the current bus positions via REST or live SSE streams.

---

## ✨ Features

* **Driver GPS ingestion** via REST
* **Latest location storage** (in-memory sink)
* **Real-time updates** via SSE (`/sse/geo`)
* **REST endpoints** to fetch live bus locations
* **Swagger UI** for testing and documentation
* **Framework**: Spring Boot 3.3 + WebFlux

---

## 📦 Project Structure

```
src/main/java/com/javashams/tracking/
  api/
    IngestController.java         -- driver POST endpoint
    LocationQueryController.java  -- read latest bus locations
    GeoSseController.java         -- real-time Server Sent Events stream
  model/
    GeoPoint.java                 -- GPS event record
  services/
    LocationSink.java             -- abstraction for storing latest
    InMemoryLocationSink.java     -- in-memory implementation
```

---

# 🚀 How It Works

## 1️⃣ Driver sends GPS → `POST /v1/locations:single`

The driver UI periodically sends a `GeoPoint` representing the bus location.

Example payload:

```json
{
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
}
```

The service:

* Stores it as the **latest** location for `(org, deviceId)`
* Pushes it to **SSE real-time stream**
* Returns `202 Accepted`

---

## 2️⃣ Consumers read latest bus location(s)

### ➤ **GET /v1/locations/latest?org=trinity&deviceId=bus-1**

Returns the most recent location for a single bus.

### ➤ **GET /v1/locations/latest/org/trinity**

Returns latest positions of **all** buses in the org.

Great for:

* Admin dashboards
* Rider map views
* Driver back-office UI

---

## 3️⃣ Real-time stream (SSE)

### ➤ **GET /sse/geo?org=trinity**

Subscribes to Server-Sent Events of all location updates in the given org.

Test with:

```bash
curl -N "http://localhost:8080/sse/geo?org=trinity"
```

Each driver GPS update appears instantly in the stream.

---

# 📘 API Documentation (Swagger)

Swagger UI is available at:

```
http://localhost:8080/swagger-ui.html
```

You can:

* Test all endpoints interactively
* Inspect schemas (`GeoPoint`)
* Generate client code

---

# 🧩 GeoPoint (data model)

| Field                 | Meaning                                     |
| --------------------- | ------------------------------------------- |
| **org**               | Organization namespace (`trinity`)          |
| **deviceId**          | Bus/device ID (`bus-1`)                     |
| **tripId**            | Logical trip identifier                     |
| **tsEventMs**         | When GPS was recorded on device             |
| **tsServerMs**        | When server received it (set automatically) |
| **latMicro/lonMicro** | Latitude/longitude in microdegrees          |
| **accM**              | Accuracy in meters                          |
| **spdMps**            | Speed in m/s                                |
| **brgDeg**            | Bearing in degrees                          |
| **seq**               | Sequence number for ordering                |
| **idempotency**       | Unique event ID (for dedupe)                |

---

# 🏗️ Running the Service

```bash
./gradlew bootRun
```

The application starts on:

```
http://localhost:8080
```

---

# 🔜 Future Extensions

This service is designed to integrate with:

* RabbitMQ / Kafka (for event fan-out)
* Redis or Postgres for persistent storage
* ETA computation services
* Admin analytics dashboards

The current in-memory version is ideal for local development and early frontend integration.
