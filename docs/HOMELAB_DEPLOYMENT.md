# Bantam Shuttle - Homelab Kubernetes Deployment Guide

This guide is specifically tailored for deploying to your professor's homelab Kubernetes cluster.

## Prerequisites

✅ Docker images already built and pushed to Docker Hub:
- `gabbykoms/bantam-shuttle-frontend:latest`
- `gabbykoms/bantam-shuttle-backend:latest`
- `gabbykoms/bantam-shuttle-tracking:latest`
- `gabbykoms/bantam-shuttle-ai:latest`

## Pre-Deployment Checklist

### 1. Cluster Access
Get cluster access details from your professor:
- [ ] kubectl config file or kubeconfig
- [ ] Cluster API endpoint
- [ ] Access credentials (certificate, token, or username/password)
- [ ] Available namespaces (or permission to create new ones)

**Configure kubectl:**
```bash
# Option 1: Add context from provided kubeconfig
export KUBECONFIG=/path/to/provided/kubeconfig

# Option 2: Merge with existing config
kubectl config view --merge --flatten > ~/.kube/config.backup
KUBECONFIG=~/.kube/config:/path/to/provided/kubeconfig kubectl config view --flatten > ~/.kube/config.new
mv ~/.kube/config.new ~/.kube/config

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 2. Cluster Resources
Check available resources:
```bash
# Check node resources
kubectl top nodes

# Check available storage classes
kubectl get storageclass
```

**Minimum requirements:**
- 4+ CPU cores available
- 8GB+ RAM available
- 30GB+ storage for databases

### 3. Networking & Ingress
Ask your professor about:
- [ ] Does cluster have an ingress controller? (nginx, traefik, etc.)
- [ ] What is the cluster's external IP or domain?
- [ ] Are there any network policies to consider?
- [ ] Can you use LoadBalancer services or only NodePort/ClusterIP?

```bash
# Check for ingress controller
kubectl get pods -n ingress-nginx
kubectl get pods -n kube-system | grep ingress

# Check if cert-manager is installed (for SSL)
kubectl get pods -n cert-manager
```

### 4. Permissions
Verify you have necessary permissions:
```bash
# Check if you can create namespaces
kubectl auth can-i create namespaces

# Check if you can create secrets
kubectl auth can-i create secrets -n bantam-shuttle

# Check if you can create deployments
kubectl auth can-i create deployments -n bantam-shuttle
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

```bash
# Run the deployment script
./deploy-to-k8s.sh
```

The script will prompt you for:
- Supabase URL and keys
- JWT secret
- OpenAI API key
- Database passwords

### Option 2: Manual Deployment

#### Step 1: Create Namespaces

```bash
kubectl apply -f frontend/kubernetes/namespace.yaml
kubectl create namespace trinity
```

#### Step 2: Create Secrets

**Backend secrets:**
```bash
kubectl create secret generic bantam-secrets \
  --from-literal=SUPABASE_URL='https://iarrtqyfimoukixvcizb.supabase.co' \
  --from-literal=SUPABASE_ANON_KEY='your-anon-key' \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  -n bantam-shuttle
```

**Tracking service secrets:**
```bash
kubectl create secret generic tracking-secrets \
  --from-literal=db-username='postgres' \
  --from-literal=db-password='tracking-db-password-here' \
  -n bantam-shuttle
```

**AI service secrets:**
```bash
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY='your-openai-key' \
  --from-literal=DATABASE_PASSWORD='your-supabase-password' \
  -n trinity
```

#### Step 3: Deploy Services

```bash
# Deploy frontend
kubectl apply -k frontend/kubernetes/

# Deploy backend
kubectl apply -k backend/kubernetes/

# Deploy tracking service (includes PostgreSQL and Redis)
kubectl apply -k tracking-service/kubernetes/

# Deploy AI service
kubectl apply -k AI_Intergration_Service/kubernetes/
```

#### Step 4: Wait for Pods to be Ready

```bash
# Watch pods starting up
kubectl get pods -n bantam-shuttle -w
kubectl get pods -n trinity -w

# Check specific pod status
kubectl describe pod <pod-name> -n bantam-shuttle
```

## Accessing the Application

### Method 1: Port Forwarding (for testing)

```bash
# Forward frontend to local port 8080
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-frontend 8080:80

# Access at: http://localhost:8080
```

### Method 2: NodePort (if ingress not available)

If the cluster doesn't have an ingress controller, expose services via NodePort:

```bash
# Create NodePort service for frontend
kubectl patch svc bantam-shuttle-frontend -n bantam-shuttle -p '{"spec":{"type":"NodePort"}}'

# Get the NodePort
kubectl get svc bantam-shuttle-frontend -n bantam-shuttle

# Access via: http://<node-ip>:<node-port>
```

### Method 3: Ingress (if available)

Ask your professor for:
- The ingress controller type (nginx, traefik, etc.)
- Available domain or subdomain
- Whether SSL/TLS is configured

Update ingress files with actual domains:
```bash
# Update frontend ingress
vi frontend/kubernetes/ingress.yaml
# Change: bantam-shuttle.yourdomain.com → bantam-shuttle.homelab.example.com

# Update backend ingress
vi backend/kubernetes/ingress.yaml
# Change: api.bantam-shuttle.yourdomain.com → api.bantam-shuttle.homelab.example.com

# Apply changes
kubectl apply -f frontend/kubernetes/ingress.yaml
kubectl apply -f backend/kubernetes/ingress.yaml
```

## Homelab-Specific Considerations

### 1. Storage Classes
Homelab clusters often use local or NFS storage:

```bash
# Check available storage classes
kubectl get storageclass

# If needed, update PostgreSQL PVC to use available storage class
kubectl edit statefulset tracking-postgres -n bantam-shuttle
# Update: storageClassName: <available-class>
```

### 2. Resource Limits
Adjust if cluster has limited resources:

```bash
# Reduce replicas from 2 to 1 for each service
kubectl scale deployment bantam-shuttle-frontend --replicas=1 -n bantam-shuttle
kubectl scale deployment bantam-shuttle-backend --replicas=1 -n bantam-shuttle
kubectl scale deployment bantam-shuttle-tracking --replicas=1 -n bantam-shuttle
kubectl scale deployment trinity-ai-service --replicas=1 -n trinity
```

### 3. Image Pull Policy
If experiencing slow pulls, use cached images:

```bash
# Update deployments to use IfNotPresent
kubectl patch deployment bantam-shuttle-frontend -n bantam-shuttle \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","imagePullPolicy":"IfNotPresent"}]}}}}'
```

### 4. DNS and Service Discovery
Verify internal DNS is working:

```bash
# From inside a pod
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Inside pod:
nslookup bantam-shuttle-backend.bantam-shuttle.svc.cluster.local
```

## Verification & Testing

### 1. Check Pod Status
```bash
kubectl get pods -n bantam-shuttle
kubectl get pods -n trinity

# Should show all pods as Running with 1/1 or 2/2 Ready
```

### 2. Check Logs
```bash
# Frontend logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-frontend --tail=50

# Backend logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend --tail=50

# Tracking service logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-tracking --tail=50

# AI service logs
kubectl logs -n trinity -l app=trinity-ai-service --tail=50
```

### 3. Test Database Connectivity
```bash
# Test PostgreSQL for tracking service
kubectl run -it --rm psql-test --image=postgres:16 --restart=Never -n bantam-shuttle -- \
  psql -h tracking-postgres -U postgres -d tracking_db

# Test Redis
kubectl run -it --rm redis-test --image=redis:7 --restart=Never -n bantam-shuttle -- \
  redis-cli -h tracking-redis ping
```

### 4. Test API Endpoints
```bash
# Port forward backend
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-backend 8080:8080

# Test health endpoint
curl http://localhost:8080/health

# Test tracking service
kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-tracking 8081:8081
curl http://localhost:8081/actuator/health

# Test AI service
kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083
curl http://localhost:8083/health
```

## Database Setup

### Supabase Migrations
The backend and AI service use Supabase (external managed PostgreSQL):

1. **Backend Database:**
   - Login to: https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb
   - Go to SQL Editor
   - Copy contents of `backend/database-migration.sql`
   - Execute the SQL

2. **AI Service Database:**
   - Login to: https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso
   - Enable pgvector extension
   - Run: `python scripts/ingest_knowledge_base.py`

### Tracking Service Database
The tracking service uses in-cluster PostgreSQL (automatically created):
- Spring Boot will auto-create tables via JPA
- Check logs: `kubectl logs -n bantam-shuttle -l app=bantam-shuttle-tracking`

## Monitoring

### Resource Usage
```bash
# Check pod resource usage
kubectl top pods -n bantam-shuttle
kubectl top pods -n trinity

# Check node usage
kubectl top nodes
```

### Events
```bash
# Watch events for issues
kubectl get events -n bantam-shuttle --sort-by='.lastTimestamp'
kubectl get events -n trinity --sort-by='.lastTimestamp'
```

### Persistent Volume Status
```bash
kubectl get pvc -n bantam-shuttle
kubectl get pv
```

## Troubleshooting

### Pods Not Starting
```bash
# Check pod details
kubectl describe pod <pod-name> -n bantam-shuttle

# Common issues:
# - ImagePullBackOff: Check Docker Hub credentials or use public images
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check resource availability or PVC binding
```

### Database Connection Issues
```bash
# Check secrets are created
kubectl get secrets -n bantam-shuttle
kubectl get secrets -n trinity

# Verify environment variables in pods
kubectl exec -it <pod-name> -n bantam-shuttle -- env | grep -i database
```

### Network Issues
```bash
# Test service connectivity from within cluster
kubectl run -it --rm test --image=curlimages/curl --restart=Never -n bantam-shuttle -- \
  curl http://bantam-shuttle-backend:8080/health

# Check service endpoints
kubectl get endpoints -n bantam-shuttle
```

### Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n bantam-shuttle
kubectl describe ingress bantam-shuttle-frontend -n bantam-shuttle

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Cleanup

To remove all resources:
```bash
# Use cleanup script
./cleanup-k8s.sh

# Or manually
kubectl delete namespace bantam-shuttle
kubectl delete namespace trinity
```

## Questions to Ask Your Professor

Before deployment, confirm:

1. **Network Access:**
   - What's the cluster's external access method? (NodePort, LoadBalancer, Ingress)
   - Any firewall rules to configure?
   - Available domain names or IPs?

2. **Storage:**
   - Preferred StorageClass for persistent volumes?
   - Storage quotas or limits?

3. **Security:**
   - Any network policies in place?
   - Pod security policies or standards?
   - RBAC restrictions?

4. **Resources:**
   - Resource quotas per namespace?
   - Preferred node selectors or affinity rules?

5. **Monitoring:**
   - Existing monitoring tools? (Prometheus, Grafana)
   - Logging infrastructure? (ELK, Loki)

6. **External Services:**
   - Can pods access external APIs? (Supabase, OpenAI)
   - Any proxy configuration needed?

## Support

If you encounter issues:
1. Check logs: `kubectl logs -n <namespace> <pod-name>`
2. Check events: `kubectl get events -n <namespace>`
3. Check pod status: `kubectl describe pod <pod-name> -n <namespace>`
4. Contact your professor for cluster-specific configurations

## Success Criteria

✅ All pods running and ready
✅ Services accessible (via port-forward, NodePort, or ingress)
✅ Database connections working
✅ Frontend loads and displays map
✅ User authentication works
✅ Real-time tracking updates
✅ AI chatbot responds to queries

---

**Note:** This is a homelab environment, so some enterprise features (like automatic SSL, advanced monitoring, or service mesh) may not be available. Adjust accordingly based on your professor's cluster capabilities.
