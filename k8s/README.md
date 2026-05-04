# DigitalOcean Kubernetes Deployment

Kubernetes manifests for deploying the Bantam Shuttle frontend and backend to a DigitalOcean Kubernetes cluster.

## Prerequisites

- [doctl](https://docs.digitalocean.com/reference/doctl/) CLI installed and authenticated
- [kubectl](https://kubernetes.io/docs/tasks/tools/) connected to your DO cluster
- [Docker](https://www.docker.com/) installed
- Access to the DigitalOcean container registry (`bantam-shuttle-registry`)

## 1. Build Images

Images must be built for `linux/amd64` since DO cluster nodes run on AMD64 architecture. From the project root:

```bash
cd frontend
# docker build --platform linux/amd64 -f Dockerfile -t registry.digitalocean.com/bantam-shuttle-registry/frontend:2.0.0 .
docker build --platform linux/amd64 \
  --build-arg VITE_MAPBOX_TOKEN="pk.eyJ1IjoiZ2FiYnlrb21zIiwiYSI6ImNtaGgzdGpwbjBmb2UybXB3ZXc0ZHU0NGYifQ.Ls2t9Ctp5eIdt6PZCoA2rQ" \
  --build-arg VITE_API_BASE_URL="http://localhost:8080/api" \
  --build-arg VITE_SOCKET_URL="ws://localhost:8080" \
  -f Dockerfile \
  -t registry.digitalocean.com/bantam-shuttle-registry/frontend:2.0.0 .

cd ../backend
docker build --platform linux/amd64 -f Dockerfile -t registry.digitalocean.com/bantam-shuttle-registry/backend:2.0.0 .

cd ../tracking-service
docker build --platform linux/amd64 -f Dockerfile -t registry.digitalocean.com/bantam-shuttle-registry/tracking-service:2.0.0 .
```

## 2. Push Images

```bash
docker push registry.digitalocean.com/bantam-shuttle-registry/frontend:2.0.0
docker push registry.digitalocean.com/bantam-shuttle-registry/backend:2.0.0
docker push registry.digitalocean.com/bantam-shuttle-registry/tracking-service:2.0.0
```

## 3. Registry Integration

Ensure your DO Kubernetes cluster can pull from the registry:

```bash
doctl registry kubernetes-manifest | kubectl apply -f -
```

This creates the `bantam-shuttle-registry` image pull secret in your cluster.

## 4. Configure Secrets

1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Generate `secrets.yaml` using the provided script:
   ```bash
   ./generate-secrets.sh
   ```

   This reads from `.env` and creates `secrets.yaml` with the correct key names for the backend deployment.

## 5. Update ConfigMap

Edit `configmap.yaml` and set `frontend-url` to your actual domain or `http://localhost:3000` for local testing.

## 6. Deploy

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f tracking-deployment.yaml
kubectl apply -f tracking-service.yaml
```

## 7. Verify

```bash
kubectl get pods -n elite-dev
kubectl get svc -n elite-dev
```

## Port-Forward (Local Testing)

To access the services locally without an ingress:

```bash
kubectl port-forward svc/bantam-shuttle-backend 8080:8080 -n elite-dev &
kubectl port-forward svc/bantam-shuttle-frontend 3000:80 -n elite-dev &
kubectl port-forward svc/bantam-shuttle-tracking 8081:8081 -n elite-dev &

# after we are done with port forward
kill $(lsof -ti:8080,3000,8081)
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Tracking: http://localhost:8081

Make sure `configmap.yaml` has `frontend-url` set to `http://localhost:3000` for CORS to work.

## Ingress (External Access)

To expose services externally, install the NGINX ingress controller and apply the ingress manifest:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/do/deploy.yaml
kubectl apply -f ingress.yaml
```

## Files

| File | Description |
|------|-------------|
| `namespace.yaml` | Creates the `elite-dev` namespace |
| `configmap.yaml` | Non-sensitive config (frontend URL, service URLs) |
| `secrets.yaml` | Sensitive config (Supabase keys, JWT secret) — gitignored |
| `frontend-deployment.yaml` | Frontend deployment (nginx serving built React app) |
| `frontend-service.yaml` | Frontend ClusterIP service (port 80) |
| `backend-deployment.yaml` | Backend deployment (Node.js Express API) |
| `backend-service.yaml` | Backend ClusterIP service (port 8080) |
| `tracking-deployment.yaml` | Tracking service deployment (Spring Boot, port 8081) |
| `tracking-service.yaml` | Tracking service ClusterIP service (port 8081) |
| `ingress.yaml` | NGINX ingress routing rules |
| `generate-secrets.sh` | Script to generate `secrets.yaml` from `.env` |
| `.env.example` | Template for required environment variables |
| `.env` | Actual environment variables — gitignored |