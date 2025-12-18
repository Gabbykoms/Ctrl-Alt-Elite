#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Kubernetes Deployment Script         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi
print_success "kubectl is installed"

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Not connected to a Kubernetes cluster. Please configure kubectl."
    exit 1
fi
print_success "Connected to Kubernetes cluster"

# Show cluster info
CLUSTER=$(kubectl config current-context)
print_info "Current cluster: $CLUSTER"
echo ""

# Prompt for secrets
print_warning "You need to provide secrets for the deployment."
echo ""

read -p "Enter SUPABASE_URL: " SUPABASE_URL
read -p "Enter SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -sp "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -sp "Enter JWT_SECRET: " JWT_SECRET
echo ""
read -sp "Enter OPENAI_API_KEY: " OPENAI_API_KEY
echo ""
read -sp "Enter Database Password for Tracking Service: " DB_PASSWORD
echo ""
echo ""

print_info "Creating namespaces..."
kubectl apply -f frontend/kubernetes/namespace.yaml
kubectl create namespace trinity --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespaces created"

echo ""
print_info "Creating secrets..."

# Backend secrets
kubectl create secret generic bantam-secrets \
  --from-literal=SUPABASE_URL="$SUPABASE_URL" \
  --from-literal=SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  -n bantam-shuttle \
  --dry-run=client -o yaml | kubectl apply -f -

# Tracking secrets
kubectl create secret generic tracking-secrets \
  --from-literal=db-username='postgres' \
  --from-literal=db-password="$DB_PASSWORD" \
  -n bantam-shuttle \
  --dry-run=client -o yaml | kubectl apply -f -

# AI secrets
kubectl create secret generic trinity-ai-secret \
  --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" \
  --from-literal=DATABASE_PASSWORD="$DB_PASSWORD" \
  -n trinity \
  --dry-run=client -o yaml | kubectl apply -f -

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
print_info "Waiting for deployments to be ready (this may take a few minutes)..."
echo ""

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s \
  deployment/bantam-shuttle-frontend -n bantam-shuttle || true
kubectl wait --for=condition=available --timeout=300s \
  deployment/bantam-shuttle-backend -n bantam-shuttle || true
kubectl wait --for=condition=available --timeout=300s \
  deployment/bantam-shuttle-tracking -n bantam-shuttle || true
kubectl wait --for=condition=available --timeout=300s \
  deployment/trinity-ai-service -n trinity || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show status
print_info "Deployment Status:"
echo ""
kubectl get pods -n bantam-shuttle
echo ""
kubectl get pods -n trinity
echo ""

print_info "Services:"
echo ""
kubectl get svc -n bantam-shuttle
echo ""
kubectl get svc -n trinity
echo ""

print_info "Ingresses:"
echo ""
kubectl get ingress -n bantam-shuttle
echo ""
kubectl get ingress -n trinity
echo ""

print_info "Access the application:"
echo ""
echo "Port forward commands (for local access):"
echo "  Frontend:  kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-frontend 8080:80"
echo "  Backend:   kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-backend 8080:8080"
echo "  Tracking:  kubectl port-forward -n bantam-shuttle svc/bantam-shuttle-tracking 8081:8081"
echo "  AI:        kubectl port-forward -n trinity svc/trinity-ai-service 8083:8083"
echo ""
print_info "Check logs:"
echo "  kubectl logs -n bantam-shuttle -l app=bantam-shuttle-frontend"
echo "  kubectl logs -n bantam-shuttle -l app=bantam-shuttle-backend"
echo "  kubectl logs -n bantam-shuttle -l app=bantam-shuttle-tracking"
echo "  kubectl logs -n trinity -l app=trinity-ai-service"
echo ""
