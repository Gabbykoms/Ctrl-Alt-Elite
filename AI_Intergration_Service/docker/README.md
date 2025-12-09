# Docker Deployment Guide

This folder contains all Docker-related files for local development and containerization.

## Structure

```
docker/
├── Dockerfile              # Container image definition
├── docker-compose.yml      # Local development with PostgreSQL + AI Service
├── .dockerignore          # Files to exclude from Docker build
├── docker-quickstart.sh   # Interactive setup script
├── Makefile               # Convenient command shortcuts
└── README_DOCKER.md       # This file
```

## Quick Start

From the root directory:

```bash
# Make quickstart script executable
chmod +x docker/docker-quickstart.sh

# Run interactive setup
./docker/docker-quickstart.sh

# Or use Make commands
make build
make up
```

## Docker Files Explained

### Dockerfile
- **Multi-stage build** for smaller image size
- **Build stage**: Installs dependencies
- **Runtime stage**: Only includes runtime requirements
- **Health check**: Monitors service availability
- No secrets or .env files included

### docker-compose.yml
- **PostgreSQL service**: Database with pgvector extension
- **AI Service**: FastAPI application
- **Networking**: Internal Docker network for communication
- **Health checks**: Monitors both services
- **Volumes**: Persistent storage for database

### .dockerignore
- Similar to .gitignore
- Explicitly excludes .env files (security!)
- Reduces build context size

## Common Commands

```bash
# Using Make (from root directory)
make build              # Build images
make up                 # Start services
make down               # Stop services
make logs-ai            # View AI service logs
make shell-db           # Connect to PostgreSQL
make backup             # Backup database

# Using docker-compose directly
docker-compose -f docker/docker-compose.yml up -d
docker-compose -f docker/docker-compose.yml logs -f
docker-compose -f docker/docker-compose.yml down

# Using quickstart script
./docker/docker-quickstart.sh              # Interactive setup
./docker/docker-quickstart.sh build        # Build only
./docker/docker-quickstart.sh start        # Start only
```

## Environment Variables

Configuration is loaded from `.env` file in the root directory. This file:
- **NOT included** in Docker image
- Loaded by docker-compose at runtime
- Contains API keys and passwords (in development only)

For production, use Kubernetes Secrets instead (see `kubernetes/` folder).

## Security Notes

### [GOOD] What we do right:
- No secrets in Docker image
- Health checks for automatic recovery
- Volume mounts for data persistence
- Internal networking between services

### [WARNING] Development only considerations:
- .env file contains API keys locally
- Should not be committed to Git
- Use `.env.example` as template

### [GOOD] For production:
- Use Kubernetes Secrets instead
- Use external managed database
- Use environment-specific configurations
- Enable proper authentication

## Troubleshooting

### Port already in use
```bash
# Change ports in docker-compose.yml
# Or kill existing process
lsof -i :8083
kill -9 <PID>
```

### Database connection failed
```bash
# Check database logs
make logs-db

# Verify database is healthy
docker-compose -f docker/docker-compose.yml ps
```

### Image build fails
```bash
# Rebuild without cache
docker-compose -f docker/docker-compose.yml build --no-cache

# Check logs
docker-compose -f docker/docker-compose.yml logs
```

## Moving to Production

When ready to deploy to Kubernetes:

1. Docker image is production-ready (no secrets included)
2. Use `kubernetes/` folder for K8s manifests
3. Store secrets in Kubernetes Secrets or Sealed Secrets
4. Use external managed PostgreSQL service
5. Configure Ingress for external access

See `kubernetes/README.md` for deployment instructions.
