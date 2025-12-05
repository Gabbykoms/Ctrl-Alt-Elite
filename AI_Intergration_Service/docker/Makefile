.PHONY: help build up down logs logs-ai logs-db ps shell test backup restore clean lint format

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

DOCKER_COMPOSE := docker-compose -f docker/docker-compose.yml

help: ## Show this help message
	@echo "$(BLUE)Trinity Shuttle AI Service - Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Build & Deploy$(NC)"
	@echo "  make build              - Build Docker images"
	@echo "  make up                 - Start all services (detached)"
	@echo "  make down               - Stop all services"
	@echo "  make restart            - Restart all services"
	@echo ""
	@echo "$(GREEN)Monitoring$(NC)"
	@echo "  make logs               - View all service logs"
	@echo "  make logs-ai            - View AI service logs"
	@echo "  make logs-db            - View database logs"
	@echo "  make ps                 - Show running containers"
	@echo "  make stats              - Show container resource stats"
	@echo ""
	@echo "$(GREEN)Database$(NC)"
	@echo "  make shell-db           - Connect to PostgreSQL shell"
	@echo "  make backup             - Backup database to backup.sql"
	@echo "  make restore            - Restore database from backup.sql"
	@echo "  make init-db            - Initialize/reset database"
	@echo ""
	@echo "$(GREEN)Testing & Maintenance$(NC)"
	@echo "  make test               - Run tests"
	@echo "  make ingest             - Ingest knowledge base"
	@echo "  make shell              - Open service shell"
	@echo "  make lint               - Run linting"
	@echo "  make format             - Format code"
	@echo ""
	@echo "$(GREEN)Cleanup$(NC)"
	@echo "  make clean              - Remove containers and volumes ([WARNING] deletes data!)"
	@echo "  make clean-images       - Remove Docker images"
	@echo ""

# Build
build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✓ Build complete$(NC)"

rebuild: ## Rebuild images without cache
	@echo "$(BLUE)Rebuilding Docker images (no cache)...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

# Start/Stop
up: ## Start all services in detached mode
	@echo "$(BLUE)Starting services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "$(BLUE)Waiting for services to be ready...$(NC)"
	@sleep 5
	@$(MAKE) ps

down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: down up ## Restart all services

ps: ## Show running containers and their status
	@echo "$(BLUE)Running containers:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(BLUE)Access points:$(NC)"
	@echo "  API Documentation: http://localhost:8083/docs"
	@echo "  Health Check: http://localhost:8083/health"
	@echo "  PostgreSQL: localhost:5432"

# Logs
logs: ## View all service logs
	$(DOCKER_COMPOSE) logs -f

logs-ai: ## View AI service logs
	$(DOCKER_COMPOSE) logs -f ai-service

logs-db: ## View database logs
	$(DOCKER_COMPOSE) logs -f postgres

logs-follow: ## Follow logs (same as logs target)
	$(MAKE) logs

# Stats
stats: ## Show container resource usage statistics
	@echo "$(BLUE)Container Resource Usage:$(NC)"
	docker stats

# Shell access
shell: ## Open shell in AI service container
	@$(DOCKER_COMPOSE) exec ai-service /bin/bash

shell-db: ## Open PostgreSQL shell
	@$(DOCKER_COMPOSE) exec postgres psql -U trinity_user -d trinity_shuttle_db

shell-root: ## Open shell in AI service as root
	@$(DOCKER_COMPOSE) exec -u root ai-service /bin/bash

# Database operations
backup: ## Backup PostgreSQL database
	@echo "$(BLUE)Backing up database...$(NC)"
	@mkdir -p ./backups
	@$(DOCKER_COMPOSE) exec -T postgres pg_dump -U trinity_user trinity_shuttle_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup complete: backups/backup_$(shell date +%Y%m%d_%H%M%S).sql$(NC)"

restore: ## Restore PostgreSQL database (restores from latest backup)
	@echo "$(BLUE)Restoring database...$(NC)"
	@BACKUP_FILE=$$(ls -t backups/backup_*.sql | head -n1); \
	if [ -z "$$BACKUP_FILE" ]; then \
		echo "$(RED)✗ No backup file found$(NC)"; \
		exit 1; \
	fi; \
	echo "Restoring from: $$BACKUP_FILE"; \
	$(DOCKER_COMPOSE) exec -T postgres psql -U trinity_user trinity_shuttle_db < $$BACKUP_FILE; \
	echo "$(GREEN)✓ Restore complete$(NC)"

init-db: ## Initialize/reset database (removes existing data!)
	@echo "$(RED)⚠️  WARNING: This will reset the database and delete all data!$(NC)"
	@read -p "Are you sure? (y/N): " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Reinitializing database...$(NC)"; \
		$(DOCKER_COMPOSE) down postgres; \
		docker volume rm ai_intergration_service_postgres_data 2>/dev/null || true; \
		$(DOCKER_COMPOSE) up -d postgres; \
		sleep 5; \
		echo "$(GREEN)✓ Database reinitialized$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

# Testing
test: ## Run tests inside container
	@echo "$(BLUE)Running tests...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python -m pytest tests/ -v

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python -m pytest tests/ --cov=app --cov-report=html
	@echo "$(GREEN)✓ Coverage report generated in htmlcov/$(NC)"

# Data ingestion
ingest: ## Ingest knowledge base into vector database
	@echo "$(BLUE)Ingesting knowledge base...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python scripts/ingest_knowledge_base.py
	@echo "$(GREEN)✓ Ingestion complete$(NC)"

quick-test: ## Run quick connection tests
	@echo "$(BLUE)Running quick tests...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python scripts/quick_test.py

# Code quality
lint: ## Run linting checks
	@echo "$(BLUE)Running linting...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python -m pylint app/ --disable=all --enable=E,F
	@echo "$(GREEN)✓ Linting complete$(NC)"

format: ## Format code with black
	@echo "$(BLUE)Formatting code...$(NC)"
	$(DOCKER_COMPOSE) exec ai-service python -m black app/ tests/
	@echo "$(GREEN)✓ Formatting complete$(NC)"

# Health checks
health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -s http://localhost:8083/health | python -m json.tool
	@echo ""
	@echo "$(BLUE)Container status:$(NC)"
	@$(DOCKER_COMPOSE) ps

# Cleanup
clean: ## Remove all containers and volumes (WARNING: deletes data!)
	@echo "$(RED)⚠️  WARNING: This will remove all containers and delete all data!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " -r; \
	echo; \
	if [[ $$REPLY == "yes" ]]; then \
		echo "$(BLUE)Cleaning up...$(NC)"; \
		$(DOCKER_COMPOSE) down -v; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

clean-images: ## Remove Docker images
	@echo "$(BLUE)Removing Docker images...$(NC)"
	$(DOCKER_COMPOSE) down
	docker rmi trinity-ai-service:latest
	@echo "$(GREEN)✓ Images removed$(NC)"

# Development
dev: ## Start services in development mode with live logs
	@echo "$(BLUE)Starting services in development mode...$(NC)"
	$(DOCKER_COMPOSE) up

dev-build: ## Rebuild and start in development mode
	@echo "$(BLUE)Rebuilding and starting in development mode...$(NC)"
	$(DOCKER_COMPOSE) up --build

# Info
version: ## Show version information
	@echo "$(BLUE)Version Information:$(NC)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"
	@echo ""
	@$(DOCKER_COMPOSE) exec ai-service python -c "import app; print('AI Service: Ready')"

env-check: ## Check environment configuration
	@echo "$(BLUE)Checking .env file...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found$(NC)"; \
		echo "$(BLUE)Creating .env from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env created. Please update with your configuration.$(NC)"; \
	else \
		echo "$(GREEN)✓ .env file found$(NC)"; \
		echo "$(BLUE)Required variables:$(NC)"; \
		grep -E "^[A-Z_]+=" .env | head -10; \
	fi

# Default target
.DEFAULT_GOAL := help
