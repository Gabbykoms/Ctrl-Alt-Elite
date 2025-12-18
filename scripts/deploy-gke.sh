#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Ctrl Alt Elite - GKE Deployment Script             ║"
echo "║                    Updated December 2025                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Prerequisites:"
echo "  ✓ KUBECONFIG exported and pointing to GKE cluster"
echo "  ✓ elite-db namespace with PostgreSQL and Redis deployed"
echo "  ✓ Images pushed to Harbor registry"
echo ""

# Check if databases exist
echo "Checking for required databases in elite-db namespace..."
if ! kubectl get secret my-postgresql -n elite-db > /dev/null 2>&1; then
    echo "Error: PostgreSQL not found in elite-db namespace"
    echo "Please deploy PostgreSQL first using:"
    echo "  helm install my-postgresql bitnami/postgresql --version 18.1.13 -n elite-db"
    exit 1
fi
echo "✓ PostgreSQL found"

if ! kubectl get secret my-redis -n elite-db > /dev/null 2>&1; then
    echo "Error: Redis not found in elite-db namespace"
    echo "Please deploy Redis first using:"
    echo "  helm install my-redis bitnami/redis --version 24.0.8 -n elite-db"
    exit 1
fi
echo "✓ Redis found"
echo ""

# Check required environment variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET" "HARBOR_PASSWORD" "HARBOR_DOMAIN" "HARBOR_USERNAME" "OPENAI_API_KEY" "AI_DB_PASSWORD" "AI_SUPABASE_KEY" "AI_SUPABASE_URL" "OPENWEATHER_API_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Missing required environment variable: $var"
        exit 1
    fi
done

# Create namespaces
kubectl create namespace elite-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace elite-db --dry-run=client -o yaml | kubectl apply -f -

echo "✓ Namespaces created/verified"
echo ""

# Create secrets
kubectl delete secret bantam-secrets -n elite-dev --ignore-not-found=true
kubectl create secret generic bantam-secrets \
    --from-literal=supabase-url="${SUPABASE_URL}" \
    --from-literal=supabase-anon-key="${SUPABASE_ANON_KEY}" \
    --from-literal=supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
    --from-literal=jwt-secret="${JWT_SECRET}" \
    -n elite-dev

# Create AI service secret
kubectl delete secret bantam-ai-secret -n elite-dev --ignore-not-found=true
kubectl create secret generic bantam-ai-secret \
    --from-literal=AI_OPENAI_API_KEY="${OPENAI_API_KEY}" \
    --from-literal=AI_DB_PASSWORD="${AI_DB_PASSWORD}" \
    --from-literal=AI_DATABASE_URL="${AI_DATABASE_URL}" \
    --from-literal=AI_SUPABASE_KEY="${AI_SUPABASE_KEY}" \
    --from-literal=AI_SUPABASE_URL="${AI_SUPABASE_URL}" \
    --from-literal=OPENWEATHER_API_KEY="${OPENWEATHER_API_KEY}" \
    -n elite-dev

# Create tracking service secret using PostgreSQL credentials from elite-db
echo "Creating tracking service secrets..."
POSTGRES_PASSWORD=$(kubectl get secret --namespace elite-db my-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)
REDIS_PASSWORD=$(kubectl get secret --namespace elite-db my-redis -o jsonpath="{.data.redis-password}" | base64 -d)

kubectl delete secret tracking-secrets -n elite-dev --ignore-not-found=true
kubectl create secret generic tracking-secrets \
    --from-literal=db-username="postgres" \
    --from-literal=db-password="$POSTGRES_PASSWORD" \
    -n elite-dev

# Copy Redis secret from elite-db to elite-dev so tracking service can authenticate
kubectl get secret my-redis -n elite-db -o yaml | sed 's/namespace: elite-db/namespace: elite-dev/' | kubectl apply -f -

echo "✓ Tracking service secrets created"
echo ""

# Create Harbor image pull secret
kubectl create secret docker-registry harbor-pull-secret \
    --docker-server="${HARBOR_DOMAIN}" \
    --docker-username="${HARBOR_USERNAME}" \
    --docker-password="${HARBOR_PASSWORD}" \
    --dry-run=client -o yaml > imagepullsecret.yaml

kubectl apply -f imagepullsecret.yaml -n elite-dev

# Update backend ConfigMap with correct FRONTEND_URL to fix CORS
sed -i.bak 's|frontend-url: "http://localhost:3000"|frontend-url: "http://localhost:5173"|g' backend/kubernetes/configmap.yaml
sed -i.bak 's|FRONTEND_URL: "http://localhost:3000"|FRONTEND_URL: "http://localhost:5173"|g' backend/kubernetes/configmap.yaml

# Deploy frontend and backend
kubectl apply -k frontend/kubernetes/
kubectl apply -k backend/kubernetes/

# Deploy AI service
kubectl apply -k AI_Intergration_Service/kubernetes/

# Deploy tracking service
kubectl apply -k tracking-service/kubernetes/

# Wait for pods
kubectl wait --for=condition=ready pod -l app=bantam-shuttle-frontend -n elite-dev --timeout=300s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=bantam-shuttle-backend -n elite-dev --timeout=300s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=bantam-ai-service -n elite-dev --timeout=300s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=bantam-shuttle-tracking -n elite-dev --timeout=300s 2>/dev/null || true

# Display status
echo "Pod Status:"
kubectl get pods -n elite-dev

echo ""
echo "Services:"
kubectl get services -n elite-dev

echo ""
echo "Setting up port forwarding..."
kubectl port-forward svc/bantam-shuttle-frontend 5173:80 -n elite-dev > /dev/null 2>&1 &
kubectl port-forward svc/bantam-shuttle-backend 8080:8080 -n elite-dev > /dev/null 2>&1 &
kubectl port-forward svc/bantam-ai-service 8083:8083 -n elite-dev > /dev/null 2>&1 &
kubectl port-forward svc/bantam-shuttle-tracking 8081:8081 -n elite-dev > /dev/null 2>&1 &

echo "✓ Frontend available at: http://localhost:5173"
echo "✓ Backend Swagger UI available at: http://localhost:8080/api-docs"
echo "✓ Backend Health check at: http://localhost:8080/health"
echo "✓ AI Service available at: http://localhost:8083"
echo "✓ AI Service Health check at: http://localhost:8083/health"
echo "✓ Tracking Service available at: http://localhost:8081"
echo "✓ Tracking Service Swagger UI at: http://localhost:8081/swagger-ui.html"
