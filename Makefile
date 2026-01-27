.PHONY: help dev prod build up down logs restart backup restore clean health push deploy

# Docker Hub configuration
DOCKER_IMAGE = jaylaelove/vms-thaipbs-app
DOCKER_TAG = latest
PLATFORM = linux/amd64

# Default target
help:
	@echo "VMS Application - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "Production (Local):"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make prod-restart - Restart production"
	@echo ""
	@echo "Docker Hub & Deployment:"
	@echo "  make docker-login - Login to Docker Hub"
	@echo "  make push         - Build and push to Docker Hub"
	@echo "  make push-multi   - Build multi-platform and push"
	@echo "  make deploy       - Deploy to production server"
	@echo ""
	@echo "Database:"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database (interactive)"
	@echo "  make migrate      - Run database migrations"
	@echo ""
	@echo "Maintenance:"
	@echo "  make health       - Check application health"
	@echo "  make shell        - Open shell in container"
	@echo "  make clean        - Remove containers and images"
	@echo "  make stats        - Show container stats"

# Development
dev:
	docker-compose up -d
	@echo "Development environment started at http://localhost:3000"

dev-logs:
	docker-compose logs -f

dev-down:
	docker-compose down

# Production
prod:
	docker-compose -f docker-compose-prod.yml up -d
	@echo "Production environment started at http://localhost:3000"

prod-build:
	docker-compose -f docker-compose-prod.yml up -d --build
	@echo "Production environment built and started"

prod-logs:
	docker-compose -f docker-compose-prod.yml logs -f

prod-down:
	docker-compose -f docker-compose-prod.yml down

prod-restart:
	docker-compose -f docker-compose-prod.yml restart
	@echo "Production environment restarted"

# Database operations
backup:
	@mkdir -p backups
	@BACKUP_FILE=backups/dev.db.backup.$$(date +%Y%m%d_%H%M%S); \
	cp prisma/dev.db $$BACKUP_FILE && \
	echo "Database backed up to $$BACKUP_FILE"

restore:
	@echo "Available backups:"
	@ls -lh backups/dev.db.backup.* 2>/dev/null || echo "No backups found"
	@echo ""
	@read -p "Enter backup filename to restore: " backup; \
	if [ -f "$$backup" ]; then \
		cp $$backup prisma/dev.db && \
		echo "Database restored from $$backup"; \
	else \
		echo "Backup file not found"; \
	fi

migrate:
	docker exec -it vms-thaipbs-prod npx prisma migrate deploy

# Maintenance
health:
	@curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"

shell:
	docker exec -it vms-thaipbs-prod sh

stats:
	docker stats vms-thaipbs-prod --no-stream

clean:
	docker-compose -f docker-compose-prod.yml down -v
	docker-compose down -v
	docker rmi jaylaelove/vms-thaipbs-app:latest || true
	@echo "Cleaned up containers and images"

# Docker Hub operations
docker-login:
	@echo "Logging in to Docker Hub..."
	docker login

push: docker-login
	@echo "Building and pushing $(DOCKER_IMAGE):$(DOCKER_TAG) for $(PLATFORM)..."
	docker buildx build --platform $(PLATFORM) --push -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✓ Image pushed successfully!"
	@echo "Pull with: docker pull $(DOCKER_IMAGE):$(DOCKER_TAG)"

push-multi: docker-login
	@echo "Building and pushing multi-platform image..."
	docker buildx build --platform linux/amd64,linux/arm64 --push -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✓ Multi-platform image pushed successfully!"

push-tag: docker-login
	@read -p "Enter version tag (e.g., v1.0.0): " tag; \
	echo "Building and pushing $(DOCKER_IMAGE):$$tag..."; \
	docker buildx build --platform $(PLATFORM) --push -t $(DOCKER_IMAGE):$$tag -t $(DOCKER_IMAGE):$(DOCKER_TAG) .; \
	echo "✓ Tagged image pushed: $(DOCKER_IMAGE):$$tag"

deploy:
	@echo "Deploying to production server..."
	@echo "Make sure you have:"
	@echo "  1. SSH access to production server"
	@echo "  2. .env.production configured on server"
	@echo "  3. Database backup created"
	@echo ""
	@read -p "Production server address (user@host): " server; \
	echo "Deploying to $$server..."; \
	ssh $$server "cd /path/to/app && docker-compose -f docker-compose-prod.yml pull && docker-compose -f docker-compose-prod.yml up -d"

# Quick commands
up: prod
down: prod-down
logs: prod-logs
restart: prod-restart
