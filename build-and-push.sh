#!/bin/bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
VERSION="${VERSION:-latest}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Docker Build & Push Script           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi
print_success "Docker is running"

# Get Docker username if not set
if [ -z "$DOCKER_USERNAME" ]; then
    echo ""
    print_info "Enter your Docker Hub username:"
    read -r DOCKER_USERNAME
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username: $DOCKER_USERNAME" 2>/dev/null; then
    print_warning "Not logged in to Docker Hub"
    print_info "Logging in to Docker Hub..."
    docker login
    if [ $? -ne 0 ]; then
        print_error "Docker login failed"
        exit 1
    fi
fi
print_success "Logged in to Docker Hub as $DOCKER_USERNAME"

echo ""
print_info "Building and pushing images with tag: $VERSION"
echo ""

# Function to build and push an image
build_and_push() {
    local service_name=$1
    local context_dir=$2
    local dockerfile=$3
    local image_name="$DOCKER_USERNAME/$service_name:$VERSION"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Building $service_name..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$context_dir"
    
    if docker build -f "$dockerfile" -t "$image_name" .; then
        print_success "$service_name built successfully"
        
        print_info "Pushing $image_name..."
        if docker push "$image_name"; then
            print_success "$service_name pushed successfully"
            
            # Also tag as latest
            if [ "$VERSION" != "latest" ]; then
                local latest_image="$DOCKER_USERNAME/$service_name:latest"
                docker tag "$image_name" "$latest_image"
                docker push "$latest_image"
                print_success "Also tagged and pushed as latest"
            fi
        else
            print_error "Failed to push $service_name"
            return 1
        fi
    else
        print_error "Failed to build $service_name"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Build and push each service
SUCCESS_COUNT=0
FAIL_COUNT=0

# Backend
if build_and_push "bantam-shuttle-backend" "$PROJECT_ROOT/backend" "Dockerfile"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

# Frontend
print_info "Building Frontend with environment variables..."
cd "$PROJECT_ROOT/frontend"
if docker build \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8080/api}" \
    --build-arg VITE_SOCKET_URL="${VITE_SOCKET_URL:-http://localhost:8080}" \
    --build-arg VITE_TRACKING_SERVICE_URL="${VITE_TRACKING_SERVICE_URL:-http://localhost:8081}" \
    --build-arg VITE_AI_SERVICE_URL="${VITE_AI_SERVICE_URL:-http://localhost:8083}" \
    --build-arg VITE_MAPBOX_TOKEN="${VITE_MAPBOX_TOKEN}" \
    -t "$DOCKER_USERNAME/bantam-shuttle-frontend:$VERSION" \
    -f Dockerfile .; then
    print_success "Frontend built successfully"
    
    if docker push "$DOCKER_USERNAME/bantam-shuttle-frontend:$VERSION"; then
        print_success "Frontend pushed successfully"
        if [ "$VERSION" != "latest" ]; then
            docker tag "$DOCKER_USERNAME/bantam-shuttle-frontend:$VERSION" "$DOCKER_USERNAME/bantam-shuttle-frontend:latest"
            docker push "$DOCKER_USERNAME/bantam-shuttle-frontend:latest"
        fi
        ((SUCCESS_COUNT++))
    else
        print_error "Failed to push Frontend"
        ((FAIL_COUNT++))
    fi
else
    print_error "Failed to build Frontend"
    ((FAIL_COUNT++))
fi
cd "$PROJECT_ROOT"
echo ""

# Tracking Service
if build_and_push "bantam-shuttle-tracking" "$PROJECT_ROOT/tracking-service" "Dockerfile"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

# AI Service
if build_and_push "bantam-shuttle-ai" "$PROJECT_ROOT/AI_Intergration_Service" "docker/Dockerfile"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build & Push Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Successfully built and pushed: $SUCCESS_COUNT services"
if [ $FAIL_COUNT -gt 0 ]; then
    print_error "Failed: $FAIL_COUNT services"
fi

echo ""
echo "Docker Images:"
echo "  • $DOCKER_USERNAME/bantam-shuttle-backend:$VERSION"
echo "  • $DOCKER_USERNAME/bantam-shuttle-frontend:$VERSION"
echo "  • $DOCKER_USERNAME/bantam-shuttle-tracking:$VERSION"
echo "  • $DOCKER_USERNAME/bantam-shuttle-ai:$VERSION"
echo ""
echo "Next steps:"
echo "  1. Update Kubernetes manifests with your Docker Hub username"
echo "  2. Run: kubectl apply -k backend/kubernetes/"
echo "  3. Run: kubectl apply -k AI_Intergration_Service/kubernetes/"
echo ""
