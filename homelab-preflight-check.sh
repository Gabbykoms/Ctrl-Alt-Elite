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
print_section() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Bantam Shuttle - Homelab Pre-Deployment Check          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Track issues
ISSUES=0
WARNINGS=0

print_section "1. Kubectl Configuration"

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    echo "  Install: https://kubernetes.io/docs/tasks/tools/"
    ISSUES=$((ISSUES+1))
else
    print_success "kubectl is installed"
    kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null | head -1
fi

echo ""
if ! kubectl cluster-info &> /dev/null; then
    print_error "Not connected to a Kubernetes cluster"
    echo "  Ask your professor for kubeconfig file"
    echo "  Set: export KUBECONFIG=/path/to/kubeconfig"
    ISSUES=$((ISSUES+1))
else
    print_success "Connected to Kubernetes cluster"
    CLUSTER=$(kubectl config current-context)
    print_info "Current context: $CLUSTER"
fi

print_section "2. Cluster Information"

if kubectl cluster-info &> /dev/null; then
    NODES=$(kubectl get nodes --no-headers 2>/dev/null | wc -l | tr -d ' ')
    if [ "$NODES" -gt 0 ]; then
        print_success "Cluster has $NODES node(s)"
        kubectl get nodes
    else
        print_warning "No nodes found"
        WARNINGS=$((WARNINGS+1))
    fi
    
    echo ""
    KUBE_VERSION=$(kubectl version --short 2>/dev/null | grep Server || kubectl version 2>/dev/null | grep "Server Version")
    print_info "Kubernetes version: $KUBE_VERSION"
fi

print_section "3. Permissions Check"

if kubectl auth can-i create namespaces &> /dev/null; then
    print_success "Can create namespaces"
else
    print_warning "Cannot create namespaces (may need admin help)"
    WARNINGS=$((WARNINGS+1))
fi

if kubectl auth can-i create secrets -n default &> /dev/null; then
    print_success "Can create secrets"
else
    print_error "Cannot create secrets"
    ISSUES=$((ISSUES+1))
fi

if kubectl auth can-i create deployments -n default &> /dev/null; then
    print_success "Can create deployments"
else
    print_error "Cannot create deployments"
    ISSUES=$((ISSUES+1))
fi

if kubectl auth can-i create services -n default &> /dev/null; then
    print_success "Can create services"
else
    print_error "Cannot create services"
    ISSUES=$((ISSUES+1))
fi

print_section "4. Resource Availability"

if kubectl top nodes &> /dev/null; then
    print_success "Metrics available"
    echo ""
    kubectl top nodes
    echo ""
else
    print_warning "Metrics server not available (can't check resource usage)"
    WARNINGS=$((WARNINGS+1))
fi

print_section "5. Storage Classes"

STORAGE_CLASSES=$(kubectl get storageclass --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$STORAGE_CLASSES" -gt 0 ]; then
    print_success "Found $STORAGE_CLASSES storage class(es)"
    echo ""
    kubectl get storageclass
    echo ""
else
    print_warning "No storage classes found (needed for database persistence)"
    echo "  Tracking service PostgreSQL needs persistent storage"
    WARNINGS=$((WARNINGS+1))
fi

print_section "6. Ingress Controller"

if kubectl get pods -A 2>/dev/null | grep -i ingress | grep -q Running; then
    print_success "Ingress controller found"
    echo ""
    kubectl get pods -A | grep -i ingress
    echo ""
else
    print_warning "No ingress controller detected"
    echo "  Will need to use NodePort or port-forwarding to access services"
    WARNINGS=$((WARNINGS+1))
fi

print_section "7. Load Balancer Support"

print_info "Checking if LoadBalancer services are supported..."
# This is tricky to check, just inform user
print_warning "LoadBalancer support varies by cluster setup"
echo "  Cloud clusters: Usually supported"
echo "  Bare metal/homelab: Often requires MetalLB or similar"
echo "  Ask your professor about LoadBalancer support"

print_section "8. Network Connectivity Test"

print_info "Testing external network access from cluster..."
if kubectl run test-connectivity --image=curlimages/curl --restart=Never --rm -i --quiet -- curl -s -o /dev/null -w "%{http_code}" https://www.google.com 2>/dev/null | grep -q 200; then
    print_success "Cluster can access external networks"
else
    print_warning "Could not verify external network access"
    echo "  Needed for: Supabase, OpenAI API, Docker Hub"
    WARNINGS=$((WARNINGS+1))
fi

print_section "9. Required Docker Images"

print_info "Checking if Docker images are accessible..."
IMAGES=(
    "gabbykoms/bantam-shuttle-frontend:latest"
    "gabbykoms/bantam-shuttle-backend:latest"
    "gabbykoms/bantam-shuttle-tracking:latest"
    "gabbykoms/bantam-shuttle-ai:latest"
)

for IMAGE in "${IMAGES[@]}"; do
    if docker pull $IMAGE &> /dev/null || kubectl run test-pull-$RANDOM --image=$IMAGE --restart=Never --dry-run=client &> /dev/null; then
        print_success "Image accessible: $IMAGE"
    else
        print_warning "Could not verify: $IMAGE"
        WARNINGS=$((WARNINGS+1))
    fi
done

print_section "10. Namespace Check"

if kubectl get namespace bantam-shuttle &> /dev/null; then
    print_warning "Namespace 'bantam-shuttle' already exists"
    echo "  May have existing deployment. Use ./cleanup-k8s.sh first if needed"
else
    print_success "Namespace 'bantam-shuttle' available"
fi

if kubectl get namespace trinity &> /dev/null; then
    print_warning "Namespace 'trinity' already exists"
    echo "  May have existing deployment. Use ./cleanup-k8s.sh first if needed"
else
    print_success "Namespace 'trinity' available"
fi

print_section "11. Certificate Manager (for SSL)"

if kubectl get pods -n cert-manager &> /dev/null 2>&1; then
    print_success "cert-manager found (SSL certificates will work)"
else
    print_warning "cert-manager not found"
    echo "  SSL/TLS certificates may need manual configuration"
    echo "  Or remove TLS sections from ingress files"
    WARNINGS=$((WARNINGS+1))
fi

print_section "Summary"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "All checks passed! Ready to deploy."
    echo ""
    echo "Next steps:"
    echo "  1. Review HOMELAB_DEPLOYMENT.md"
    echo "  2. Gather secrets (Supabase keys, OpenAI key, JWT secret)"
    echo "  3. Run: ./deploy-to-k8s.sh"
elif [ $ISSUES -eq 0 ]; then
    print_warning "Found $WARNINGS warning(s) but no critical issues"
    echo ""
    echo "You can proceed with deployment, but review warnings above."
    echo "Some features may need adjustment (like ingress or LoadBalancer)."
    echo ""
    echo "Next steps:"
    echo "  1. Review warnings above"
    echo "  2. Check HOMELAB_DEPLOYMENT.md for workarounds"
    echo "  3. Gather secrets"
    echo "  4. Run: ./deploy-to-k8s.sh"
else
    print_error "Found $ISSUES critical issue(s) and $WARNINGS warning(s)"
    echo ""
    echo "Please resolve critical issues before deploying:"
    echo "  - Contact your professor for cluster access/permissions"
    echo "  - Review HOMELAB_DEPLOYMENT.md for requirements"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
