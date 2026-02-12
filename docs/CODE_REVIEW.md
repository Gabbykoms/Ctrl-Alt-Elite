# Bantam Shuttle - Comprehensive Code Review

**Date:** 2026-02-12
**Scope:** Full-stack microservices application (React frontend, Node.js backend, Spring Boot tracking service, Python/FastAPI AI service, CI/CD and deployment)

---

## Executive Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 8 | 9 | 12 | 3 |
| Error Handling | 2 | 4 | 6 | 2 |
| Code Quality | 1 | 3 | 8 | 7 |
| Performance | 1 | 2 | 4 | 3 |
| DevOps/Deployment | 4 | 4 | 6 | 3 |

---

## CRITICAL Issues (Fix Immediately)

### 1. Hardcoded Secrets Committed to Git

Kubernetes secret files contain **plaintext credentials** checked into version control:

- `AI_Intergration_Service/kubernetes/secret.yaml` — Supabase connection strings, OpenAI API key, database passwords
- `tracking-service/kubernetes/secrets.yaml` — Database username/password in plaintext
- `.github/workflows/frontend-ci-cd.yml:59,108` — Mapbox token hardcoded in workflow

**Action:** Rotate all exposed credentials immediately. Use Sealed Secrets or an external secrets manager. Add secret files to `.gitignore`.

### 2. Test Mode Backdoor in Production

`frontend/src/contexts/AuthContext.tsx:27-71` — Anyone can bypass authentication by visiting `?testMode=true&role=admin`:

```typescript
const testMode = new URLSearchParams(window.location.search).get('testMode') === 'true'
const testRole = new URLSearchParams(window.location.search).get('role') || 'driver'
```

**Action:** Remove entirely or gate behind `import.meta.env.DEV`.

### 3. No Authentication on Tracking Service or AI Service

Both the Spring Boot tracking service and the Python AI service have **zero authentication** on all endpoints. Anyone can:
- Create/delete stops and drivers
- Ingest fake GPS data
- Consume OpenAI API credits via the chat endpoint
- Delete knowledge base documents

### 4. Unauthenticated WebSocket Connections

`backend/src/server.ts:80-109` — Socket.IO accepts any connection and broadcasts events without validation. An attacker can emit fake `shuttle-location-update` events to all connected clients.

### 5. CORS Wildcard with Credentials

`AI_Intergration_Service/app/main.py:26-32`:
```python
allow_origins=["*"],
allow_credentials=True,
```
This combination is a major security violation. Similarly, Kubernetes ingress configs use `cors-allow-origin: "*"`.

---

## HIGH Priority Issues

### Security

| Issue | Location |
|-------|----------|
| Service role key prefix logged to console | `backend/src/routes/auth.ts:24` |
| No rate limiting on any service | All backend/AI/tracking endpoints |
| No input size limits on Express body parser | `backend/src/server.ts:43-44` |
| SSL redirect disabled in production ingress | `frontend/kubernetes/ingress.yaml:11` |
| Missing security contexts in K8s deployments | AI, tracking, frontend deployments |
| Error messages leak implementation details | `backend/src/routes/auth.ts:176-180`, AI service routes |
| Any driver can update any ride status | `backend/src/routes/rides.ts:261-294` |
| Spring Boot Actuator exposed publicly | `frontend/kubernetes/ingress.yaml:129-135` |
| OpenAI health check consumes API credits | `AI_Intergration_Service/app/api/routes/health.py:47-72` |

### Code Quality

| Issue | Location |
|-------|----------|
| Mixed axios + fetch in same API service | `frontend/src/services/apiService.ts` (axios lines 1-157, fetch lines 161-238) |
| Race condition in ride auto-assignment | `backend/src/routes/rides.ts:75-92` and `tracking-service RideTrackingController:143-156` |
| `@ConditionalOnProperty` references wrong property name | `tracking-service RedisLocationSink.java:22` — uses `spring.redis.host` instead of `spring.data.redis.host`, so Redis sink never activates |
| ConcurrentHashMaps grow unbounded (memory leak) | `tracking-service RideTrackingService.java:22-42` |

---

## MEDIUM Priority Issues

### Frontend
- **Token storage in localStorage** — vulnerable to XSS. Consider httpOnly cookies.
- **Excessive polling** — 3 dashboards + LiveMap all poll the tracking service every 5s independently. Consolidate into a single data source or use WebSockets.
- **Heavy use of `any` type** — AuthContext, ShuttleContext, apiService all bypass TypeScript safety.
- **Duplicate shuttle-loading logic** across AdminDashboard, StudentDashboard, DriverDashboard. Extract to a shared hook.
- **No React Error Boundaries** — unhandled component errors crash the whole app.
- **No code splitting** — all routes loaded eagerly.
- **Magic numbers** — `5000` (polling interval), `41.746` (coordinates) scattered throughout.

### Backend
- **Random ETA generation in production** — `rides.ts:67-68`: `Math.floor(Math.random() * 8) + 3` minutes. This is a placeholder that shouldn't be in production.
- **No security headers** — Missing Helmet.js (X-Frame-Options, CSP, HSTS).
- **No API versioning** — routes use `/api/` without version prefix.
- **Shallow health check** — `server.ts:57-63` returns OK without checking database connectivity.
- **37 lines of commented-out code** at top of `stops.ts`.

### Tracking Service
- **No coordinate validation** — latitude/longitude values aren't bounds-checked anywhere.
- **No pagination** on any list endpoint (drivers, rides, stops).
- **Dead code** — entire files commented out: `GeoPublisher.java`, `LatestConsumer.java`, `RabbitConfig.java`.
- **Hardcoded Redis password in comment** — `application.yaml:35`.
- **Inconsistent REST conventions** — `/v1/locations:single` uses Google Cloud API style.

### AI Service
- **Directory name typo** — `AI_Intergration_Service` (should be `Integration`).
- **Chat history saved but never retrieved** — `rag_service.py:233-258` saves messages but subsequent queries don't include conversation context. Multi-turn conversations don't work.
- **No max length on document content** — `schemas/document.py:9` has `min_length=10` but no `max_length`, allowing massive documents.
- **Environment variable naming mismatch** — config.py uses `AI_*` prefix but docker-compose uses unprefixed names.
- **Missing `pool_recycle`** in database engine config — connections will go stale with cloud databases.

### DevOps
- **Test failures don't block deployment** — `ai-service-ci-cd.yml:51`: `pytest ... || echo "Some tests failed, continuing..."`, `ci.yml:42`: `continue-on-error: true`.
- **Security scanning only in one workflow** — `ci.yml` has Trivy, but the 4 service-specific workflows don't.
- **Duplicate CI workflows** — `ci.yml` and `backend-ci-cd.yml` both trigger on backend changes and build Docker images (to different registries).
- **No NetworkPolicies** — all pods can communicate with all pods.
- **Namespace mismatch** — K8s manifests use `elite-dev`, deployment scripts reference `bantam-shuttle` and `trinity`.
- **No rollback strategy** — workflows deploy but don't smoke-test or auto-rollback on failure.

---

## Positive Observations

The codebase has solid foundations:

- Well-organized microservices architecture with clear separation of concerns
- Good use of TypeScript in frontend and backend
- Proper use of Zod for request validation in the backend auth routes
- Backend Dockerfile uses multi-stage builds with non-root user
- SQL queries in the AI service use parameterized queries (no SQL injection)
- Redis caching for high-frequency location data is a good architectural choice
- Comprehensive documentation across all services
- HPA configured for backend auto-scaling

---

## Architectural Note

This project demonstrates a common pattern in team projects — the individual services are well-structured internally, but the **cross-cutting concerns** (auth, CORS, rate limiting, observability) aren't consistently applied across all four services. In production microservices, these are typically handled at the API gateway layer (e.g., Kong, Envoy) rather than implemented service-by-service. Adding a gateway in front of these services would address many of the security findings in one place.

---

## Recommended Action Plan

### Week 1 (Critical Security)
1. Rotate all exposed secrets, move to external secret management
2. Remove test mode backdoor
3. Add authentication to tracking and AI services (or add an API gateway)
4. Authenticate WebSocket connections
5. Fix CORS configurations

### Week 2 (High Priority)
6. Add rate limiting (at least on auth and AI endpoints)
7. Fix the Redis conditional property bug so caching actually works
8. Add input validation for coordinates and string lengths
9. Add security headers (Helmet.js for backend, nginx headers for frontend)
10. Fix authorization check so drivers can only update their own rides

### Week 3 (Medium Priority)
11. Consolidate polling into shared data source
12. Make test failures block CI/CD pipelines
13. Add security scanning to all workflows
14. Implement chat history retrieval in AI service
15. Clean up dead/commented-out code across all services
