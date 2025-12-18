# Building Docker Images for Ctrl Alt Elite

This guide covers how to build Docker images for all four microservices in the bantam shuttle project.

## Prerequisites

- Docker installed and running
- Access to the project root directory
- (Optional) Harbor registry credentials for pushing images

## Build Script Overview

The project includes `build-and-push-harbour.sh` which handles building Docker images for all services and optionally pushing them to Harbor registry.

### Services Built

1. **Backend** (Node.js/Express) - Authentication API server
2. **Frontend** (React/TypeScript) - Web application
3. **Tracking Service** (Java/Spring Boot) - Vehicle tracking, stop management, ride ordering
4. **AI Service** (Python/FastAPI) - AI chatbot

## Building Images

### Option 1: Using the Build Script (If Building All Micro-services)

```bash
cd /path/to/Ctrl-Alt-Elite

# Set configuration variables
export HARBOR_REGISTRY="harbor.javajon-gke.duckdns.org"
export VERSION="latest"
export PLATFORM="linux/amd64"

# Run the build script
./build-and-push-harbour.sh
```

**What the script does:**
- Verifies Docker is running
- Builds all four microservices
- Tags images with the specified version
- Optionally pushes to Harbor if credentials are configured

### Option 2: Manual Docker Build

If you prefer to build individually or want to update a microservice:

#### Backend
```bash
cd backend
docker build --platform="linux/amd64" -f Dockerfile -t elite-backend:latest .
```

#### Frontend
```bash
cd frontend
docker build --platform="linux/amd64" -f Dockerfile -t elite-frontend:latest .
```

#### Tracking Service
```bash
cd tracking-service
docker build --platform="linux/amd64" -f Dockerfile -t elite-tracking-service:latest .
```

#### AI Service
```bash
cd AI_Intergration_Service/docker
docker build --platform="linux/amd64" -f Dockerfile -t elite-ai-service:latest .
```


## Verifying Images

After building, verify your images exist:

```bash
docker images | grep elite
```

Expected output:
```
elite-backend          latest      abc123def456   2 minutes ago   450MB
elite-frontend         latest      xyz789uvw012   1 minute ago    200MB
elite-tracking-service latest      def456ghi789   3 minutes ago   500MB
elite-ai-service       latest      uvw012jkl345   2 minutes ago   1.2GB
```

## Pushing to Harbor

Once your images are built and tagged, push them to Harbor registry.

**For detailed instructions on pushing to Harbor, including login and retagging, see [`README_HARBOUR.md`](README_HARBOUR.md)**


## Troubleshooting

### Docker not found
```bash
# Verify Docker is installed and running
docker --version
docker ps
```

### Build fails
- Check Dockerfile exists in the service directory
- Verify all dependencies are available
- Review build logs for specific errors

### Images not appearing
- Verify build completed without errors
- Check image names: `docker images | grep elite`
- Ensure correct version tag was used


## Next Steps

Once images are built:
1. Test locally with `docker run` or `docker-compose`
2. Push to Harbor (see `README_HARBOUR.md`)
3. Deploy to Kubernetes (see `README_K8s.md`)


---

**For Harbor push instructions, see**: [`README_HARBOUR.md`](README_HARBOUR.md)
**For Kubernetes deployment instructions, see**: [`README_k8s.md`](README_K8s.md)