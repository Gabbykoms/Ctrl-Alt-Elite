#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Local Deployment Script              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_success "Loaded environment variables from .env"
else
    echo "Error: .env file not found"
    exit 1
fi

print_info "Creating namespaces..."
kubectl apply -f frontend/kubernetes/namespace.yaml
kubectl create namespace trinity --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespaces created"

echo ""
print_info "Creating secrets..."

# Backend secrets (using hyphen-cased keys to match deployment.yaml)
kubectl create secret generic bantam-secrets \
  --from-literal=supabase-url="$SUPABASE_URL" \
  --from-literal=supabase-anon-key="$SUPABASE_ANON_KEY" \
  --from-literal=supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  -n bantam-shuttle \
  --dry-run=client -o yaml | kubectl apply -f -

# Tracking secrets (username must match PostgreSQL user)
kubectl create secret generic tracking-secrets \
  --from-literal=db-username='postgres' \
  --from-literal=db-password='postgres123' \
  -n bantam-shuttle \
  --dry-run=client -o yaml | kubectl apply -f -

# AI secrets (using UPPERCASE keys as expected by the application)
kubectl delete secret trinity-ai-secret -n trinity --ignore-not-found=true
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" \
  --from-literal=DATABASE_URL="$AI_DATABASE_URL" \
  -n trinity

print_success "Secrets created"

echo ""
print_info "Deploying services..."

# Deploy Frontend
print_info "Deploying Frontend..."
kubectl apply -k frontend/kubernetes/
print_success "Frontend deployed"

# Deploy Backend
print_info "Deploying Backend..."
kubectl apply -k backend/kubernetes/
print_success "Backend deployed"

# Deploy Tracking Service (includes databases)
print_info "Deploying Tracking Service (with PostgreSQL and Redis)..."
kubectl apply -k tracking-service/kubernetes/
print_success "Tracking Service deployed"

# Deploy AI Service
print_info "Deploying AI Service..."
kubectl apply -k AI_Intergration_Service/kubernetes/
print_success "AI Service deployed"

echo ""
print_info "Waiting for deployments to be ready..."
echo ""

sleep 10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Deployment Status:"
echo ""
kubectl get pods -n bantam-shuttle
echo ""
kubectl get pods -n trinity
echo ""

print_info "Access the application:"
echo ""
echo "Port forward commands (run in separate terminals):"
echo "  Frontend:  kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-frontend 8080:80"
echo "  Backend:   kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-backend 8080:8080"
echo "  Tracking:  kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-tracking 8081:8081"
echo "  AI:        kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083"
echo ""
echo "Then access: http://localhost:8080"
echo ""
