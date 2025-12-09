# Bantam Shuttle - GKE Deployment Guide

## 🎓 For Google Cloud for Students Users

This guide is optimized for students using Google Cloud's free tier ($300 credits). The default configuration uses:
- **e2-medium** instances (2 vCPU, 4GB RAM) - cost-effective
- **2 nodes** with autoscaling (1-3 nodes) - saves credits
- **Standard persistent disk** - cheapest storage option

Estimated cost: **~$50-70/month** (your $300 credits will last 4-6 months)

### Apply for Student Credits
If you haven't already:
1. Visit https://cloud.google.com/edu/students
2. Sign up with your .edu email (gkoomson@trincoll.edu)
3. Get $300 in credits (no credit card required for first year)

## Prerequisites

### 1. Google Cloud Setup
```bash
# Install gcloud CLI (if not already installed)
# macOS:
brew install --cask google-cloud-sdk

# Initialize gcloud with your student account
gcloud init

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify you're using your student account
gcloud auth list
```

### 2. Enable Required APIs
```bash
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
```

### 3. Install kubectl (if not already installed)
```bash
gcloud components install kubectl
```

## Step 1: Create GKE Cluster

### Option A: Student-Optimized Cluster (Recommended - Uses ~$50-70/month)
```bash
gcloud container clusters create bantam-shuttle-cluster \
  --zone us-central1-a \
  --machine-type e2-medium \
  --num-nodes 2 \
  --disk-size 30 \
  --disk-type pd-standard \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 3 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --network "default" \
  --subnetwork "default" \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver
```

### Option B: Production Cluster (More expensive - ~$145/month)
```bash
gcloud container clusters create bantam-shuttle-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-2 \
  --num-nodes 3 \
  --disk-size 50 \
  --disk-type pd-standard \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --network "default" \
  --subnetwork "default" \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver
```

### Option C: Autopilot Cluster (Fully Managed - ~$40-60/month)
```bash
# Best for beginners - Google manages everything!
gcloud container clusters create-auto bantam-shuttle-cluster \
  --region us-central1
```

**💡 Autopilot Recommendation**: If this is your first time with Kubernetes, use Autopilot!
- No node management needed
- Pay only for pod resources
- Automatic scaling and upgrades
- Potentially cheaper than standard cluster

### Get Cluster Credentials
```bash
gcloud container clusters get-credentials bantam-shuttle-cluster --zone us-central1-a
# Or for Autopilot:
gcloud container clusters get-credentials bantam-shuttle-cluster --region us-central1
```

## Step 2: Prepare Secrets

### Create a secrets file (DO NOT COMMIT THIS)
```bash
cat > gke-secrets.env << 'EOF'
# Backend Supabase (iarrtqyfimoukixvcizb)
SUPABASE_URL=https://iarrtqyfimoukixvcizb.supabase.co
SUPABASE_ANON_KEY=your-backend-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-backend-service-role-key
JWT_SECRET=your-jwt-secret

# AI Service Supabase (bwijyokpoqewpwbwwfso)
AI_DATABASE_URL=postgresql://postgres.[PASSWORD]@db.bwijyokpoqewpwbwwfso.supabase.co:6543/postgres
AI_SUPABASE_URL=https://bwijyokpoqewpwbwwfso.supabase.co
AI_SUPABASE_KEY=your-ai-anon-key
AI_OPENAI_API_KEY=sk-proj-...

# Tracking Service Database
DB_USERNAME=postgres
DB_PASSWORD=secure-password-here
EOF
```

### Load secrets
```bash
source gke-secrets.env
```

## Step 3: Deploy to GKE

### Use the deployment script
```bash
# Make sure you're in the project root
cd /path/to/Ctrl-Alt-Elite

# Load environment variables
source gke-secrets.env

# Run deployment
./deploy-gke.sh
```

Or deploy manually:

```bash
# Create namespaces
kubectl create namespace bantam-shuttle
kubectl create namespace trinity

# Create secrets
kubectl create secret generic bantam-secrets \
  --from-literal=supabase-url="$SUPABASE_URL" \
  --from-literal=supabase-anon-key="$SUPABASE_ANON_KEY" \
  --from-literal=supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  -n bantam-shuttle

kubectl create secret generic tracking-secrets \
  --from-literal=db-username="$DB_USERNAME" \
  --from-literal=db-password="$DB_PASSWORD" \
  -n bantam-shuttle

kubectl create secret generic trinity-ai-secret \
  --from-literal=AI_OPENAI_API_KEY="$AI_OPENAI_API_KEY" \
  --from-literal=AI_DATABASE_URL="$AI_DATABASE_URL" \
  -n trinity

# Deploy services
kubectl apply -k frontend/kubernetes/
kubectl apply -k backend/kubernetes/
kubectl apply -k tracking-service/kubernetes/
kubectl apply -k AI_Intergration_Service/kubernetes/
```

## Step 4: Configure Ingress (External Access)

### Option A: Using GKE Ingress (Load Balancer)

Create `gke-ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bantam-shuttle-ingress
  namespace: bantam-shuttle
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "bantam-shuttle-ip"
    networking.gke.io/managed-certificates: "bantam-shuttle-cert"
spec:
  rules:
  - host: bantam.yourdomain.com
    http:
      paths:
      - path: /api/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: bantam-shuttle-backend
            port:
              number: 8080
      - path: /tracking/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: tracking-service
            port:
              number: 8081
      - path: /ai/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: trinity-ai-service
            port:
              number: 8083
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: bantam-shuttle-frontend
            port:
              number: 80
```

Reserve a static IP:
```bash
gcloud compute addresses create bantam-shuttle-ip --global
gcloud compute addresses describe bantam-shuttle-ip --global
```

Apply ingress:
```bash
kubectl apply -f gke-ingress.yaml
```

### Option B: Using LoadBalancer Services

Update service types to LoadBalancer:
```bash
kubectl patch svc bantam-shuttle-frontend -n bantam-shuttle -p '{"spec":{"type":"LoadBalancer"}}'
```

Get external IP:
```bash
kubectl get svc bantam-shuttle-frontend -n bantam-shuttle
```

## Step 5: Configure DNS

Once you have the external IP:
```bash
# Get the IP
kubectl get ingress bantam-shuttle-ingress -n bantam-shuttle

# Add DNS A record pointing to this IP
# Example: bantam.yourdomain.com -> 34.120.xxx.xxx
```

## Step 6: Enable HTTPS (Optional but Recommended)

### Using Google-managed certificates:
```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: bantam-shuttle-cert
  namespace: bantam-shuttle
spec:
  domains:
    - bantam.yourdomain.com
```

Apply:
```bash
kubectl apply -f managed-cert.yaml
```

## Step 7: Verify Deployment

```bash
# Check all pods
kubectl get pods -n bantam-shuttle
kubectl get pods -n trinity

# Check services
kubectl get svc -n bantam-shuttle
kubectl get svc -n trinity

# Check ingress
kubectl get ingress -n bantam-shuttle

# View logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend --tail=50
kubectl logs -n trinity -l app=trinity-ai-service --tail=50
```

## Step 8: Update Frontend Environment

You'll need to rebuild the frontend with the production URLs:

```bash
cd frontend
docker build \
  --build-arg VITE_SUPABASE_URL="https://iarrtqyfimoukixvcizb.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg VITE_API_BASE_URL="https://bantam.yourdomain.com/api" \
  --build-arg VITE_TRACKING_SERVICE_URL="https://bantam.yourdomain.com/tracking" \
  --build-arg VITE_AI_SERVICE_URL="https://bantam.yourdomain.com/ai" \
  --build-arg VITE_MAPBOX_TOKEN="your-mapbox-token" \
  -t gabbykoms/bantam-shuttle-frontend:gke \
  .

docker push gabbykoms/bantam-shuttle-frontend:gke
```

Update the deployment to use the new image tag.

## Monitoring & Maintenance

### View cluster info
```bash
gcloud container clusters describe bantam-shuttle-cluster --zone us-central1-a
```

### Scale deployments
```bash
kubectl scale deployment bantam-shuttle-backend --replicas=3 -n bantam-shuttle
```

### Update a service
```bash
kubectl set image deployment/bantam-shuttle-backend \
  backend=gabbykoms/bantam-shuttle-backend:latest \
  -n bantam-shuttle

kubectl rollout status deployment/bantam-shuttle-backend -n bantam-shuttle
```

### View logs
```bash
# Real-time logs
kubectl logs -f -n bantam-shuttle -l app=bantam-shuttle-backend

# Using Google Cloud Logging
gcloud logging read "resource.type=k8s_container AND resource.labels.namespace_name=bantam-shuttle" --limit 50
```

### Set up monitoring
```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

## 💰 Cost Optimization for Students

### Maximize Your $300 Credits:

**1. Use the smallest machine type that works:**
```bash
# Current setup: e2-medium (2 vCPU, 4GB) - ~$50/month
# More budget: e2-small (2 vCPU, 2GB) - ~$25/month (may be tight)
# Minimum: e2-micro (2 vCPU, 1GB) - ~$7/month (likely too small)
```

**2. Reduce replica counts in deployments:**
```bash
# Edit deployments to use 1 replica instead of 2 for testing
kubectl scale deployment bantam-shuttle-backend --replicas=1 -n bantam-shuttle
kubectl scale deployment bantam-shuttle-frontend --replicas=1 -n bantam-shuttle
```

**3. Use Autopilot (recommended for students):**
- Only pay for actual pod usage
- No wasted node capacity
- Estimated: $40-60/month

**4. Stop cluster when not in use:**
```bash
# Delete cluster on weekends/breaks
gcloud container clusters delete bantam-shuttle-cluster --zone us-central1-a

# Redeploy when needed with ./deploy-gke.sh (takes ~10 minutes)
```

**5. Monitor your spending:**
```bash
# Check current costs
gcloud billing accounts list
gcloud billing projects describe YOUR_PROJECT_ID

# Set up budget alerts in Cloud Console
```

**6. Use preemptible nodes (advanced - saves 80%):**
```bash
# Preemptible nodes are much cheaper but can be shut down
--preemptible
# Note: Not recommended for production, but fine for development
```

### Expected Monthly Costs:
- **Current Config (e2-medium × 2)**: ~$50-70/month → **4-6 months of runtime**
- **With Autopilot**: ~$40-60/month → **5-7 months of runtime**  
- **Optimized (e2-small × 2, 1 replica each)**: ~$30-40/month → **7-10 months of runtime**
- **Bare minimum (e2-micro × 1)**: ~$15-20/month → **15+ months of runtime** (may have performance issues)

## Cleanup

### Delete specific resources
```bash
kubectl delete -k frontend/kubernetes/
kubectl delete -k backend/kubernetes/
kubectl delete -k tracking-service/kubernetes/
kubectl delete -k AI_Intergration_Service/kubernetes/
kubectl delete namespace bantam-shuttle trinity
```

### Delete the entire cluster
```bash
gcloud container clusters delete bantam-shuttle-cluster --zone us-central1-a
```

### Delete static IP
```bash
gcloud compute addresses delete bantam-shuttle-ip --global
```

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n bantam-shuttle
kubectl logs <pod-name> -n bantam-shuttle --previous
```

### Check node resources
```bash
kubectl top nodes
kubectl top pods -n bantam-shuttle
```

### Ingress not working
```bash
kubectl describe ingress bantam-shuttle-ingress -n bantam-shuttle
kubectl get events -n bantam-shuttle --sort-by='.lastTimestamp'
```

### Database connection issues
- Verify secrets are correctly created
- Check if Supabase allows connections from GKE IP range
- Test connection from a pod:
  ```bash
  kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
    psql "postgresql://postgres:password@db.bwijyokpoqewpwbwwfso.supabase.co:6543/postgres"
  ```

## Security Best Practices

1. **Use Workload Identity** instead of service account keys
2. **Enable Binary Authorization** to ensure only verified images run
3. **Use Network Policies** to restrict pod-to-pod communication
4. **Regularly update** cluster and node versions
5. **Use Secret Manager** for sensitive data instead of Kubernetes secrets
6. **Enable audit logging**
7. **Set up monitoring and alerting**

## 💵 Estimated Costs for Students

### Student-Optimized Config (Default - e2-medium × 2):
- Cluster management: Free (GKE management fee waived)
- Compute (e2-medium × 2): ~$48/month
- Load Balancer: ~$18/month
- Disk (60GB total): ~$6/month
- **Total: ~$72/month → Your $300 credits last ~4 months**

### Autopilot Cluster (Recommended for beginners):
- Pay only for pod resources
- Estimated: ~$50-60/month for this workload
- No node management overhead
- **Total: ~$55/month → Your $300 credits last ~5.5 months**

### Ultra-Budget Config (e2-small × 1):
- Compute (e2-small × 1): ~$12/month
- Load Balancer: ~$18/month
- Disk (30GB): ~$3/month
- **Total: ~$33/month → Your $300 credits last ~9 months**
- Note: May have performance limitations with 1 node

### Production Config (e2-standard-2 × 3):
- Compute: ~$145/month
- Load Balancer: ~$18/month
- **Total: ~$163/month → Your $300 credits last ~2 months**
- Only use this if you need production-level reliability

*Prices are estimates for us-central1 region and may vary*

**💡 Pro Tip**: Start with the default student-optimized config or Autopilot. You can always scale up if you need more resources. Monitor your spending in the Google Cloud Console!

---

**Note**: Update `bantam.yourdomain.com` with your actual domain throughout this guide.
