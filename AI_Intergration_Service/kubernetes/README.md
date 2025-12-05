# Kubernetes Deployment Guide

This folder contains all Kubernetes manifests for deploying the Trinity Shuttle AI Service to a Kubernetes cluster.

## [IMPORTANT] Security - No .env Files!

All configuration is managed through Kubernetes Secrets and ConfigMaps:
- **Secrets** (`secret.yaml`): Sensitive data (API keys, passwords)
- **ConfigMaps** (`configmap.yaml`): Non-sensitive configuration
- **Docker images**: Completely generic, contain NO secrets

This is the proper way to manage secrets in Kubernetes!

## Structure

```
kubernetes/
├── namespace.yaml              # Isolated trinity namespace
├── secret.yaml                 # Sensitive data (fill these in!)
├── configmap.yaml             # Non-sensitive configuration
├── postgres-configmap.yaml    # Database initialization script
├── postgres.yaml              # PostgreSQL StatefulSet
├── deployment.yaml            # AI Service Deployment
├── service.yaml               # Kubernetes Service
├── rbac.yaml                  # Service accounts & permissions
├── ingress.yaml               # External access (optional)
├── kustomization.yaml         # Deploy all with one command
└── README.md                  # This file
```

## Quick Deploy

```bash
# 1. Create namespace and all resources
kubectl apply -k kubernetes/

# 2. Create secrets with your actual values
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_your_key \
  --from-literal=DB_PASSWORD=your_password \
  -n trinity --dry-run=client -o yaml | kubectl apply -f -

# 3. Verify deployment
kubectl get pods -n trinity
kubectl logs -f -n trinity deployment/trinity-ai-service
```

## Configuration Management

### Secrets (Edit these!)
File: `secret.yaml`

Contains sensitive data that you must provide:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DB_PASSWORD` - PostgreSQL password

```bash
# Create/Update secret
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_... \
  --from-literal=DB_PASSWORD=secure_pass \
  -n trinity \
  --dry-run=client -o yaml | kubectl apply -f -
```

### ConfigMaps
File: `configmap.yaml`

Non-sensitive configuration:
- Service names and ports
- Database connection details (except password)
- Model names and parameters
- Service URLs and CORS origins

Edit freely without security concerns.

## File Descriptions

### namespace.yaml
Creates an isolated `trinity` namespace for all resources.

### secret.yaml
Template for Kubernetes Secrets. **Fill in actual values before deploying!**

### configmap.yaml
Contains all non-sensitive configuration values.

### postgres-configmap.yaml
Database initialization SQL script (creates tables, indexes).

### postgres.yaml
StatefulSet for PostgreSQL:
- Single replica (production: consider managed database)
- Persistent volume for data (10Gi)
- Health checks
- Pulls config from ConfigMap and Secret

### deployment.yaml
Deployment for AI Service:
- 2 replicas for high availability
- Rolling update strategy
- Resource requests and limits
- Liveness and readiness probes
- Pulls config from ConfigMap and Secret

### service.yaml
ClusterIP service for internal access (port 8083).

### rbac.yaml
Service account and RBAC permissions (minimal).

### ingress.yaml
External access configuration (requires ingress controller).

### kustomization.yaml
Deploy all manifests with: `kubectl apply -k kubernetes/`

## Common Operations

### Check Status
```bash
# List all pods
kubectl get pods -n trinity

# Check pod details
kubectl describe pod trinity-ai-service-xxx -n trinity

# View logs
kubectl logs -f -n trinity trinity-ai-service-xxx

# Watch deployments
kubectl rollout status deployment/trinity-ai-service -n trinity
```

### Update Configuration
```bash
# Edit ConfigMap
kubectl edit configmap trinity-ai-config -n trinity

# Restart pods to pick up changes
kubectl rollout restart deployment/trinity-ai-service -n trinity
```

### Update Secrets
```bash
# Delete and recreate
kubectl delete secret trinity-ai-secret -n trinity

kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_new_key \
  --from-literal=DB_PASSWORD=new_password \
  -n trinity

# Restart pods
kubectl rollout restart deployment/trinity-ai-service -n trinity
```

### Scale Replicas
```bash
# Scale to 5 replicas
kubectl scale deployment/trinity-ai-service --replicas=5 -n trinity

# Or edit directly
kubectl edit deployment/trinity-ai-service -n trinity
```

### Database Access
```bash
# Port-forward to PostgreSQL
kubectl port-forward -n trinity postgres-0 5432:5432

# In another terminal
psql -h localhost -U trinity_user -d trinity_shuttle_db

# Or direct exec
kubectl exec -it -n trinity postgres-0 -- \
  psql -U trinity_user -d trinity_shuttle_db
```

### View Environment Variables
```bash
# Check what env vars are injected
kubectl exec -it -n trinity trinity-ai-service-xxx -- env | grep DB_
```

## Production Best Practices

### 1. Use Sealed Secrets
For production, seal your secrets so they're safe to commit:

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/sealed-secrets-v0.24.0.yaml

# Seal your secret
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_... \
  -n trinity \
  --dry-run=client -o yaml | kubeseal -f - > sealed-secret.yaml

# Now safe to commit!
git add sealed-secret.yaml
```

### 2. Use External Database
Replace StatefulSet with managed PostgreSQL (AWS RDS, GCP Cloud SQL, etc.):

```yaml
DATABASE_URL: "postgresql://user:pass@managed-db.example.com:5432/db"
```

### 3. Set Resource Quotas
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: trinity-quota
  namespace: trinity
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "20"
EOF
```

### 4. Enable Monitoring
Add ServiceMonitor for Prometheus:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: trinity-ai-service
  namespace: trinity
spec:
  selector:
    matchLabels:
      app: trinity-ai-service
  endpoints:
  - port: http
    interval: 30s
    path: /metrics
```

## Troubleshooting

### Pod won't start
```bash
# Check pod status
kubectl describe pod trinity-ai-service-xxx -n trinity

# View logs
kubectl logs trinity-ai-service-xxx -n trinity

# Common issues:
# - Secret not found: kubectl get secret -n trinity
# - ConfigMap not found: kubectl get configmap -n trinity
# - Image pull error: Check image name and repository access
```

### Database connection failed
```bash
# Check PostgreSQL pod
kubectl get pods -n trinity -l app=postgres

# Check database logs
kubectl logs -f -n trinity postgres-0

# Test connectivity
kubectl exec -it -n trinity trinity-ai-service-xxx -- \
  nc -zv postgres 5432
```

### Secret not being used
```bash
# Verify secret exists
kubectl get secret trinity-ai-secret -n trinity

# Check pod environment
kubectl exec -it -n trinity trinity-ai-service-xxx -- env | grep OPENAI

# Recreate secret and restart pods
```

## Docker Image Note

The Docker image (`docker/` folder) is completely generic:
- [OK] Application code and dependencies
- [NO] No .env files
- [NO] No API keys or secrets
- [NO] No configuration files

All configuration comes from Kubernetes at runtime.

## See Also

- `docker/` - Docker files for local development
- `docker/README.md` - Docker setup guide
- `K8S_SECURITY_README.md` - Security best practices
- `K8S_DEPLOYMENT.md` - Detailed deployment guide
