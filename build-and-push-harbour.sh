# Configuration
HARBOR_REGISTRY="${HARBOR_REGISTRY:-}"
VERSION="${VERSION:-latest}"
PROJECT_NAME="elite"
PLATFORM="${PLATFORM:-linux/amd64}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_METHOD="${BUILD_METHOD:-docker}"  # docker, buildx, or gradle

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Ctrl Alt Elite - Docker Build & Push to Harbor          ║"
echo "║               Updated December 2025                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
echo "Verifying Docker installation..."
if ! docker info > /dev/null 2>&1; then
    echo "Erro: Docker is not running. Please start Docker Desktop."
    exit 1
fi
echo "Success: Docker is running"

echo ""
echo "Harbor Registry Configuration"
echo ""

# Get Harbor registry if not set
if [ -z "$HARBOR_REGISTRY" ]; then
    echo "Enter your Harbor registry URL (e.g., harbor.javajon.duckdns.org):"
    read -r HARBOR_REGISTRY
fi

# Validate Harbor registry format
if [ -z "$HARBOR_REGISTRY" ]; then
    echo "Error: Harbor registry URL is required"
    exit 1
fi


echo ""
echo "Build Configuration"
echo ""
echo "  Registry:     $HARBOR_REGISTRY"
echo "  Project:      $PROJECT_NAME"
echo "  Version:      $VERSION"
echo "  Platform:     $PLATFORM"
echo "  Build Method: $BUILD_METHOD"
echo ""

# Function to build and push an image using docker build
build_and_push_docker() {
    local app_name=$1
    local context_dir=$2
    local dockerfile=$3
    local image_name="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:$VERSION"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Info: Building $app_name (docker build)..."
    echo "Image: $image_name"
    echo "Platform: $PLATFORM"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$context_dir"
    
    echo "COMMAND: \n docker build --platform="$PLATFORM" -f "$dockerfile" -t "$image_name" ."
    echo "\n"

    if docker build --platform="$PLATFORM" -f "$dockerfile" -t "$image_name" .; then
        echo "Success: $app_name built successfully"
        
        echo "Info: Pushing to Harbor: $image_name"
        if docker push "$image_name"; then
            echo "Success: $app_name pushed successfully to Harbor"
            
            # Also tag as latest if version is not latest
            if [ "$VERSION" != "latest" ]; then
                local latest_image="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:latest"
                echo "Info: Tagging as latest: $latest_image"
                docker tag "$image_name" "$latest_image"
                if docker push "$latest_image"; then
                    echo "Success: Also tagged and pushed as latest"
                fi
            fi
        else
            echo "Error: Failed to push $app_name to Harbor"
            return 1
        fi
    else
        echo "Error: Failed to build $app_name"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Function to build and push an image using docker buildx
build_and_push_buildx() {
    local app_name=$1
    local context_dir=$2
    local dockerfile=$3
    local image_name="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:$VERSION"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Info: Building $app_name (docker buildx)..."
    echo "Image: $image_name"
    echo "Platform: $PLATFORM"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if buildx is available
    if ! docker buildx version > /dev/null 2>&1; then
        echo "Warning: docker buildx not available, falling back to docker build"
        return $(build_and_push_docker "$app_name" "$context_dir" "$dockerfile")
    fi
    
    cd "$context_dir"
    
    if docker buildx build --platform="$PLATFORM" -f "$dockerfile" -t "$image_name" --push .; then
        echo "Success: $app_name built and pushed successfully to Harbor"
        
        # Also tag as latest if version is not latest
        if [ "$VERSION" != "latest" ]; then
            local latest_image="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:latest"
            echo "Info: Tagging as latest: $latest_image"
            docker tag "$image_name" "$latest_image"
            if docker push "$latest_image"; then
                echo "Success: Also tagged and pushed as latest"
            fi
        fi
    else
        echo "Error: Failed to build $app_name with buildx"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Function to build and push using gradle bootBuildImage
build_and_push_gradle() {
    local app_name=$1
    local context_dir=$2
    local image_name="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:$VERSION"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Info: Building $app_name (gradle bootBuildImage)..."
    echo "Image: $image_name"
    echo "Platform: $PLATFORM"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$context_dir"
    
    # Check if gradlew exists
    if [ ! -f "gradlew" ]; then
        echo "Error: gradlew not found in $context_dir"
        return 1
    fi
    
    if ./gradlew bootBuildImage --imageName="$image_name" --platform="$PLATFORM"; then
        echo "Success: $app_name built successfully with gradle"
        
        echo "Info: Pushing to Harbor: $image_name"
        if docker push "$image_name"; then
            echo "Success: $app_name pushed successfully to Harbor"
            
            # Also tag as latest if version is not latest
            if [ "$VERSION" != "latest" ]; then
                local latest_image="$HARBOR_REGISTRY/library/$PROJECT_NAME-$app_name:latest"
                echo "Info: Tagging as latest: $latest_image"
                docker tag "$image_name" "$latest_image"
                if docker push "$latest_image"; then
                    echo "Success: Also tagged and pushed as latest"
                fi
            fi
        else
            echo "Error: Failed to push $app_name to Harbor"
            return 1
        fi
    else
        echo "Error: Failed to build $app_name with gradle"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Build and push each service
SUCCESS_COUNT=0
FAIL_COUNT=0

# Backend (Node.js/Express)
echo "Info: Building backend service (Node.js)..."
if [ "$BUILD_METHOD" == "buildx" ]; then
    if build_and_push_buildx "backend" "$PROJECT_ROOT/backend" "Dockerfile"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
else
    if build_and_push_docker "backend" "$PROJECT_ROOT/backend" "Dockerfile"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
fi

# Frontend (React/TypeScript)
echo "Info: Building frontend service (React)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$PROJECT_ROOT/frontend"
FRONTEND_IMAGE="$HARBOR_REGISTRY/library/$PROJECT_NAME-frontend:$VERSION"
echo "Image: $FRONTEND_IMAGE"
echo "Platform: $PLATFORM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker build --platform="$PLATFORM" \
    --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8080/api}" \
    --build-arg VITE_SOCKET_URL="${VITE_SOCKET_URL:-http://localhost:8080}" \
    --build-arg VITE_TRACKING_SERVICE_URL="${VITE_TRACKING_SERVICE_URL:-http://localhost:8081}" \
    --build-arg VITE_AI_SERVICE_URL="${VITE_AI_SERVICE_URL:-http://localhost:8083}" \
    --build-arg VITE_MAPBOX_TOKEN="${VITE_MAPBOX_TOKEN}" \
    -t "$FRONTEND_IMAGE" \
    -f Dockerfile . 2>&1 | tail -20; then
    echo "Success: Frontend built successfully"
    
    echo "Info: Pushing Frontend to Harbor: $FRONTEND_IMAGE"
    if docker push "$FRONTEND_IMAGE"; then
        echo "Success: Frontend pushed successfully to Harbor"
        if [ "$VERSION" != "latest" ]; then
            local latest_image="$HARBOR_REGISTRY/library/$PROJECT_NAME-frontend:latest"
            docker tag "$FRONTEND_IMAGE" "$latest_image"
            if docker push "$latest_image"; then
                echo "Success: Also tagged and pushed as latest"
            fi
        fi
        ((SUCCESS_COUNT++))
    else
        echo "Error: Failed to push Frontend to Harbor"
        ((FAIL_COUNT++))
    fi
else
    echo "Error: Failed to build Frontend"
    ((FAIL_COUNT++))
fi
cd "$PROJECT_ROOT"
echo ""

# Tracking Service (Java/Gradle)
echo "Info: Building tracking-service (Java/Spring Boot)..."
if [ "$BUILD_METHOD" == "gradle" ] || [ "$BUILD_METHOD" == "gradle-boot" ]; then
    if build_and_push_gradle "tracking-service" "$PROJECT_ROOT/tracking-service"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
else
    if [ "$BUILD_METHOD" == "buildx" ]; then
        if build_and_push_buildx "tracking-service" "$PROJECT_ROOT/tracking-service" "Dockerfile"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
        fi
    else
        if build_and_push_docker "tracking-service" "$PROJECT_ROOT/tracking-service" "Dockerfile"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
        fi
    fi
fi

# AI Integration Service (Python)
echo "Info: Building AI integration service (Python)..."
if [ "$BUILD_METHOD" == "buildx" ]; then
    if build_and_push_buildx "ai-service" "$PROJECT_ROOT/AI_Intergration_Service" "docker/Dockerfile"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
else
    if build_and_push_docker "ai-service" "$PROJECT_ROOT/AI_Intergration_Service" "docker/Dockerfile"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Build & Push to Harbor Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Success: Successfully built and pushed: $SUCCESS_COUNT services"
if [ $FAIL_COUNT -gt 0 ]; then
    echo "Error: Failed: $FAIL_COUNT services"
else
    echo "Success: All services successfully built and pushed! 🎊"
fi

echo ""
echo "Harbor Images Published to Registry:"
echo ""
echo "    Backend (Node.js)"
echo "     $HARBOR_REGISTRY/library/$PROJECT_NAME-backend:$VERSION"
echo ""
echo "    Frontend (React)"
echo "     $HARBOR_REGISTRY/library/$PROJECT_NAME-frontend:$VERSION"
echo ""
echo "    Tracking Service (Java/Spring Boot)"
echo "     $HARBOR_REGISTRY/library/$PROJECT_NAME-tracking-service:$VERSION"
echo ""
echo "    AI Service (Python/FastAPI)"
echo "     $HARBOR_REGISTRY/library/$PROJECT_NAME-ai-service:$VERSION"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Info: Configuration Used:"
echo "  Registry:    $HARBOR_REGISTRY"
echo "  Project:     $PROJECT_NAME"
echo "  Platform:    $PLATFORM"
echo "  Build Method: $BUILD_METHOD"
echo "  Version:     $VERSION"
echo ""

echo "Info: Summary:"
echo "  ✓ Images successfully pushed to Harbor"
echo "  ✓ Ready for Kubernetes deployment"
echo ""

echo "Info: Next Steps for GKE Deployment:"
echo ""
echo "  1  Create Kubernetes namespace:"
echo "     kubectl create namespace elite-namespace"
echo ""
echo "  2  Create Harbor registry secret in Kubernetes:"
echo "     kubectl create secret docker-registry harbor-secret \\"
echo "       --docker-server=$HARBOR_REGISTRY \\"
echo "       --docker-password=<your-password> \\"
echo "       --docker-email=<your-email> \\"
echo "       -n elite-namespace"
echo ""
echo "  3  Deploy services to GKE:"
echo "     kubectl apply -k backend/kubernetes/"
echo "     kubectl apply -k frontend/kubernetes/"
echo "     kubectl apply -k tracking-service/kubernetes/"
echo "     kubectl apply -k AI_Intergration_Service/kubernetes/"
echo ""
echo "  4  Verify deployments:"
echo "     kubectl get all -n elite-namespace"
echo ""
echo "  5  Check pod status:"
echo "     kubectl get pods -n elite-namespace"
echo ""
echo "  6  View logs (example):"
echo "     kubectl logs -f deployment/elite-backend -n elite-namespace"
echo ""

echo "Success: All services ready for GKE deployment!"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo "Warning: Some services failed to build. Please review the output above."
    exit 1
fi

echo "Deployment preparation complete!"
echo ""
