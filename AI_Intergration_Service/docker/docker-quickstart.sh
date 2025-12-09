#!/bin/bash

# Trinity Shuttle AI Service - Docker Quick Start Script
# This script helps with initial setup and common Docker operations

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose found: $DOCKER_COMPOSE_VERSION"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Check if running from correct directory
    if [ ! -f "docker/docker-compose.yml" ]; then
        print_error "docker/docker-compose.yml not found. Please run from AI_Intergration_Service directory."
        exit 1
    fi
    
    print_success "All prerequisites met!\n"
}

setup_env() {
    print_header "Setting Up Environment"
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "Keeping existing .env file"
            return
        fi
    fi
    
    if [ ! -f ".env.example" ]; then
        print_error ".env.example not found"
        exit 1
    fi
    
    cp .env.example .env
    print_success ".env file created"
    
    # Prompt for required API keys
    echo ""
    echo "Please enter your OpenAI API key:"
    read -r OPENAI_API_KEY
    
    # Update .env with API key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_API_KEY/" .env
    else
        # Linux
        sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_API_KEY/" .env
    fi
    
    print_success "API key configured in .env"
    echo ""
    echo "Please review .env and update any other settings as needed:"
    echo "  - DATABASE configuration"
    echo "  - ALLOWED_ORIGINS for CORS"
    echo "  - External service URLs"
    echo ""
}

build_images() {
    print_header "Building Docker Images"
    
    docker-compose -f docker/docker-compose.yml build
    
    if [ $? -eq 0 ]; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

start_services() {
    print_header "Starting Services"
    
    docker-compose -f docker/docker-compose.yml up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started"
        sleep 3
    else
        print_error "Failed to start services"
        exit 1
    fi
}

verify_services() {
    print_header "Verifying Services"
    
    # Check if containers are running
    if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
        print_success "Services are running"
    else
        print_error "Services failed to start"
        docker-compose -f docker/docker-compose.yml logs
        exit 1
    fi
    
    # Check API health
    echo "Checking API health..."
    for i in {1..30}; do
        if curl -s http://localhost:8083/health > /dev/null 2>&1; then
            print_success "API is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "API health check timed out (this may be normal if starting for first time)"
        fi
        sleep 1
    done
    
    # Check database
    echo "Checking database..."
    if docker-compose -f docker/docker-compose.yml exec -T postgres psql -U trinity_user -d trinity_shuttle_db -c "SELECT 1" > /dev/null 2>&1; then
        print_success "Database is healthy"
    else
        print_warning "Database check failed"
    fi
}

show_access_info() {
    print_header "Access Information"
    
    echo "Services are running and ready to use!"
    echo ""
    echo "API Documentation:"
    echo "  ${BLUE}http://localhost:8083/docs${NC}"
    echo ""
    echo "Health Check:"
    echo "  ${BLUE}http://localhost:8083/health${NC}"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:         ${BLUE}docker-compose -f docker/docker-compose.yml logs -f ai-service${NC}"
    echo "  Database shell:    ${BLUE}docker-compose -f docker/docker-compose.yml exec postgres psql -U trinity_user -d trinity_shuttle_db${NC}"
    echo "  Service shell:     ${BLUE}docker-compose -f docker/docker-compose.yml exec ai-service bash${NC}"
    echo "  Stop services:     ${BLUE}docker-compose -f docker/docker-compose.yml down${NC}"
    echo "  Make commands:     ${BLUE}make -f docker/Makefile help${NC}"
    echo ""
}

ingest_knowledge_base() {
    read -p "Do you want to ingest the knowledge base now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_header "Ingesting Knowledge Base"
        docker-compose -f docker/docker-compose.yml exec ai-service python scripts/ingest_knowledge_base.py
        if [ $? -eq 0 ]; then
            print_success "Knowledge base ingested successfully"
        else
            print_warning "Knowledge base ingestion completed with warnings"
        fi
    fi
}

# Main execution
main() {
    print_header "Trinity Shuttle AI Service - Docker Setup"
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        # Interactive mode
        check_prerequisites
        setup_env
        build_images
        start_services
        verify_services
        ingest_knowledge_base
        show_access_info
    else
        case "$1" in
            check)
                check_prerequisites
                ;;
            env)
                setup_env
                ;;
            build)
                build_images
                ;;
            start)
                start_services
                ;;
            verify)
                verify_services
                ;;
            full)
                check_prerequisites
                setup_env
                build_images
                start_services
                verify_services
                show_access_info
                ;;
            *)
                echo "Usage: $0 {check|env|build|start|verify|full}"
                echo ""
                echo "Commands:"
                echo "  check     - Check prerequisites"
                echo "  env       - Setup .env file"
                echo "  build     - Build Docker images"
                echo "  start     - Start services"
                echo "  verify    - Verify services are running"
                echo "  full      - Run full setup (default if no args)"
                exit 1
                ;;
        esac
    fi
}

main "$@"
