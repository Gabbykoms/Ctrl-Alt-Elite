# Deployment Options

This document outlines reasonable deployment options for the Bantam Shuttle application, considering the existing architecture: 4 microservices (Backend, Frontend, Tracking Service, AI Integration Service), PostgreSQL databases, Redis, RabbitMQ, and Socket.io for real-time communication.

---

## Architecture Summary

```
Frontend (React/Nginx)
  |  HTTP/WebSocket
Backend (Express.js, Port 8080)
  |-- Supabase (PostgreSQL) [Auth, Data]
  |-- Socket.io Server
  |-- Tracking Service (Java/Spring Boot, Port 8081)
  |     |-- PostgreSQL [Stop Storage]
  |     +-- Redis [Caching, Pub/Sub]
  +-- AI Service (FastAPI, Port 8083)
        |-- RabbitMQ [Message Queue]
        |-- PostgreSQL [Embeddings, History]
        |-- OpenAI API
        +-- Supabase [Data]
```

### Key Constraints

- **Socket.io (WebSockets):** The Backend and Frontend rely on Socket.io for real-time updates. This requires sticky sessions or native WebSocket support, which rules out some serverless options.
- **Java cold starts:** The Tracking Service runs on Spring Boot / Java 21, which has longer startup times. This matters for scale-to-zero platforms.
- **Multiple databases:** PostgreSQL is used by multiple services (via Supabase and standalone instances), plus Redis and RabbitMQ are required.

---

## Option 1: GKE (Current Setup)

The repository is already configured for **Google Kubernetes Engine** with a Harbor registry at `harbor.javajon-gke.duckdns.org`. All K8s manifests, HPAs, health checks, and Kustomize overlays are in place.

### What Exists

- Kubernetes manifests for all 4 services (`kubernetes/` directories)
- Horizontal Pod Autoscaling (Backend: 2-10 pods, CPU > 70%)
- Rolling update strategy (maxSurge: 1, maxUnavailable: 0)
- Pod anti-affinity rules (AI Service)
- GitHub Actions CI/CD pipelines that build and push Docker images
- Namespace: `elite-dev`

### Pros

- Production-grade with full autoscaling
- Team is already invested in this infrastructure
- All manifests and CI/CD are ready

### Cons

- Most expensive option
- Operational complexity (cluster management, node pools, upgrades)
- Requires Kubernetes expertise on the team

---

## Option 2: Docker Compose on a Single VM

Each service already has `docker-compose.yml` files. These could be consolidated into a single compose file and deployed on a VM (GCE instance, DigitalOcean droplet, AWS EC2, etc.).

### Suitable For

- Staging/demo environments
- Cost-conscious deployments
- Quick setup without Kubernetes overhead

### Pros

- Simplest to set up and maintain
- Cheapest option (single VM, ~$20-40/month)
- Good for demos and staging
- Docker Compose files already exist per service

### Cons

- No autoscaling
- Single point of failure
- Manual updates and deployments
- Resource-constrained (all services share one VM)

---

## Option 3: Railway

Railway can deploy each service directly from the repository with minimal configuration. It natively supports Node.js, Java, Python, and static sites, plus offers managed PostgreSQL, Redis, and RabbitMQ add-ons.

### Pros

- Near-zero operational overhead
- Easy environment and secret management
- Good free/hobby tier for development
- Supports all four service runtimes natively

### Cons

- Less control over infrastructure
- Costs scale with usage (can get expensive at scale)
- Vendor lock-in for managed services

---

## Option 4: Google Cloud Run

Since the project already has Docker images and GCP infrastructure, Cloud Run would allow deploying each service as a serverless container without managing a K8s cluster.

### Pros

- Pay-per-request pricing
- Auto-scales to zero (cost savings when idle)
- No cluster management
- Stays within the existing GCP ecosystem

### Cons

- Cold starts, especially for the Java Tracking Service
- WebSocket support is limited (Socket.io may need adaptation or a separate solution)
- Requires managed database instances separately (Cloud SQL, Memorystore)

---

## Option 5: Fly.io

Similar to Railway but with more control over regions and networking. A good fit for the WebSocket-heavy nature of this application.

### Pros

- Global edge deployment (low latency)
- Native WebSocket support
- Simple CLI-based deployment
- Good for real-time applications

### Cons

- Managed database options are more limited
- Smaller ecosystem than GCP/AWS
- May need external services for RabbitMQ

---

## Recommendation Summary

| Use Case | Recommended Option |
|----------|-------------------|
| Production | GKE (already configured) |
| Staging / Demo | Docker Compose on a single VM or Railway |
| Cost-conscious | Railway or Cloud Run |
| Quick local demo | Docker Compose locally |

The **Socket.io dependency** is the primary constraint when evaluating platforms. GKE and Docker Compose handle WebSockets natively. Railway and Fly.io also provide good support. Cloud Run requires additional consideration for real-time features.
