#!/bin/bash

# Bantam Shuttle - GKE Deployment Script
# This script deploys the Bantam Shuttle application to Google Kubernetes Engine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
# Optimized for Google Cloud for Students (Free Tier)
CLUSTER_NAME="${CLUSTER_NAME:-bantam-shuttle-cluster}"
ZONE="${ZONE:-us-central1-a}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-medium}"  # 2 vCPU, 4GB RAM - good balance for student tier
NUM_NODES="${NUM_NODES:-2}"  # Start with 2 nodes to save credits
MIN_NODES="${MIN_NODES:-1}"  # Can scale down to 1 node
MAX_NODES="${MAX_NODES:-3}"  # Cap at 3 nodes to control costs

# Namespaces
NAMESPACE_BACKEND="bantam-shuttle"
NAMESPACE_AI="trinity"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Bantam Shuttle GKE Deployment${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Cluster Name: ${CLUSTER_NAME}"
echo "  Zone: ${ZONE}"
echo "  Machine Type: ${MACHINE_TYPE}"
echo "  Nodes: ${NUM_NODES} (autoscale: ${MIN_NODES}-${MAX_NODES})"
echo ""
echo -e "${GREEN}💡 Tip: Using Google Cloud for Students? You have \$300 in free credits!${NC}"
echo "   This configuration is optimized to maximize your credits."
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists gcloud; then
    echo -e "${RED}Error: gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command_exists kubectl; then
    echo -e "${RED}Error: kubectl not found. Please install it first.${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}Error: docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# Check required environment variables
echo -e "${YELLOW}Checking environment variables...${NC}"

REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
    "AI_DATABASE_URL"
    "AI_SUPABASE_URL"
    "AI_SUPABASE_KEY"
    "AI_OPENAI_API_KEY"
    "DB_USERNAME"
    "DB_PASSWORD"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  - ${var}"
    done
    echo ""
    echo "Please set these variables before running this script."
    echo "You can source a file with: source gke-secrets.env"
    exit 1
fi

echo -e "${GREEN}✓ All environment variables set${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with GKE deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable container.googleapis.com --project="${PROJECT_ID}"
gcloud services enable compute.googleapis.com --project="${PROJECT_ID}"
gcloud services enable storage.googleapis.com --project="${PROJECT_ID}"
echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Create or use existing cluster
echo -e "${YELLOW}Checking for existing GKE cluster...${NC}"
if gcloud container clusters describe "${CLUSTER_NAME}" --zone="${ZONE}" --project="${PROJECT_ID}" &>/dev/null; then
    echo -e "${GREEN}✓ Using existing cluster: ${CLUSTER_NAME}${NC}"
else
    echo -e "${YELLOW}Creating new GKE cluster: ${CLUSTER_NAME}...${NC}"
    echo "This may take 5-10 minutes..."
    
    gcloud container clusters create "${CLUSTER_NAME}" \
        --zone="${ZONE}" \
        --project="${PROJECT_ID}" \
        --machine-type="${MACHINE_TYPE}" \
        --num-nodes="${NUM_NODES}" \
        --disk-size=50 \
        --disk-type=pd-standard \
        --enable-autoscaling \
        --min-nodes="${MIN_NODES}" \
        --max-nodes="${MAX_NODES}" \
        --enable-autorepair \
        --enable-autoupgrade \
        --enable-ip-alias \
        --network="default" \
        --subnetwork="default" \
        --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver
    
    echo -e "${GREEN}✓ Cluster created successfully${NC}"
fi
echo ""

# Get cluster credentials
echo -e "${YELLOW}Getting cluster credentials...${NC}"
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
    --zone="${ZONE}" \
    --project="${PROJECT_ID}"
echo -e "${GREEN}✓ Credentials configured${NC}"
echo ""

# Create namespaces
echo -e "${YELLOW}Creating namespaces...${NC}"
kubectl create namespace "${NAMESPACE_BACKEND}" --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace "${NAMESPACE_AI}" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespaces created${NC}"
echo ""

# Create secrets
echo -e "${YELLOW}Creating Kubernetes secrets...${NC}"

# Backend secrets
kubectl create secret generic bantam-secrets \
    --from-literal=supabase-url="${SUPABASE_URL}" \
    --from-literal=supabase-anon-key="${SUPABASE_ANON_KEY}" \
    --from-literal=supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
    --from-literal=jwt-secret="${JWT_SECRET}" \
    --namespace="${NAMESPACE_BACKEND}" \
    --dry-run=client -o yaml | kubectl apply -f -

# Tracking service secrets
kubectl create secret generic tracking-secrets \
    --from-literal=db-username="${DB_USERNAME}" \
    --from-literal=db-password="${DB_PASSWORD}" \
    --namespace="${NAMESPACE_BACKEND}" \
    --dry-run=client -o yaml | kubectl apply -f -

# AI service secrets
kubectl create secret generic trinity-ai-secret \
    --from-literal=AI_OPENAI_API_KEY="${AI_OPENAI_API_KEY}" \
    --from-literal=AI_DATABASE_URL="${AI_DATABASE_URL}" \
    --from-literal=AI_SUPABASE_URL="${AI_SUPABASE_URL}" \
    --from-literal=AI_SUPABASE_KEY="${AI_SUPABASE_KEY}" \
    --namespace="${NAMESPACE_AI}" \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

# Deploy services
echo -e "${YELLOW}Deploying services...${NC}"

# Deploy Tracking Service (includes PostgreSQL and Redis)
echo "  Deploying Tracking Service..."
kubectl apply -f tracking-service/kubernetes/configmap.yaml
kubectl apply -f tracking-service/kubernetes/postgres.yaml
kubectl apply -f tracking-service/kubernetes/redis.yaml
kubectl apply -f tracking-service/kubernetes/deployment.yaml
kubectl apply -f tracking-service/kubernetes/service.yaml

# Deploy Backend
echo "  Deploying Backend..."
kubectl apply -f backend/kubernetes/configmap.yaml
kubectl apply -f backend/kubernetes/deployment.yaml
kubectl apply -f backend/kubernetes/service.yaml

# Deploy Frontend
echo "  Deploying Frontend..."
kubectl apply -f frontend/kubernetes/configmap.yaml
kubectl apply -f frontend/kubernetes/deployment.yaml
kubectl apply -f frontend/kubernetes/service.yaml

# Deploy AI Service
echo "  Deploying AI Service..."
kubectl apply -f AI_Intergration_Service/kubernetes/configmap.yaml
kubectl apply -f AI_Intergration_Service/kubernetes/deployment.yaml
kubectl apply -f AI_Intergration_Service/kubernetes/service.yaml

echo -e "${GREEN}✓ All services deployed${NC}"
echo ""

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
echo "This may take a few minutes..."

kubectl wait --for=condition=ready pod -l app=bantam-shuttle-backend -n "${NAMESPACE_BACKEND}" --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=bantam-shuttle-frontend -n "${NAMESPACE_BACKEND}" --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=tracking-service -n "${NAMESPACE_BACKEND}" --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=trinity-ai-service -n "${NAMESPACE_AI}" --timeout=300s || true

echo -e "${GREEN}✓ Pods are ready${NC}"
echo ""

# Create LoadBalancer service for frontend (if not exists)
echo -e "${YELLOW}Configuring external access...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: bantam-shuttle-frontend-lb
  namespace: ${NAMESPACE_BACKEND}
spec:
  type: LoadBalancer
  selector:
    app: bantam-shuttle-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
EOF

echo -e "${GREEN}✓ LoadBalancer configured${NC}"
echo ""

# Display deployment status
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

echo "Cluster Information:"
echo "  Project: ${PROJECT_ID}"
echo "  Cluster: ${CLUSTER_NAME}"
echo "  Zone: ${ZONE}"
echo ""

echo "Namespaces:"
kubectl get namespace "${NAMESPACE_BACKEND}" "${NAMESPACE_AI}" --no-headers | awk '{printf "  %-20s %s\n", $1, $3}'
echo ""

echo "Pods Status:"
kubectl get pods -n "${NAMESPACE_BACKEND}" --no-headers | awk '{printf "  %-40s %-15s %s\n", $1, $3, $4}'
kubectl get pods -n "${NAMESPACE_AI}" --no-headers | awk '{printf "  %-40s %-15s %s\n", $1, $3, $4}'
echo ""

echo -e "${YELLOW}Getting external IP address (this may take a few minutes)...${NC}"
echo "Waiting for LoadBalancer IP..."

# Wait for external IP
for i in {1..30}; do
    EXTERNAL_IP=$(kubectl get svc bantam-shuttle-frontend-lb -n "${NAMESPACE_BACKEND}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ -n "${EXTERNAL_IP}" ]; then
        break
    fi
    echo -n "."
    sleep 10
done
echo ""

if [ -n "${EXTERNAL_IP}" ]; then
    echo ""
    echo -e "${GREEN}Application is accessible at:${NC}"
    echo -e "${GREEN}  Frontend: http://${EXTERNAL_IP}${NC}"
    echo ""
    echo "Backend services are accessible via the frontend proxy or internally:"
    echo "  Backend API: http://${EXTERNAL_IP}/api"
    echo "  Tracking Service: http://${EXTERNAL_IP}/tracking"
    echo "  AI Service: http://${EXTERNAL_IP}/ai"
else
    echo -e "${YELLOW}External IP not yet assigned. Check status with:${NC}"
    echo "  kubectl get svc bantam-shuttle-frontend-lb -n ${NAMESPACE_BACKEND}"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo ""
echo "View all resources:"
echo "  kubectl get all -n ${NAMESPACE_BACKEND}"
echo "  kubectl get all -n ${NAMESPACE_AI}"
echo ""
echo "View logs:"
echo "  kubectl logs -n ${NAMESPACE_BACKEND} -l app=bantam-shuttle-backend --tail=50"
echo "  kubectl logs -n ${NAMESPACE_AI} -l app=trinity-ai-service --tail=50"
echo ""
echo "Get external IP:"
echo "  kubectl get svc bantam-shuttle-frontend-lb -n ${NAMESPACE_BACKEND}"
echo ""
echo "Scale deployments:"
echo "  kubectl scale deployment bantam-shuttle-backend --replicas=3 -n ${NAMESPACE_BACKEND}"
echo ""
echo "Delete deployment:"
echo "  kubectl delete namespace ${NAMESPACE_BACKEND} ${NAMESPACE_AI}"
echo "  gcloud container clusters delete ${CLUSTER_NAME} --zone ${ZONE}"
echo ""

echo -e "${GREEN}Deployment successful! 🚀${NC}"
