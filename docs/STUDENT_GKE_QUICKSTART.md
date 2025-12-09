# 🎓 Student Quick Start - Deploy to GKE Free Tier

**For Trinity College students using Google Cloud for Students ($300 free credits)**

## ⚡ 5-Minute Deployment

### 1️⃣ One-Time Setup (First time only)

```bash
# Install gcloud CLI if you haven't already
brew install --cask google-cloud-sdk

# Login with your Trinity email
gcloud auth login

# Create a new project
gcloud projects create bantam-shuttle-prod --name="Bantam Shuttle"

# Set as active project
gcloud config set project bantam-shuttle-prod

# Enable billing (use your student credits)
# Go to: https://console.cloud.google.com/billing
# Link your project to your student billing account
```

### 2️⃣ Prepare Your Secrets

```bash
# Copy the template
cp gke-secrets.env.template gke-secrets.env

# Edit with your actual values
nano gke-secrets.env
```

Required values:
- **Backend Supabase**: Get from https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb/settings/api
- **AI Supabase**: Get from https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso/settings/api  
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys

### 3️⃣ Deploy! 🚀

```bash
# Load your secrets
source gke-secrets.env

# Deploy to GKE (takes ~10 minutes)
./deploy-gke.sh
```

That's it! The script will:
- ✅ Create a cost-optimized GKE cluster (2 nodes, e2-medium)
- ✅ Deploy all 4 microservices
- ✅ Set up external access
- ✅ Give you the URL to access your app

### 4️⃣ Access Your App

After deployment completes, you'll see:
```
Application is accessible at:
  Frontend: http://34.xxx.xxx.xxx
```

Visit that URL in your browser! 🎉

## 💰 Cost Management

### Your Credits Status

Check remaining credits:
```bash
gcloud billing accounts list
```

View spending so far:
- Visit: https://console.cloud.google.com/billing

### Expected Costs

With the default student-optimized configuration:
- **~$50-70/month** 
- Your **$300 credits will last 4-6 months**

### Save More Money

**Option 1: Use Autopilot (Recommended)**
```bash
# Delete standard cluster
gcloud container clusters delete bantam-shuttle-cluster --zone us-central1-a

# Create Autopilot cluster (more efficient)
gcloud container clusters create-auto bantam-shuttle-cluster --region us-central1

# Get credentials
gcloud container clusters get-credentials bantam-shuttle-cluster --region us-central1

# Redeploy
source gke-secrets.env
./deploy-gke.sh
```
Cost: **~$40-50/month → Credits last 6+ months**

**Option 2: Scale Down Replicas**
```bash
# Run with 1 replica of each service instead of 2
kubectl scale deployment bantam-shuttle-backend --replicas=1 -n bantam-shuttle
kubectl scale deployment bantam-shuttle-frontend --replicas=1 -n bantam-shuttle
kubectl scale deployment tracking-service --replicas=1 -n bantam-shuttle
kubectl scale deployment trinity-ai-service --replicas=1 -n trinity
```
Cost: **~$40-50/month → Credits last 6+ months**

**Option 3: Stop When Not Using**
```bash
# Delete cluster on weekends/breaks
gcloud container clusters delete bantam-shuttle-cluster --zone us-central1-a

# Redeploy when needed (takes ~10 minutes)
source gke-secrets.env && ./deploy-gke.sh
```
Cost: **Only pay when running!**

## 🛠️ Common Commands

### View Your App Status
```bash
# See all pods
kubectl get pods -n bantam-shuttle
kubectl get pods -n trinity

# Check if everything is running
kubectl get all -n bantam-shuttle

# Get external IP
kubectl get svc bantam-shuttle-frontend-lb -n bantam-shuttle
```

### View Logs
```bash
# Backend logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend --tail=50

# AI service logs
kubectl logs -n trinity -l app=trinity-ai-service --tail=50

# Frontend logs
kubectl logs -n bantam-shuttle -l app=bantam-shuttle-frontend --tail=50
```

### Update Your App
```bash
# After making code changes and pushing new Docker images:

# Update backend
kubectl rollout restart deployment bantam-shuttle-backend -n bantam-shuttle

# Update frontend  
kubectl rollout restart deployment bantam-shuttle-frontend -n bantam-shuttle

# Update AI service
kubectl rollout restart deployment trinity-ai-service -n trinity
```

### Scale Your App
```bash
# Increase backend replicas
kubectl scale deployment bantam-shuttle-backend --replicas=3 -n bantam-shuttle

# Decrease to save money
kubectl scale deployment bantam-shuttle-backend --replicas=1 -n bantam-shuttle
```

## 🐛 Troubleshooting

### Pod is crashing or not starting
```bash
# Check pod status
kubectl get pods -n bantam-shuttle

# See what's wrong
kubectl describe pod <pod-name> -n bantam-shuttle

# View error logs
kubectl logs <pod-name> -n bantam-shuttle
```

### Can't access the application
```bash
# Check if LoadBalancer has external IP
kubectl get svc bantam-shuttle-frontend-lb -n bantam-shuttle

# If EXTERNAL-IP shows <pending>, wait a few minutes
# It takes 3-5 minutes for GCP to assign an IP
```

### Database connection issues
```bash
# Check secrets are set correctly
kubectl get secret trinity-ai-secret -n trinity -o yaml

# Verify Supabase connection from a pod
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql "postgresql://postgres.bwijyokpoqewpwbwwfso:<PASSWORD>@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

### Out of credits
- Apply for GitHub Student Developer Pack (includes more cloud credits)
- Use AWS Educate or Azure for Students as alternatives
- Run locally with `./deploy-local.sh` instead

## 📊 Monitoring Your Cluster

### View resource usage
```bash
# Node usage
kubectl top nodes

# Pod usage
kubectl top pods -n bantam-shuttle
kubectl top pods -n trinity
```

### Set up budget alerts

1. Go to https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Create budget:
   - Budget amount: $50/month
   - Alert at: 50%, 75%, 90%, 100%
   - Add your email for notifications

This way you'll know if costs are higher than expected!

## 🔒 Security Reminders

- ✅ Never commit `gke-secrets.env` to git (it's in .gitignore)
- ✅ Use different Supabase projects for dev/prod
- ✅ Rotate your OpenAI API key periodically
- ✅ Enable 2FA on your Google Cloud account
- ✅ Don't share your cluster credentials

## 🚀 Advanced: Custom Domain & HTTPS

Want `bantam.yourdomain.com` instead of an IP?

1. **Buy a domain** (or use a free subdomain):
   - Freenom: Free domains (.tk, .ml, .ga)
   - Namecheap: ~$3/year for .dev domains (students)
   - Google Domains: ~$12/year

2. **Set up DNS**:
   ```bash
   # Get your LoadBalancer IP
   kubectl get svc bantam-shuttle-frontend-lb -n bantam-shuttle
   
   # Add DNS A record:
   # bantam.yourdomain.com → 34.xxx.xxx.xxx
   ```

3. **Enable HTTPS** (see full guide in GKE_DEPLOYMENT.md)

## 📚 Learn More

- **Full Deployment Guide**: See `GKE_DEPLOYMENT.md`
- **Kubernetes Basics**: https://kubernetes.io/docs/tutorials/
- **GKE Documentation**: https://cloud.google.com/kubernetes-engine/docs
- **Cost Optimization**: https://cloud.google.com/blog/topics/startups/gcp-cost-optimization-for-startups

## 🆘 Need Help?

**Common issues solved here**: See "Troubleshooting" section in `GKE_DEPLOYMENT.md`

**Still stuck?**
- Check cluster events: `kubectl get events -n bantam-shuttle --sort-by='.lastTimestamp'`
- View all logs: `kubectl logs -n trinity -l app=trinity-ai-service --tail=100`
- Contact: gkoomson@trincoll.edu

---

**🎉 Congratulations!** You've deployed a production-grade microservices application to Google Cloud!

**Next Steps**:
1. Test all features (login, maps, shuttle tracking, AI chatbot)
2. Share the URL with your team/professor
3. Monitor your costs and set up budget alerts
4. Consider setting up a custom domain
5. Keep your Docker images updated

*Your $300 credits should easily last through the semester with this configuration!*
