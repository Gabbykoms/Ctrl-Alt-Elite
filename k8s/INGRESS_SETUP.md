# Ingress Setup & Deployment Walkthrough

This document covers how the NGINX ingress was set up for the Bantam Shuttle cluster on DigitalOcean Kubernetes, and how to repeat this process in the future.

---

## What We Did

### 1. Installed the NGINX Ingress Controller

The NGINX ingress controller creates a DigitalOcean LoadBalancer that acts as the single entry point for all external traffic.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/do/deploy.yaml
```

Wait for the controller pod to be running:

```bash
kubectl get pods -n ingress-nginx -w
```

### 2. Got the External IP

Once the LoadBalancer was provisioned by DigitalOcean (takes 2-3 minutes):

```bash
kubectl get svc -n ingress-nginx
```

The `EXTERNAL-IP` column on `ingress-nginx-controller` is your public IP.

### 3. Pointed the Domain to the External IP

Added an A record in DuckDNS pointing `bantam-shuttle.duckdns.org` to the external IP `165.227.252.30`.

### 4. Fixed the PROXY Protocol Issue

The DigitalOcean-specific NGINX ingress manifest enables PROXY protocol by default. This caused port 80 to refuse connections. Fixed by patching the ingress ConfigMap:

```bash
kubectl patch configmap ingress-nginx-controller -n ingress-nginx --type merge -p '{"data":{"use-proxy-protocol":"false"}}'
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

Wait for the rollout:

```bash
kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx
```

### 5. Disabled SSL Redirect

Since there is no TLS certificate yet, the default HTTP→HTTPS redirect causes empty replies. Disabled it by adding this annotation to `ingress.yaml`:

```yaml
nginx.ingress.kubernetes.io/ssl-redirect: "false"
```

Then reapplied:

```bash
kubectl apply -f ingress.yaml
```

### 6. Updated ConfigMap with Domain

Updated `configmap.yaml` to use the domain instead of the raw IP:

```yaml
frontend-url: "http://bantam-shuttle.duckdns.org"
```

Applied:

```bash
kubectl apply -f configmap.yaml
```

### 7. Rebuilt Frontend Image with Domain URLs

The Vite environment variables are baked into the frontend at build time. Updated `frontend/.env.cluster` to use the domain, then rebuilt:

```bash
cd frontend
set -a && source .env.cluster && set +a
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL \
  --build-arg VITE_SOCKET_URL \
  --build-arg VITE_TRACKING_SERVICE_URL \
  --build-arg VITE_MAPBOX_TOKEN \
  -f Dockerfile \
  -t registry.digitalocean.com/bantam-shuttle-registry/frontend:2.0.3 .

docker push registry.digitalocean.com/bantam-shuttle-registry/frontend:2.0.3
```

Updated `frontend-deployment.yaml` to the new image tag, then redeployed:

```bash
kubectl apply -f frontend-deployment.yaml
kubectl rollout restart deployment/bantam-shuttle-backend -n elite-dev
```

---

## Traffic Routing

All external traffic enters through a single LoadBalancer IP and is routed by the ingress:

| Path | Service | Port |
|------|---------|------|
| `/api` | bantam-shuttle-backend | 8080 |
| `/api-docs` | bantam-shuttle-backend | 8080 |
| `/socket.io` | bantam-shuttle-backend | 8080 |
| `/health` | bantam-shuttle-backend | 8080 |
| `/v1` | bantam-shuttle-tracking | 8081 |
| `/` | bantam-shuttle-frontend | 80 |

---

## How to Repeat This in the Future

### If you redeploy to a new cluster:

1. Install the NGINX ingress controller (same command above)
2. Wait for the `EXTERNAL-IP` to be assigned
3. Update your DNS A record to the new IP
4. Patch the PROXY protocol fix (same commands above)
5. Apply all manifests in order (see `README.md` section 6)

### If the external IP changes:

1. Update the DNS A record in DuckDNS
2. `configmap.yaml` already uses the domain — no change needed
3. `frontend/.env.cluster` already uses the domain — no rebuild needed

### If you add a new service:

1. Add a deployment and service yaml in this folder
2. Add a new path rule to `ingress.yaml`
3. Apply: `kubectl apply -f ingress.yaml`

### If you want HTTPS in the future:

1. Install cert-manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
   ```
2. Create a `ClusterIssuer` for Let's Encrypt
3. Add TLS config to `ingress.yaml`
4. Remove the `ssl-redirect: "false"` annotation
5. Rebuild the frontend with `https://` URLs in `.env.cluster`

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Empty reply from server` | SSL redirect enabled, no TLS cert | Add `ssl-redirect: "false"` annotation |
| `Failed to connect port 80` | PROXY protocol mismatch | Patch ConfigMap to disable `use-proxy-protocol` |
| Pod stuck in `Pending` | Insufficient cluster CPU/memory | Delete old pod to free resources, or scale the cluster |
| Frontend loads but API calls fail | Wrong `VITE_*` URLs baked in | Rebuild frontend image with correct `.env.cluster` |