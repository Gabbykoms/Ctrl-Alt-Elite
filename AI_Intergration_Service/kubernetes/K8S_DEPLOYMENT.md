# Kubernetes Deployment Guide for Trinity Shuttle AI Service

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Kubernetes Cluster                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Namespace: trinity                                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  ┌─────────────────┐    ┌────────────────────┐ │  │
│  │  │  AI Service     │    │  PostgreSQL        │ │  │
│  │  │  Deployment     │←──→│  StatefulSet       │ │  │
│  │  │  (2 replicas)   │    │  (1 replica)       │ │  │
│  │  │                 │    │                    │ │  │
│  │  │  Secret refs    │    │  Persistent       │ │  │
│  │  │  ConfigMap      │    │  Volume (10Gi)    │ │  │
│  │  └─────────────────┘    └────────────────────┘ │  │
│  │                                                  │  │
│  │  Service (ClusterIP)        Service (Headless) │  │
│  │  Port 8083                  Port 5432          │  │
│  │                                                  │  │
│  │  [Optional] Ingress → trinity-ai.example.com  │  │
│  │                                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration Structure (No .env in Container!)

### 1. **ConfigMap** (trinity-ai-config)
Contains **non-sensitive** configuration:
- Service names and ports
- Database host/user/name (not password!)
- Model names
- Model parameters
- Service URLs
- CORS origins

**Why ConfigMap?**
- Can be edited/updated without rebuilding image
- Easy to manage across environments
- Not encrypted, so only non-sensitive data

### 2. **Secret** (trinity-ai-secret)
Contains **sensitive** data:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DB_PASSWORD` - PostgreSQL password
- `SUPABASE_KEY` - Optional

**Why Secret?**
- Encrypted at rest (in etcd by default)
- Not included in logs
- Securely injected into pods
- Can use Sealed Secrets for extra security

### 3. **No .env file in container**
- `.env` is NOT copied into the Docker image
- No `.env` files at all in Kubernetes
- All configuration comes from Secrets + ConfigMaps
- Much more secure!

## Deployment Steps

### Step 1: Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### Step 2: Create Secrets (with your actual values!)
```bash
# Option A: Edit secret.yaml first (not recommended for production)
# Replace empty strings with actual values, then:
kubectl apply -f k8s/secret.yaml

# Option B: Create via command line (recommended)
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_your_actual_key \
  --from-literal=DB_PASSWORD=your_secure_password \
  -n trinity

# Option C: Using sealed-secrets (most secure)
# Install sealed-secrets controller first, then:
echo -n 'sk_your_key' | kubectl create secret generic trinity-ai-secret \
  --dry-run=client \
  --from-file=OPENAI_API_KEY=/dev/stdin \
  -o yaml | kubeseal -f - > sealed-secret.yaml
kubectl apply -f sealed-secret.yaml
```

### Step 3: Create ConfigMap
```bash
kubectl apply -f k8s/configmap.yaml
```

### Step 4: Create PostgreSQL Init ConfigMap
```bash
kubectl apply -f k8s/postgres-configmap.yaml
```

### Step 5: Create RBAC
```bash
kubectl apply -f k8s/rbac.yaml
```

### Step 6: Deploy PostgreSQL
```bash
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod \
  -l app=postgres -n trinity --timeout=300s
```

### Step 7: Deploy AI Service
```bash
kubectl apply -f k8s/deployment.yaml
```

### Step 8: Create Service
```bash
kubectl apply -f k8s/service.yaml
```

### Step 9 (Optional): Set Up Ingress
```bash
# First install ingress controller (if not already installed)
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Then apply ingress
kubectl apply -f k8s/ingress.yaml
```

### All-in-One Deployment
```bash
# Deploy everything at once
kubectl apply -k k8s/

# Or using kustomize explicitly
kustomize build k8s/ | kubectl apply -f -
```

## Monitoring Deployment

### Check Pod Status
```bash
# Watch pods starting up
kubectl get pods -n trinity -w

# Check specific pod
kubectl describe pod trinity-ai-service-xxx -n trinity

# View pod logs
kubectl logs -n trinity trinity-ai-service-xxx

# Stream logs in real-time
kubectl logs -f -n trinity trinity-ai-service-xxx

# Logs from all replicas
kubectl logs -f -n trinity -l app=trinity-ai-service
```

### Check Services
```bash
# List all services
kubectl get svc -n trinity

# Get service details
kubectl describe svc trinity-ai-service -n trinity

# Test internal connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n trinity -- \
  curl http://trinity-ai-service:8083/health
```

### Check Secrets and ConfigMaps
```bash
# List secrets
kubectl get secrets -n trinity

# View secret (base64 encoded)
kubectl get secret trinity-ai-secret -n trinity -o yaml

# Decode specific secret
kubectl get secret trinity-ai-secret -n trinity \
  -o jsonpath='{.data.OPENAI_API_KEY}' | base64 -d

# List ConfigMaps
kubectl get configmap -n trinity

# View ConfigMap
kubectl get configmap trinity-ai-config -n trinity -o yaml
```

### Database Access
```bash
# Port-forward to PostgreSQL
kubectl port-forward -n trinity postgres-0 5432:5432

# In another terminal, connect
psql -h localhost -U trinity_user -d trinity_shuttle_db

# Or connect directly from pod
kubectl exec -it -n trinity postgres-0 -- \
  psql -U trinity_user -d trinity_shuttle_db
```

## Updating Configuration

### Update ConfigMap (non-sensitive values)
```bash
# Edit the ConfigMap
kubectl edit configmap trinity-ai-config -n trinity

# Restart pods to pick up changes
kubectl rollout restart deployment trinity-ai-service -n trinity
```

### Update Secret (sensitive values)
```bash
# Delete and recreate
kubectl delete secret trinity-ai-secret -n trinity
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY=sk_new_key \
  --from-literal=DB_PASSWORD=new_password \
  -n trinity

# Restart pods to pick up changes
kubectl rollout restart deployment trinity-ai-service -n trinity
```

### Update Deployment Image
```bash
# Update to new image version
kubectl set image deployment/trinity-ai-service \
  ai-service=ghcr.io/gabbykoms/trinity-ai-service:v1.0.1 \
  -n trinity

# Or edit directly
kubectl edit deployment trinity-ai-service -n trinity

# Check rollout status
kubectl rollout status deployment trinity-ai-service -n trinity

# View rollout history
kubectl rollout history deployment trinity-ai-service -n trinity

# Rollback if needed
kubectl rollout undo deployment trinity-ai-service -n trinity
```

## Scaling

### Scale Replicas
```bash
# Scale to 3 replicas
kubectl scale deployment trinity-ai-service --replicas=3 -n trinity

# Or edit directly
kubectl edit deployment trinity-ai-service -n trinity
# Change replicas: 2 to replicas: 3
```

### Horizontal Pod Autoscaling
```bash
# Create HPA
kubectl autoscale deployment trinity-ai-service \
  --min=2 --max=10 \
  --cpu-percent=80 \
  -n trinity

# View HPA status
kubectl get hpa -n trinity
kubectl describe hpa trinity-ai-service -n trinity
```

## Backup and Restore

### Backup Database
```bash
# Backup PostgreSQL
kubectl exec -n trinity postgres-0 -- \
  pg_dump -U trinity_user trinity_shuttle_db > backup.sql

# Backup with compression
kubectl exec -n trinity postgres-0 -- \
  pg_dump -U trinity_user trinity_shuttle_db | gzip > backup.sql.gz

# Backup persistent volumes
kubectl get pvc -n trinity
# Use your storage provider's backup mechanism
```

### Restore Database
```bash
# Restore from backup
kubectl exec -i -n trinity postgres-0 -- \
  psql -U trinity_user trinity_shuttle_db < backup.sql
```

## Troubleshooting

### Pod Won't Start
```bash
# Check pod status
kubectl describe pod trinity-ai-service-xxx -n trinity

# Common issues:
# - Secret/ConfigMap missing: kubectl get secrets,configmaps -n trinity
# - Image pull error: kubectl get pods -n trinity -o yaml | grep -A 5 ImagePull
# - CrashLoopBackOff: kubectl logs trinity-ai-service-xxx -n trinity
```

### Database Connection Failed
```bash
# Check database pod
kubectl get pods -n trinity | grep postgres

# Check database logs
kubectl logs -n trinity postgres-0

# Verify environment variables in AI pod
kubectl exec -it -n trinity trinity-ai-service-xxx -- env | grep DB_

# Test connectivity
kubectl exec -it -n trinity trinity-ai-service-xxx -- \
  nc -zv postgres 5432
```

### Secret Not Being Used
```bash
# Verify secret exists
kubectl get secret trinity-ai-secret -n trinity

# Check pod environment
kubectl exec -it -n trinity trinity-ai-service-xxx -- env | grep OPENAI

# Recreate secret if needed and restart pods
```

### Out of Memory
```bash
# Check resource usage
kubectl top pods -n trinity

# Check resource requests/limits
kubectl describe deployment trinity-ai-service -n trinity | grep -A 5 Limits

# Increase limits in deployment.yaml and apply:
kubectl apply -f k8s/deployment.yaml
```

## Production Best Practices

### 1. **Use Sealed Secrets** (not plain Secrets)
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/sealed-secrets-v0.24.0.yaml

# Seal your secrets
echo -n 'secret-value' | kubeseal --name trinity-ai-secret --namespace trinity -f - > sealed-secret.yaml

# Deploy sealed secret
kubectl apply -f sealed-secret.yaml
```

### 2. **Enable Pod Security Policies**
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
```

### 3. **Set Network Policies**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: trinity-network-policy
  namespace: trinity
spec:
  podSelector:
    matchLabels:
      app: trinity-ai-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
```

### 4. **Use Resource Quotas**
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

### 5. **Enable Monitoring with Prometheus**
- Add prometheus annotations to pods
- Configure ServiceMonitor for Prometheus Operator
- Set up Grafana dashboards

### 6. **Use External Database for Production**
- Use managed PostgreSQL service (AWS RDS, GCP Cloud SQL, Azure Database)
- Update `DATABASE_URL` in ConfigMap to point to external database
- This ensures data persistence even if cluster is destroyed

## Environment-Specific Deployments

### Development Environment
```bash
kubectl apply -k k8s/overlays/dev/
```

### Staging Environment
```bash
kubectl apply -k k8s/overlays/staging/
```

### Production Environment
```bash
kubectl apply -k k8s/overlays/prod/
```

## Useful Commands Reference

```bash
# General
kubectl cluster-info
kubectl get nodes
kubectl get all -n trinity

# Secrets/ConfigMaps
kubectl get secrets,configmaps -n trinity
kubectl edit secret/configmap trinity-ai-secret -n trinity

# Deployments
kubectl get deployments -n trinity
kubectl describe deployment trinity-ai-service -n trinity
kubectl rollout status deployment trinity-ai-service -n trinity

# Pods
kubectl get pods -n trinity
kubectl logs -f trinity-ai-service-xxx -n trinity
kubectl exec -it trinity-ai-service-xxx -n trinity -- /bin/bash

# Services
kubectl get svc -n trinity
kubectl port-forward svc/trinity-ai-service 8083:8083 -n trinity

# Restart/Update
kubectl rollout restart deployment trinity-ai-service -n trinity
kubectl set image deployment/trinity-ai-service ai-service=image:tag -n trinity

# Delete
kubectl delete pod trinity-ai-service-xxx -n trinity
kubectl delete deployment trinity-ai-service -n trinity
kubectl delete namespace trinity
```

## Next Steps

1. **Set up your secrets properly** - Use sealed-secrets for production
2. **Configure database** - Use external managed database if possible
3. **Set up Ingress** - Enable external access with proper DNS
4. **Enable monitoring** - Add Prometheus and Grafana
5. **Configure autoscaling** - Set up HPA for load-based scaling
6. **Set up CI/CD** - Automate deployments with GitOps (ArgoCD, Flux)
