# CI/CD Pipeline Documentation

## Overview
This backend service has a complete CI/CD pipeline configured using GitHub Actions with the following stages:

## Pipeline Stages

### 1. Lint and Type Check
- Runs on every push and pull request
- Checks TypeScript types with `tsc --noEmit`
- Runs ESLint for code quality
- Fast feedback on code quality issues

### 2. Build
- Compiles TypeScript to JavaScript
- Ensures the application builds successfully
- Uploads build artifacts for downstream jobs
- Only runs after lint/type-check passes

### 3. Docker Build and Push
- Builds Docker image using multi-stage Dockerfile
- Pushes to GitHub Container Registry (ghcr.io)
- Only runs on push to `main` or `backend` branches
- Uses build cache for faster builds
- Tags images with branch name and commit SHA

### 4. Security Scan
- Scans for vulnerabilities using Trivy
- Uploads results to GitHub Security tab
- Runs after Docker image is built
- Helps identify security issues early

## Required GitHub Secrets

The following secrets need to be configured in your GitHub repository:

### Automatic (GitHub-provided)
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### Manual Configuration Required
None for basic CI/CD. For deployment, add:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret for JWT token signing

## Kubernetes Deployment

Kubernetes manifests are available in the `kubernetes/` directory:
- `deployment.yaml` - Main application deployment
- `service.yaml` - Service configuration
- `ingress.yaml` - Ingress rules
- `configmap.yaml` - Configuration data
- `secrets.yaml.template` - Template for secrets (copy to secrets.yaml)
- `hpa.yaml` - Horizontal Pod Autoscaler
- `kustomization.yaml` - Kustomize configuration

### Deploying to Kubernetes

```bash
# Create namespace
kubectl create namespace bantam-shuttle

# Create secrets from .env file
kubectl create secret generic bantam-secrets \
  --from-env-file=.env \
  --namespace=bantam-shuttle

# Apply all manifests
kubectl apply -k kubernetes/

# Check deployment status
kubectl get pods -n bantam-shuttle
kubectl get services -n bantam-shuttle
```

## Docker Commands

### Local Development
```bash
# Build image
npm run docker:build
# or
docker-compose build

# Start container
npm run docker:up
# or
docker-compose up

# Stop container
npm run docker:down
# or
docker-compose down
```

### Manual Docker Build
```bash
# Build production image
docker build -t bantam-shuttle-backend:latest .

# Run container
docker run -p 8080:8080 \
  --env-file .env \
  bantam-shuttle-backend:latest
```

## Continuous Deployment Options

### Option 1: GitHub Actions + Kubernetes
Add deployment stage to `.github/workflows/ci.yml`:
```yaml
deploy:
  needs: docker-build-and-push
  runs-on: ubuntu-latest
  steps:
    - uses: azure/k8s-set-context@v3
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
    - run: kubectl apply -k kubernetes/
```

### Option 2: ArgoCD
- Install ArgoCD in your cluster
- Point it to this repository
- Auto-sync on changes to `main` branch

### Option 3: Flux CD
- Install Flux in your cluster
- Configure GitOps for this repository
- Automatic deployment on image push

## Monitoring and Health Checks

### Health Check Endpoint
- URL: `http://localhost:8080/health`
- Returns: `{"status": "ok", "message": "...", "timestamp": "..."}`

### Docker Health Check
Built into Dockerfile:
- Interval: 30s
- Timeout: 10s
- Start period: 40s
- Retries: 3

### Kubernetes Probes
Configured in `deployment.yaml`:
- Liveness probe on `/health`
- Readiness probe on `/health`

## Best Practices Implemented

✅ Multi-stage Docker build for smaller images
✅ Non-root user in container for security
✅ Health checks for container orchestration
✅ Environment-based configuration
✅ Secrets management via environment variables
✅ Build caching for faster CI/CD
✅ Security scanning with Trivy
✅ TypeScript strict mode enabled
✅ Linting and type checking in CI
✅ Horizontal pod autoscaling for Kubernetes

## Local Development Workflow

1. Make code changes
2. Test locally: `npm run dev`
3. Check types: `npm run type-check`
4. Fix linting: `npm run lint:fix`
5. Test Docker build: `npm run docker:build`
6. Commit and push
7. CI pipeline runs automatically
8. On merge to main, Docker image is built and pushed

## Troubleshooting

### CI Fails on Type Check
- Run `npm run type-check` locally
- Fix TypeScript errors
- Commit and push

### Docker Build Fails
- Ensure all files are committed
- Check `.dockerignore` isn't excluding needed files
- Test build locally: `docker build -t test .`

### Kubernetes Pod Won't Start
- Check logs: `kubectl logs -n bantam-shuttle <pod-name>`
- Verify secrets are created: `kubectl get secrets -n bantam-shuttle`
- Check environment variables in deployment

## Next Steps

To enhance the CI/CD pipeline further:

1. **Add Tests**: Install Jest and write unit/integration tests
2. **Code Coverage**: Add coverage reporting with CodeCov
3. **Automated Rollback**: Implement automatic rollback on health check failures
4. **Staging Environment**: Add staging deployment before production
5. **Load Testing**: Add performance testing with k6 or Artillery
6. **Monitoring**: Integrate with Prometheus/Grafana
