# Kubernetes Deployment Guide - Ctrl Alt Elite

This guide covers deploying Ctrl Alt Elite microservices to Kubernetes clusters (GKE, local K8s, etc).

## Prerequisites

- Kubernetes cluster running (GKE, local minikube, Docker Desktop K8s, etc.)
- `kubectl` configured and connected to your cluster
- Docker images built and pushed to Harbor registry (see `README_BUILD_IMAGES.md`)
- Harbor registry credentials configured as a Kubernetes secret

## Cluster Architecture

### Namespaces

The project uses multiple namespaces for organization:

- **elite-dev**: Frontend and Backend services
- **elite-db**: Database services (PostgreSQL, Redis)
- **trinity**: AI service

### Services

| Service | Namespace | Type | Port | Image |
|---------|-----------|------|------|-------|
| Frontend | elite-dev | ClusterIP | 80 | elite-frontend:latest |
| Backend | elite-dev | ClusterIP | 8080 | elite-backend:latest |
| Tracking | elite-db | ClusterIP | 8081 | elite-tracking-service:latest |
| AI Service | trinity | ClusterIP | 8083 | elite-ai-service:latest |

## Prerequisites: Harbor Secret

Before deploying, create a Harbor image pull secret in each namespace:

```bash
# Create secret in elite-dev namespace
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.javajon-gke.duckdns.org \
  --docker-username=robot$library+developer \
  --docker-password=c5d9eRvmIQlOiZCagsKZp4XAi3qwRAba \
  --docker-email=admin@example.com \
  -n elite-dev

# Create secret in trinity namespace
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.javajon-gke.duckdns.org \
  --docker-username=robot$library+developer \
  --docker-password=c5d9eRvmIQlOiZCagsKZp4XAi3qwRAba \
  --docker-email=admin@example.com \
  -n trinity

# Create secret in elite-db namespace
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.javajon-gke.duckdns.org \
  --docker-username=robot$library+developer \
  --docker-password=c5d9eRvmIQlOiZCagsKZp4XAi3qwRAba \
  --docker-email=admin@example.com \
  -n elite-db
```

## Deployment Structure

Each service has Kubernetes manifests in its directory:

```
backend/kubernetes/
  ├── deployment.yaml      # Backend deployment
  ├── service.yaml         # Backend service
  ├── configmap.yaml       # Configuration
  ├── kustomization.yaml   # Kustomize patch
  └── ingress.yaml         # Ingress rules

frontend/kubernetes/
  ├── deployment.yaml      # Frontend deployment
  ├── service.yaml         # Frontend service
  ├── namespace.yaml       # Namespace definition
  ├── kustomization.yaml   # Kustomize patch
  └── ingress.yaml         # Ingress rules

tracking-service/kubernetes/
  ├── deployment.yaml      # Tracking deployment
  ├── service.yaml         # Tracking service
  ├── database.yaml        # PostgreSQL + Redis
  ├── kustomization.yaml   # Kustomize patch
  └── configmap.yaml       # Configuration

AI_Intergration_Service/kubernetes/
  ├── deployment.yaml      # AI service deployment
  ├── service.yaml         # AI service
  ├── configmap.yaml       # Configuration
  ├── postgres.yaml        # PostgreSQL database
  ├── kustomization.yaml   # Kustomize patch
  └── secret.yaml          # Secrets
```

## Deployment Methods

### Method 1: Using Kustomize (Recommended)

Deploy each service using Kustomize:

```bash
# Create namespaces
kubectl create namespace elite-dev
kubectl create namespace elite-db
kubectl create namespace trinity

# Create Harbor secrets (see Prerequisites section above)

# Deploy Frontend
kubectl apply -k frontend/kubernetes/

# Deploy Backend
kubectl apply -k backend/kubernetes/

# Deploy Tracking Service
kubectl apply -k tracking-service/kubernetes/

# Deploy AI Service
kubectl apply -k AI_Intergration_Service/kubernetes/
```

### Method 2: Using kubectl apply directly

Deploy individual YAML files:

```bash
# Create namespaces
kubectl apply -f frontend/kubernetes/namespace.yaml

# Deploy Frontend
kubectl apply -f frontend/kubernetes/deployment.yaml
kubectl apply -f frontend/kubernetes/service.yaml
kubectl apply -f frontend/kubernetes/ingress.yaml

# Deploy Backend
kubectl apply -f backend/kubernetes/deployment.yaml
kubectl apply -f backend/kubernetes/service.yaml
kubectl apply -f backend/kubernetes/configmap.yaml

# Deploy Tracking Service
kubectl apply -f tracking-service/kubernetes/deployment.yaml
kubectl apply -f tracking-service/kubernetes/service.yaml
kubectl apply -f tracking-service/kubernetes/database.yaml

# Deploy AI Service
kubectl apply -f AI_Intergration_Service/kubernetes/deployment.yaml
kubectl apply -f AI_Intergration_Service/kubernetes/service.yaml
kubectl apply -f AI_Intergration_Service/kubernetes/postgres.yaml
```

## Verifying Deployment

### Check Namespaces

```bash
kubectl get namespaces
```

### Check Pods

```bash
# All pods in elite-dev
kubectl get pods -n elite-dev

# All pods in elite-db
kubectl get pods -n elite-db

# All pods in trinity
kubectl get pods -n trinity

# Watch pods starting up
kubectl get pods -n elite-dev -w
```

### Check Services

```bash
# List all services
kubectl get svc -A

# Get service details
kubectl get svc -n elite-dev
kubectl get svc -n trinity
```

### Check Deployments

```bash
# List deployments
kubectl get deployments -n elite-dev
kubectl get deployments -n trinity

# Detailed deployment info
kubectl describe deployment bantam-shuttle-backend -n elite-dev
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/bantam-shuttle-backend -n elite-dev

# Frontend logs
kubectl logs -f deployment/bantam-shuttle-frontend -n elite-dev

# Tracking service logs
kubectl logs -f deployment/bantam-shuttle-tracking -n elite-db

# AI service logs
kubectl logs -f deployment/bantam-ai-service -n trinity
```

## Accessing Services

### Port Forwarding (Local Testing)

Forward service ports to localhost:

```bash
# Frontend (port 80 → 8080)
kubectl port-forward svc/bantam-shuttle-frontend 8080:80 -n elite-dev

# Backend (port 8080 → 8080)
kubectl port-forward svc/bantam-shuttle-backend 8080:8080 -n elite-dev

# Tracking (port 8081 → 8081)
kubectl port-forward svc/bantam-shuttle-tracking 8081:8081 -n elite-db

# AI Service (port 8083 → 8083)
kubectl port-forward svc/bantam-ai-service 8083:8083 -n trinity
```

Then access:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8080`
- Tracking: `http://localhost:8081`
- AI: `http://localhost:8083`

### Using Ingress

If Ingress is configured, services are accessible via:
- Frontend: `https://shuttle.javajon-gke.duckdns.org`
- Backend: `https://shuttle.javajon-gke.duckdns.org/api`
- Tracking: `https://shuttle.javajon-gke.duckdns.org/api/tracking`
- AI: `https://shuttle.javajon-gke.duckdns.org/api/ai`

## Scaling Deployments

Scale replicas up or down:

```bash
# Scale backend to 3 replicas
kubectl scale deployment/bantam-shuttle-backend --replicas=3 -n elite-dev

# Scale frontend to 2 replicas
kubectl scale deployment/bantam-shuttle-frontend --replicas=2 -n elite-dev

# View current replicas
kubectl get deployment -n elite-dev
```

## Rolling Updates

Update image versions with rolling updates:

```bash
# Set new image version
kubectl set image deployment/bantam-shuttle-backend \
  bantam-shuttle-backend=harbor.javajon-gke.duckdns.org/library/elite-backend:v2.0.0 \
  -n elite-dev

# Watch rollout progress
kubectl rollout status deployment/bantam-shuttle-backend -n elite-dev

# Rollback if needed
kubectl rollout undo deployment/bantam-shuttle-backend -n elite-dev
```

## Configuration & Secrets

### ConfigMaps

View configuration:

```bash
# List configmaps
kubectl get configmap -n elite-dev
kubectl get configmap -n trinity

# View configmap contents
kubectl get configmap -o yaml <configmap-name> -n <namespace>
```

### Secrets

Secrets are configured via Harbor pull secret (created earlier).

View secrets:

```bash
# List secrets
kubectl get secrets -n elite-dev
kubectl get secrets -n trinity

# Verify harbor-pull-secret
kubectl get secret harbor-pull-secret -n elite-dev -o yaml
```

## Troubleshooting

### Pod not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# Check pod logs
kubectl logs <pod-name> -n <namespace>

# Common issues:
# - ImagePullBackOff: Check harbor-pull-secret and image URL
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource requests/limits and node availability
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints <service-name> -n <namespace>

# Check service DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup <service-name>.<namespace>.svc.cluster.local
```

### ImagePullBackOff error

```bash
# Verify secret exists
kubectl get secret harbor-pull-secret -n <namespace>

# Recreate secret if needed
kubectl delete secret harbor-pull-secret -n <namespace>
kubectl create secret docker-registry harbor-pull-secret \
  --docker-server=harbor.javajon-gke.duckdns.org \
  --docker-username=robot$library+developer \
  --docker-password=c5d9eRvmIQlOiZCagsKZp4XAi3qwRAba \
  -n <namespace>
```

## Cleanup

### Delete Services

```bash
# Delete by kustomization
kubectl delete -k frontend/kubernetes/
kubectl delete -k backend/kubernetes/
kubectl delete -k tracking-service/kubernetes/
kubectl delete -k AI_Intergration_Service/kubernetes/

# Or delete namespaces (removes all resources in namespace)
kubectl delete namespace elite-dev
kubectl delete namespace elite-db
kubectl delete namespace trinity
```

## Quick Reference Commands

```bash
# Create all resources
kubectl apply -k frontend/kubernetes/ && \
kubectl apply -k backend/kubernetes/ && \
kubectl apply -k tracking-service/kubernetes/ && \
kubectl apply -k AI_Intergration_Service/kubernetes/

# Check all pods
kubectl get pods -A

# Check all services
kubectl get svc -A

# Get detailed cluster info
kubectl cluster-info
kubectl describe nodes

# View events
kubectl get events -A --sort-by='.lastTimestamp'

# Delete all
kubectl delete namespace elite-dev elite-db trinity
```

## Deployment Checklist

- [ ] Kubernetes cluster running and configured
- [ ] `kubectl` configured and connected
- [ ] Docker images built (see `README_BUILD_IMAGES.md`)
- [ ] Images pushed to Harbor (see `README_HARBOUR.md`)
- [ ] Harbor secrets created in all namespaces
- [ ] Namespaces created (elite-dev, elite-db, trinity)
- [ ] All deployments applied
- [ ] All pods are Running (check with `kubectl get pods -A`)
- [ ] Services are accessible (check endpoints with `kubectl get svc -A`)
- [ ] Logs show no errors (check with `kubectl logs`)

## Next Steps

1. Deploy all services (see Deployment Methods above)
2. Verify deployment (see Verifying Deployment section)
3. Access services via port forwarding or ingress
4. Monitor logs and pod status
5. Configure monitoring and logging (optional)
6. Set up auto-scaling policies (optional)

---

**Related Documentation:**
- [`README_BUILD_IMAGES.md`](README_BUILD_IMAGES.md) - Building Docker images
- [`README_HARBOUR.md`](README_HARBOUR.md) - Pushing to Harbor registry
