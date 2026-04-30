# Independent Study Progress Report
## Bantam Shuttle — Trinity College
### Spring Semester 2026 | January – April

**Students:** Noella Uwayisenga & Shamsher Ghising Tamang
**Project:** Bantam Shuttle — Real-Time Campus Shuttle Tracking & Ride Management System
**Supervisor:** Professor Ken Kousen
**Submission Date:** April 28, 2026

---

## 1. Project Overview

Bantam Shuttle is a full-stack microservices application designed to modernize campus transportation at Trinity College. It provides real-time shuttle tracking, on-demand ride requests, driver shift management, and an AI-powered assistant for students and staff.

The system is composed of four independently deployed microservices:

| Service | Technology | Purpose |
|---|---|---|
| **Backend** | Node.js / TypeScript / Express | Authentication, ride management, user profiles |
| **Tracking Service** | Java 21 / Spring Boot / WebFlux | Real-time driver location, ride lifecycle, shift reports |
| **AI Integration Service** | Python / FastAPI | RAG-based chatbot, vector embeddings, weather integration |
| **Frontend** | React / Vite / TypeScript | Student and driver-facing web application |

This report documents the improvements, fixes, and milestones achieved over the Spring 2026 semester.

---

## 2. Summary of Improvements

### 2.1 Driver Dashboard Redesign (March 2026)

**Commit:** `0074669e` — Version 2: Major updates and improvements

The driver-facing dashboard underwent a significant redesign. Prior to this semester, the dashboard provided only a basic map view and clock-in toggle. The following capabilities were added:

- **Driver Shift Report System:** Drivers can now start and end shift reports directly from the dashboard. Each report captures:
  - Report date and driver identity (auto-populated from the authenticated session)
  - Radio number and vehicle license plate
  - Starting and ending mileage with validation constraints (ending mileage must be ≥ starting mileage)
  - Condition notes for vehicle state documentation
- **Open Report Detection:** On dashboard load, the app automatically checks for any open shift report for the current date and restores its state, preventing duplicate reports.
- **Authentication Integration:** The dashboard now reads from the authenticated user context (`useAuth`) to pre-fill driver name and ID, reducing manual data entry errors.
- **New API Service Layer:** Added `DriverShiftReport` type definitions and dedicated API calls (`getDriverShiftReportsByDriver`, `startShiftReport`, `endShiftReport`) in `apiService.ts`.

**New backend endpoint:** A `DriverShiftReportController` was implemented in the tracking service with full CRUD support and business rule enforcement at the database constraint level.

---

### 2.2 Security Audit & Secrets Remediation (February – March 2026)

**Commits:** `673f9651`, `59601151`, `22228bcd`, `73f29e31`, `006889c4`

A comprehensive security audit identified that API keys, database credentials, and service tokens were hardcoded in several configuration files and CI/CD workflow definitions. This was a critical vulnerability as the repository is hosted on GitHub.

**Actions taken:**

- Removed all hardcoded secrets from:
  - `.github/workflows/frontend-ci-cd.yml`
  - `AI_Intergration_Service/kubernetes/secret.yaml`
  - `tracking-service/kubernetes/secrets.yaml`
  - Kubernetes kustomization files
- Introduced `.env.secrets.example` template files across all services so collaborators know what values to provide without exposing actual credentials
- Updated `.gitignore` files in the tracking service and AI service to prevent `.env.secrets` files from ever being committed
- Removed a previously committed `.env.secrets` file from the tracking service history
- Documented all findings in `docs/SECRETS_AUDIT_REPORT.md` with a prioritized remediation checklist

This work brought the project into compliance with standard secret management practices and eliminated the risk of credential exposure.

---

### 2.3 CORS Configuration Fix (February 2026)

**Commit:** `e71c24c6`

Cross-Origin Resource Sharing (CORS) errors were blocking the frontend from communicating with the AI Integration Service in deployed environments. The fix:

- Updated the AI service's `main.py` to use dynamic origin configuration driven by environment variables rather than hardcoded localhost values
- Corrected Kubernetes ingress annotations in both the backend and frontend ingress manifests to properly route requests across services

---

### 2.4 AI Service Authentication (March 2026)

**Commit:** `546380a9`

The AI Integration Service previously had no authentication layer — any request could access the RAG chatbot and document endpoints. A JWT-based authentication utility was added:

- Created `app/utils/auth.py` with token verification logic integrated with the Supabase user session
- Applied authentication middleware to the `/chat` and `/documents` routes
- Ensures only logged-in students and staff can interact with the AI assistant

---

### 2.5 Driver Shift Report Bug Fix (March 2026)

**Commit:** `9583ef8d`

After deploying the shift report system, a `500 Internal Server Error` was occurring on all shift report API responses. Root cause analysis identified two issues:

1. A manually defined `ObjectMapper` bean in `RedisConfig.java` was overriding Spring Boot's auto-configured one. The custom bean was missing the `JavaTimeModule`, which caused `LocalDate` fields in shift report responses to fail serialization.
2. Hibernate's `ddl-auto` was set to `none`, preventing the `driver_shift_reports` table from being created automatically on service startup.

**Fix:** Removed the conflicting `ObjectMapper` bean and updated `ddl-auto` to `update`. All shift report endpoints returned correct responses after redeployment.

---

### 2.6 UI/UX Improvement with Figma (Spring 2026)

During this semester, Figma was adopted as the primary design tool for planning UI improvements before implementation. Wireframes and component layouts were designed in Figma and then translated into React components, resulting in a more structured and deliberate design process compared to ad-hoc implementation in prior semesters. This skill was developed from scratch as part of the independent study.

---

### 2.7 Frontend Testing Infrastructure (March 2026)

**Commit:** `2f8c1fd0`

A testing framework was introduced to the frontend for the first time:

- Integrated **Vitest** as the test runner (compatible with Vite's build tooling)
- Added `@testing-library/react` for component-level testing
- Wrote initial test suite for `DriverDashboard.tsx` covering render behavior and key UI states
- Configured `vitest.config.ts` and `setupTests.ts`
- Documented the testing approach in `docs/TESTING.md`

---

### 2.8 Tracking Service Database Migration to Supabase (April 2026)

**Commit:** `ccc4190c`

The tracking service originally ran against a dedicated PostgreSQL instance provisioned separately (via Docker Compose locally and a managed database on DigitalOcean). This added cost and operational overhead.

**Migration approach:**
- Analyzed the tracking service schema (`drivers`, `rides`, `stops`, `driver_shift_reports`) against the existing Supabase schema used by the backend
- Identified significant overlap — both systems maintained `drivers`, `rides`, and `stops` tables as separate sources of truth
- Extended the existing Supabase tables with tracking-specific columns (`current_lat`, `current_lng`, `last_location_update_at_ms`, `tracking_status`, `route_id`) using `ALTER TABLE` statements
- Created the `driver_shift_reports` table in Supabase as it had no equivalent in the backend schema
- Migrated the tracking service's JDBC connection from a self-managed PostgreSQL instance to the Supabase PostgreSQL endpoint
- Updated `application.yaml` to use a single `TRACKING_DB_URL` environment variable instead of five separate host/port/name/user/password variables
- Disabled Redis caching layer (Redis dependency commented out in `build.gradle.kts`) since the Supabase PostgreSQL connection provides sufficient performance for the current load

**Benefits achieved:**
- Eliminated the need for a separate managed PostgreSQL database (~$15–25/month savings on DigitalOcean)
- Single source of truth for driver and ride data shared between backend and tracking services
- Simplified deployment configuration — one fewer infrastructure dependency to manage

---

### 2.9 Cloud Deployment Exploration (April 2026)

**Commits:** `85089ba0`, `d477d003`, `76724f4e`, `e1dec5ad`, `30e1868e`, `d1f3266f`, `ccc4190c`, `0232a662`, `9cff3f3f`

A major focus of this semester was achieving a fully public cloud deployment. Two platforms were explored:

#### DigitalOcean (Kubernetes + App Platform)

- Initially implemented Kubernetes deployment manifests (`k8s/` directory) for DigitalOcean Kubernetes Service (DOKS), including deployments, services, config maps, and ingress definitions for all four microservices
- Transitioned to DigitalOcean App Platform for simpler management, creating a `.do/app.yaml` app specification
- Worked through several deployment issues:
  - YAML spec structure errors (duplicate `services:` keys causing silent spec invalidation)
  - Discovery that DO App Platform does not re-read `.do/app.yaml` on subsequent pushes — spec must be updated through the DO dashboard or CLI
  - Resolved Dockerfile path configuration for the static frontend

#### Railway

- Deployed the frontend, backend, and tracking service successfully to Railway
- Railway's GitHub integration auto-detects Dockerfiles per service directory, eliminating the need for a centralized app spec file
- Configured inter-service communication using Railway's internal DNS (`.railway.internal`) for server-to-server calls and public `*.up.railway.app` domains for browser-facing endpoints
- Fixed a Railway-detected issue in the frontend Dockerfile (`npx vite build` → `npm run build`)
- Hardened the AI service's RabbitMQ connection to handle startup race conditions in the Railway environment

---

### 2.10 Documentation Produced This Semester

The following documentation was produced and committed to the `docs/` directory:

| Document | Description |
|---|---|
| `CODE_REVIEW.md` | Comprehensive code review with prioritized findings across all services |
| `SECRETS_AUDIT_REPORT.md` | Full audit of exposed credentials with remediation status |
| `DRIVER_OPERATIONS_ARCHITECTURE.md` | Architecture documentation for the driver shift report and operations system |
| `DEPLOYMENT_OPTIONS.md` | Analysis of deployment platform options (GKE, DigitalOcean, Railway, Render) |
| `TESTING.md` | Frontend and backend testing strategy and setup guide |
| `API_ROUTES.md` | Complete API route reference for all services |
| `AUTH_DOCUMENTATION.md` | Authentication flow and JWT integration documentation |

Additionally, a 1,900-line **iOS App Roadmap** (`IOS_APP_ROADMAP.md`) was created at the project root, outlining a future native mobile companion application.

---

## 3. Technical Skills Developed

| Skill | Context |
|---|---|
| **Figma** | Designed UI wireframes and component layouts before implementation |
| **Supabase** | Database provisioning, schema extension via SQL editor, PostgreSQL connection management |
| **DigitalOcean App Platform** | App spec authoring, secrets management, deployment troubleshooting |
| **Kubernetes** | Writing and deploying k8s manifests for microservices (DOKS) |
| **Railway** | Monorepo multi-service deployment, internal networking, environment configuration |
| **Java Spring Boot / WebFlux** | Implemented reactive REST controllers, JPA entities, repository pattern |
| **Security practices** | Secret management, `.gitignore` hygiene, environment variable templating |
| **Vitest / Testing Library** | Frontend component testing setup and initial test authoring |
| **YAML / Infrastructure as Code** | DigitalOcean app spec, Railway config, Kubernetes manifests |

---

## 4. Challenges & Lessons Learned

**Secret exposure in CI/CD:** Discovered early in the semester that credentials were committed directly in workflow files and Kubernetes manifests. This was resolved through a dedicated audit and the introduction of `.env.example` templates, and reinforced the importance of treating secrets as infrastructure concerns rather than code concerns.

**Microservice coordination complexity:** Inter-service URL management across environments (local, Kubernetes, DigitalOcean, Railway) proved to be a recurring source of errors. Each platform has a different model for service discovery (Docker Compose service names, Kubernetes ClusterIP, DO private URLs, Railway internal DNS).

**Platform-specific deployment behavior:** DigitalOcean App Platform does not automatically re-read the app spec from the repository after initial creation — a non-obvious behavior that caused repeated failed deployments. This reinforced the value of reading platform documentation carefully before assuming convention-over-configuration behavior.

**Database consolidation:** Running separate PostgreSQL instances per service was initially more straightforward to reason about but introduced cost and data synchronization problems. Consolidating onto Supabase simplified operations significantly.

---

## 5. Current System State

| Component | Status |
|---|---|
| Frontend | Live on Railway |
| Backend | Live on Railway |
| Tracking Service | Live on Railway (Supabase PostgreSQL) |
| AI Integration Service | Not deployed (deferred — focus on core services first) |
| Database | Supabase (consolidated — backend + tracking share one project) |
| DigitalOcean | Preserved as backup deployment target |

---

## 6. Next Steps (Future Work)


- Complete the deployment 
- Implement the iOS companion app outlined in `IOS_APP_ROADMAP.md`
- Add monitoring and alerting (uptime checks, error rate dashboards)
- Improve the communication between the driver and the students(text message)
- Implement the admin dashboard improvements planned in Figma

---
