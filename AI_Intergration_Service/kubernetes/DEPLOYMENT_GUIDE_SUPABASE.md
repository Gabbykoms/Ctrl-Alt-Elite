# Kubernetes Deployment Guide - Option A (Supabase)

This guide walks you through deploying the Trinity Shuttle AI Service to Kubernetes using Supabase (no local PostgreSQL).

## Prerequisites

- `kubectl` installed and configured to connect to your cluster
- Access to your Supabase project (connection details already in ConfigMap)
- Your OpenAI API key
- Your Supabase credentials (optional, if using SUPABASE_KEY)

## Step 1: Verify Cluster Access

```bash
kubectl cluster-info
kubectl get nodes
```

You should see your cluster information and at least one node.

## Step 2: Create Secrets

⚠️ **IMPORTANT:** Never commit secrets to Git. Use `kubectl create secret` to inject them at deployment time.

The following secrets are required:

### Option A: Create via Command Line (Recommended)

```bash
# Navigate to kubernetes directory
cd AI_Intergration_Service/kubernetes

# Create the secret in the trinity namespace
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY='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' \
  -n trinity --dry-run=client -o yaml | kubectl apply -f -
```

Replace the value with your actual OpenAI API key.

### Option B: If Secret Already Exists, Update It

```bash
# Delete the old secret
kubectl delete secret trinity-ai-secret -n trinity

# Create a new one with updated values
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY='your-actual-openai-key-here' \
  -n trinity
```

## Step 3: Deploy Everything

```bash
# From the AI_Intergration_Service/kubernetes directory
kubectl apply -k .
```

This will deploy (in order):
1. Namespace (`trinity`)
2. ConfigMap (configuration)
3. Secret (API keys)
4. RBAC (service accounts and permissions)
5. Deployment (AI service with 2 replicas)
6. Service (internal networking)

## Step 4: Verify Deployment

```bash
# Check namespace exists
kubectl get namespace trinity

# Check all resources in the trinity namespace
kubectl get all -n trinity

# Watch pods until they're running
kubectl get pods -n trinity -w

# Check pod status (wait for "Running" state)
kubectl get pods -n trinity
```

Expected output:
```
NAME                                   READY   STATUS    RESTARTS   AGE
trinity-ai-service-7c5d9f8b4d-abc12    1/1     Running   0          30s
trinity-ai-service-7c5d9f8b4d-xyz89    1/1     Running   0          28s
```

## Step 5: Check Logs

```bash
# View logs from all pods
kubectl logs -n trinity -l app=trinity-ai-service --tail=100 -f

# Or from a specific pod
kubectl logs -n trinity trinity-ai-service-7c5d9f8b4d-abc12 -f
```

## Step 6: Test the Service

### Option A: Port Forward (Local Testing)

```bash
# Forward local port 8083 to service
kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083

# In another terminal, test the health endpoint
curl http://localhost:8083/health

# Test the API
curl -X POST http://localhost:8083/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the shuttle hours?"}'
```

### Option B: Configure Ingress (External Access)

Edit `ingress.yaml` before deployment:

```yaml
- host: your-actual-domain.com  # Change this!
  http:
    paths:
    - path: /
      pathType: Prefix
```

Then:

```bash
kubectl apply -f ingress.yaml
```

Access at: `https://your-actual-domain.com`

## Step 7: Common Issues & Troubleshooting

### Pods Not Running

```bash
# Check pod status
kubectl describe pod -n trinity <pod-name>

# Common reasons:
# 1. Image pull failed - check if image exists in ghcr.io
# 2. Secret missing - verify trinity-ai-secret exists
# 3. Config missing - verify trinity-ai-config exists
```

### Database Connection Failed

```bash
# Check if DATABASE_URL is correct in ConfigMap
kubectl get configmap trinity-ai-config -n trinity -o yaml | grep DATABASE_URL

# Should show your Supabase connection string
```

### Image Pull Failures

```bash
# Check image availability
kubectl describe pod -n trinity <pod-name> | grep -A 5 "Events:"

# Solutions:
# 1. Verify image exists: docker pull ghcr.io/gabbykoms/trinity-ai-service:latest
# 2. Configure image pull secret if registry is private
# 3. Check internet connectivity from cluster nodes
```

### CrashLoopBackOff Status

```bash
# Get detailed error messages
kubectl logs -n trinity <pod-name> --previous

# Common causes:
# 1. Missing environment variables
# 2. Invalid database connection string
# 3. Invalid OpenAI API key
```

## Step 8: Scale the Deployment

Change the number of replicas:

```bash
# Scale to 3 replicas
kubectl scale deployment trinity-ai-service -n trinity --replicas=3

# Verify scaling
kubectl get pods -n trinity
```

## Step 9: Update the Deployment

When you push a new Docker image:

```bash
# Trigger a rollout with the latest image
kubectl rollout restart deployment/trinity-ai-service -n trinity

# Watch the rollout
kubectl rollout status deployment/trinity-ai-service -n trinity -w
```

## Step 10: Clean Up

To delete the entire deployment:

```bash
kubectl delete namespace trinity
```

This will delete all resources in the namespace.

## Production Checklist

- [ ] Tested deployment in staging cluster
- [ ] Verified all pods are running and healthy
- [ ] Tested API endpoints (health, chat)
- [ ] Configured proper domain in ingress
- [ ] Set up TLS/HTTPS certificates
- [ ] Enabled persistent logging
- [ ] Configured monitoring/alerting
- [ ] Set up automated backups for Supabase
- [ ] Configured resource quotas for namespace
- [ ] Tested rollback procedures

## Environment Variables Summary

Your deployment uses these sources for configuration:

| Variable | Source | Purpose |
|----------|--------|---------|
| `SERVICE_NAME` | ConfigMap | Service identifier |
| `DATABASE_URL` | ConfigMap | Supabase connection string |
| `OPENAI_API_KEY` | Secret | OpenAI API authentication |
| `EMBEDDING_MODEL` | ConfigMap | Text embedding model |
| `CHAT_MODEL` | ConfigMap | LLM model for responses |
| `SIMILARITY_THRESHOLD` | ConfigMap | RAG retrieval threshold |
| `ALLOWED_ORIGINS` | ConfigMap | CORS origins |

## Next Steps

1. Deploy to your cluster following Steps 1-4
2. Verify pods are running (Step 4)
3. Test endpoints locally (Step 6)
4. Configure ingress for production (if needed)
5. Set up monitoring and logging
6. Document your deployment process
