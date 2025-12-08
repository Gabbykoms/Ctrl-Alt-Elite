# Docker Deployment Guide

This guide covers deploying the Bantam Shuttle Backend as a containerized microservice.

## Quick Start

### Local Development with Docker

```bash
# Build the image
docker build -t bantam-shuttle-backend:latest .

# Run the container
docker run -p 8080:8080 --env-file .env bantam-shuttle-backend:latest
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Container registry access

### Step 1: Build and Push Image

```bash
# Build for your registry
docker build -t your-registry/bantam-shuttle-backend:latest .

# Push to registry
docker push your-registry/bantam-shuttle-backend:latest
```

### Step 2: Create Secrets

```bash
# Create namespace
kubectl create namespace bantam-shuttle

# Create secrets from .env file
kubectl create secret generic bantam-secrets \
  --from-literal=supabase-url="YOUR_SUPABASE_URL" \
  --from-literal=supabase-anon-key="YOUR_ANON_KEY" \
  --from-literal=supabase-service-role-key="YOUR_SERVICE_ROLE_KEY" \
  --from-literal=jwt-secret="YOUR_JWT_SECRET" \
  -n bantam-shuttle
```

### Step 3: Update ConfigMap

Edit `kubernetes/configmap.yaml` with your service URLs:

```yaml
data:
  frontend-url: "https://your-frontend-url.com"
  tracking-service-url: "http://tracking-service:8080"
  ai-service-url: "http://ai-service:8083"
```

### Step 4: Deploy

```bash
# Apply all Kubernetes manifests
kubectl apply -f kubernetes/ -n bantam-shuttle

# Or use Kustomize
kubectl apply -k kubernetes/ -n bantam-shuttle
```

### Step 5: Verify Deployment

```bash
# Check pods
kubectl get pods -n bantam-shuttle

# Check service
kubectl get svc -n bantam-shuttle

# View logs
kubectl logs -f deployment/bantam-shuttle-backend -n bantam-shuttle

# Test health endpoint
kubectl port-forward svc/bantam-shuttle-backend 8080:8080 -n bantam-shuttle
curl http://localhost:8080/health
```

## Cluster Configuration

### Service Discovery

The backend expects these service names in the cluster:
- `tracking-service` on port 8080
- `ai-service` on port 8083

Update `kubernetes/configmap.yaml` if your service names differ.

### Auto-scaling

The HPA (Horizontal Pod Autoscaler) will scale replicas based on:
- CPU: 70% threshold
- Memory: 80% threshold
- Min replicas: 2
- Max replicas: 10

```bash
# Check HPA status
kubectl get hpa -n bantam-shuttle
```

### Ingress

Update `kubernetes/ingress.yaml` with your domain:

```yaml
spec:
  tls:
  - hosts:
    - api.your-domain.com
  rules:
  - host: api.your-domain.com
```

Then apply:

```bash
kubectl apply -f kubernetes/ingress.yaml -n bantam-shuttle
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Server port (default: 8080) | Yes |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `TRACKING_SERVICE_URL` | Tracking microservice URL | Yes |
| `AI_SERVICE_URL` | AI microservice URL | Yes |

## Health Checks

- **Endpoint**: `GET /health` (port 8080)
- **Success**: 200 OK with status object
- **Liveness probe**: Initial delay 40s, period 30s
- **Readiness probe**: Initial delay 20s, period 10s

## Resource Limits

Default resource configuration:
- **Requests**: 256Mi memory, 250m CPU
- **Limits**: 512Mi memory, 500m CPU

Adjust in `kubernetes/deployment.yaml` based on your needs.

## Networking

### WebSocket Support

The backend uses Socket.IO for real-time updates. Ensure:
- Load balancer supports WebSocket
- Session affinity is enabled (ClientIP)
- Ingress has WebSocket annotations

### CORS Configuration

CORS is configured via `FRONTEND_URL` environment variable. Multiple origins:

```yaml
env:
- name: FRONTEND_URL
  value: "https://app1.com,https://app2.com"
```

## Monitoring

### Prometheus Metrics

Add Prometheus annotations to the deployment:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

### Logging

Logs are sent to stdout/stderr and collected by cluster logging solution.

```bash
# Stream logs
kubectl logs -f deployment/bantam-shuttle-backend -n bantam-shuttle

# View recent logs
kubectl logs --tail=100 deployment/bantam-shuttle-backend -n bantam-shuttle
```

## CI/CD

GitHub Actions workflow included at `.github/workflows/docker-build.yml`:
- Builds on push to main/develop
- Pushes to GitHub Container Registry
- Multi-platform support (amd64/arm64)
- Caching enabled

Configure secrets in GitHub:
- `GITHUB_TOKEN` (auto-provided)

## Troubleshooting

### Pod won't start

```bash
kubectl describe pod <pod-name> -n bantam-shuttle
kubectl logs <pod-name> -n bantam-shuttle
```

### Service unreachable

```bash
kubectl get endpoints -n bantam-shuttle
kubectl port-forward svc/bantam-shuttle-backend 8080:8080 -n bantam-shuttle
```

### Database connection issues

Check secrets are correctly set:

```bash
kubectl get secret bantam-secrets -n bantam-shuttle -o yaml
```

## Security Best Practices

1. ✅ Non-root user (UID 1001)
2. ✅ Read-only filesystem where possible
3. ✅ No privilege escalation
4. ✅ Secrets via Kubernetes Secrets
5. ✅ Resource limits defined
6. ✅ Health checks configured
7. ✅ Multi-stage Docker build

## Updating

```bash
# Update image
docker build -t your-registry/bantam-shuttle-backend:v1.1.0 .
docker push your-registry/bantam-shuttle-backend:v1.1.0

# Rolling update
kubectl set image deployment/bantam-shuttle-backend \
  backend=your-registry/bantam-shuttle-backend:v1.1.0 \
  -n bantam-shuttle

# Check rollout status
kubectl rollout status deployment/bantam-shuttle-backend -n bantam-shuttle
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/bantam-shuttle-backend -n bantam-shuttle

# Rollback to previous version
kubectl rollout undo deployment/bantam-shuttle-backend -n bantam-shuttle

# Rollback to specific revision
kubectl rollout undo deployment/bantam-shuttle-backend --to-revision=2 -n bantam-shuttle
```
