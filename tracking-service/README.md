# tracking-service (template)

A minimal, production-lean template for a driver location tracking microservice using Spring Boot (Java 21), Gradle Kotlin DSL, RabbitMQ for ingest & fan-out, optional Redis/Postgres hooks, SSE for realtime to browsers, plus Docker and Kubernetes manifests. Uses clean boundaries so you can swap persistence later.

## Features

REST ingest endpoint (POST /v1/locations:single) and optional WebSocket/SSE fan-out (/sse/geo).

RabbitMQ topic exchange (geo.location.v1) with publisher confirms; queues for latest and push.

Pluggable storage via LocationSink interface (no DB hard‑wired).

Minimal tests and health endpoints.

Dockerfile, docker-compose (RabbitMQ), and K8s (Deployment/Service/ConfigMap).

Docs: C4-ish architecture + sequence (Mermaid), API docs, runbook.

## Project layout

```
tracking-service/
├─ build.gradle.kts
├─ settings.gradle.kts
├─ gradle.properties
├─ docker-compose.yml
├─ Dockerfile
├─ k8s/
│  ├─ configmap.yml
│  ├─ deployment.yml
│  └─ service.yml
├─ src/
│  ├─ main/
│  │  ├─ java/com/example/tracking/
│  │  │  ├─ TrackingServiceApplication.java
│  │  │  ├─ api/IngestController.java
│  │  │  ├─ api/GeoSseController.java
│  │  │  ├─ config/RabbitConfig.java
│  │  │  ├─ messaging/GeoPublisher.java
│  │  │  ├─ messaging/LatestConsumer.java
│  │  │  ├─ model/GeoPoint.java
│  │  │  └─ service/LocationSink.java
│  │  └─ resources/
│  │     └─ application.yml
│  └─ test/
│     └─ java/com/example/tracking/TrackingServiceApplicationTests.java
└─ README.md
```

# Architecture (Mermaid)

```
flowchart LR
A[Driver React App] -- HTTP/WS --> B[Ingest Controller]
B --> C[RabbitMQ Exchange geo.location.v1]
C --> D[Queue geo.proc.latest]
C --> E[Queue geo.push.live]
D --> F[LatestConsumer -> LocationSink (Redis/DB)]
E --> G[GeoSseController -> SSE]
G --> H[Admin/Student Browser]

sequenceDiagram
  participant Driver as Driver App
  participant API as Ingest API
  participant MQ as RabbitMQ
  participant Latest as LatestConsumer
  participant SSE as SSE Gateway
  Driver->>API: POST /v1/locations:single {GeoPoint}
  API->>MQ: publish GeoPoint (topic rk)
  MQ->>Latest: deliver to geo.proc.latest
  Latest->>Latest: dedupe, upsert latest, (append history)
  MQ->>SSE: deliver to geo.push.live
  SSE-->>Viewer: event: GeoPoint (1Hz)
```

## Notes & TODOs

- Add dedupe/out-of-order windows (by seq/tsEventMs).

- Implement LocationSink (Redis GEO + hash, or Postgres+PostGIS).

- Consider consistent-hash exchange if sharding by deviceId.

- Add OpenAPI via springdoc-openapi-starter-webmvc-ui for docs.

- Add security (JWT on ingest), CORS, and rate limits.

## Missing pieces you might want

- Redis/Postgres implementations of LocationSink.

- WebSocket STOMP gateway (instead of SSE) if you need client → server messages.

- Downsampling jobs + retention policy.

- CI/CD (GitHub Actions) and Helm chart.

# References (see main chat for links)

- RabbitMQ confirms, Spring AMQP, WebFlux SSE, PostGIS/Timescale, Geolocation API.
