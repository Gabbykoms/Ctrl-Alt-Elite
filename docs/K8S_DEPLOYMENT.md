# Kubernetes Deployment Guide

This guide will help you deploy the Bantam Shuttle application to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (minikube, kind, GKE, EKS, AKS, etc.)
- kubectl configured to access your cluster
- Docker images pushed to Docker Hub (already done: gabbykoms/bantam-shuttle-*)

## Quick Deploy

```bash
# Deploy all services at once
./deploy-to-k8s.sh
```

## Manual Deployment

### 1. Create Namespace

```bash
kubectl apply -f frontend/kubernetes/namespace.yaml
```

### 2. Create Secrets

**Backend Secrets:**
```bash
kubectl create secret generic bantam-secrets \
  --from-literal=SUPABASE_URL='your-supabase-url' \
  --from-literal=SUPABASE_ANON_KEY='your-anon-key' \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  -n bantam-shuttle
```

**Tracking Service Secrets:**
```bash
kubectl create secret generic tracking-secrets \
  --from-literal=db-username='postgres' \
  --from-literal=db-password='your-secure-password' \
  -n bantam-shuttle
```

**AI Service Secrets:**
```bash
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY='your-openai-key' \
  --from-literal=DATABASE_PASSWORD='your-supabase-password' \
  -n trinity
```

### 3. Deploy Services

**Frontend:**
```bash
kubectl apply -k frontend/kubernetes/
```

**Backend:**
```bash
kubectl apply -k backend/kubernetes/
```

**Tracking Service (includes PostgreSQL + Redis):**
```bash
kubectl apply -k tracking-service/kubernetes/
```

**AI Service:**
```bash
kubectl apply -k AI_Intergration_Service/kubernetes/
```

### 4. Verify Deployment

```bash
# Check all pods
kubectl get pods -n bantam-shuttle
kubectl get pods -n trinity

# Check services
kubectl get svc -n bantam-shuttle
kubectl get svc -n trinity

# Check ingresses
kubectl get ingress -n bantam-shuttle
kubectl get ingress -n trinity
```

### 5. Access the Application

**Port Forward (for testing):**
```bash
# Frontend
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-frontend 8080:80

# Backend
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-backend 8080:8080

# Tracking Service
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-tracking 8081:8081

# AI Service
kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083
```

Then access:
- Frontend: http://localhost:8080
- Backend: http://localhost:8080
- Tracking: http://localhost:8081/swagger-ui.html
- AI: http://localhost:8083/docs

**Ingress (production):**

Update the ingress files with your actual domain:
- `frontend/kubernetes/ingress.yaml` - Update host to your domain
- `backend/kubernetes/ingress.yaml` - Update host to your domain
- `tracking-service/kubernetes/ingress.yaml` - Update host to your domain
- `AI_Intergration_Service/kubernetes/ingress.yaml` - Update host to your domain

Then access via your configured domains.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Namespace: bantam-shuttle                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Frontend (2 replicas)    ←─┐                              │ │
│  │  Port 80                      │                              │ │
│  │                               │                              │ │
│  │  Backend (2 replicas)         ├─→ Ingress                   │ │
│  │  Port 8080                    │                              │ │
│  │                               │                              │ │
│  │  Tracking Service (2 replicas)│                              │ │
│  │  Port 8081                   ─┘                              │ │
│  │      ↓                                                       │ │
│  │  PostgreSQL (StatefulSet)                                   │ │
│  │  Redis (Deployment)                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Namespace: trinity                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  AI Service (2 replicas)  ─→ Ingress                       │ │
│  │  Port 8083                                                  │ │
│  │      ↓                                                       │ │
│  │  Supabase PostgreSQL (external)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Resource Requirements

**Minimum Cluster Resources:**
- CPU: 4 cores
- Memory: 8GB RAM
- Storage: 20GB

**Per Service:**
- Frontend: 100m CPU, 128Mi RAM
- Backend: 500m CPU, 512Mi RAM  
- Tracking: 500m CPU, 512Mi RAM
- AI Service: 500m CPU, 512Mi RAM
- PostgreSQL: 250m CPU, 256Mi RAM
- Redis: 100m CPU, 128Mi RAM

## Troubleshooting

**Check pod logs:**
```bash
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-frontend
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-tracking
kubectl logs -n trinity -l app=trinity-ai-service
```

**Check pod status:**
```bash
kubectl describe pod -n bantam-shuttle <pod-name>
```

**Restart deployment:**
```bash
kubectl rollout restart deployment/bantam-shuttle-frontend -n bantam-shuttle
kubectl rollout restart deployment/bantam-shuttle-backend -n bantam-shuttle
kubectl rollout restart deployment/bantam-shuttle-tracking -n bantam-shuttle
kubectl rollout restart deployment/trinity-ai-service -n trinity
```

## Cleanup

**Delete all resources:**
```bash
kubectl delete namespace bantam-shuttle
kubectl delete namespace trinity
```

Or use the cleanup script:
```bash
./cleanup-k8s.sh
```
