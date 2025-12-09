# Bantam Shuttle - Local Kubernetes Deployment Summary

## ✅ Deployment Complete!

All 4 services are successfully deployed to your local Docker Desktop Kubernetes cluster:

### Services Status
- ✅ **Frontend** (2 replicas) - Running
- ✅ **Backend** (2 replicas) - Running  
- ✅ **Tracking Service** (2 replicas) - Running
- ✅ **AI Service** (2 replicas) - Running
- ✅ **PostgreSQL** (StatefulSet) - Running
- ✅ **Redis** (1 replica) - Running

## Access the Application

### Currently Running Port Forward:
```bash
# Frontend is already forwarded on port 8080
# Access at: http://localhost:8080
```

### Additional Port Forwards (open in new terminal windows):
```bash
# Backend API
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-backend 8081:8080

# Tracking Service
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-tracking 8082:8081

# AI Service
kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083
```

## Useful Commands

### Check Pod Status
```bash
kubectl get pods -n bantam-shuttle
kubectl get pods -n trinity
```

### View Logs
```bash
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-frontend
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-tracking
kubectl logs -n trinity -l app=trinity-ai-service
```

### Scale Services
```bash
kubectl scale deployment/bantam-shuttle-frontend --replicas=3 -n bantam-shuttle
```

### Restart Services
```bash
kubectl rollout restart deployment/bantam-shuttle-backend -n bantam-shuttle
```

## Next Steps

### 1. Test the Application
- Open http://localhost:8080 in your browser
- Test user authentication
- Test map and shuttle tracking
- Test AI chatbot

### 2. Database Setup
You still need to run Supabase migrations:
- **Backend Database**: Run `backend/database-migration.sql` in Supabase SQL Editor
- **AI Database**: Run `python scripts/ingest_knowledge_base.py`

### 3. Deploy to Professor's Homelab
Once local testing is complete:
```bash
# 1. Get kubeconfig from professor
export KUBECONFIG=/path/to/professors/kubeconfig

# 2. Run preflight check
./homelab-preflight-check.sh

# 3. Deploy
./deploy-local.sh  # Will deploy to the active kubectl context
```

## Cleanup

### Stop Port Forwards
```bash
# Press Ctrl+C in the terminal running the port-forward
```

### Delete Deployment
```bash
./cleanup-k8s.sh
# Or manually:
kubectl delete namespace bantam-shuttle
kubectl delete namespace trinity
```

## Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n bantam-shuttle
kubectl logs <pod-name> -n bantam-shuttle --tail=50
```

### Check Events
```bash
kubectl get events -n bantam-shuttle --sort-by='.lastTimestamp'
```

### Restart Everything
```bash
kubectl rollout restart deployment -n bantam-shuttle --all
kubectl rollout restart deployment -n trinity --all
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Docker Desktop Kubernetes                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  bantam-shuttle namespace                                    │
│  ├── Frontend (nginx) → Port 80                             │
│  ├── Backend (Node.js) → Port 8080 → Supabase              │
│  ├── Tracking (Spring Boot) → Port 8081                     │
│  │   ├── PostgreSQL (StatefulSet) → Port 5432             │
│  │   └── Redis → Port 6379                                 │
│                                                               │
│  trinity namespace                                           │
│  └── AI Service (FastAPI) → Port 8083 → Supabase           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Issues Fixed During Deployment

1. ✅ Secret key naming (hyphens vs underscores)
2. ✅ PostgreSQL credentials mismatch
3. ✅ Tracking service DB_USER environment variable
4. ✅ AI service DATABASE_URL configuration
5. ✅ StatefulSet recreation with correct credentials

---

**Deployment Date**: December 9, 2025
**Cluster**: docker-desktop (local)
**Status**: ✅ All services running and healthy
