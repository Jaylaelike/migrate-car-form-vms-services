#!/bin/bash
set -e

# Configuration
APP_DIR="${APP_DIR:-$(pwd)}"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="docker-compose-prod.yml"
HEALTH_URL="http://localhost:3000/api/health"
MAX_WAIT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_requirements() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "$COMPOSE_FILE not found"
        exit 1
    fi
}

backup_database() {
    log_info "Backing up database..."
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$APP_DIR/prisma/dev.db" ]; then
        cp "$APP_DIR/prisma/dev.db" "$BACKUP_DIR/dev.db.backup.$DATE"
        log_info "Database backed up to $BACKUP_DIR/dev.db.backup.$DATE"
    else
        log_warn "No database file found to backup"
    fi
}

pull_image() {
    log_info "Pulling latest image..."
    if docker-compose -f "$COMPOSE_FILE" pull; then
        log_info "Image pulled successfully"
    else
        log_error "Failed to pull image"
        exit 1
    fi
}

stop_container() {
    log_info "Stopping current container..."
    docker-compose -f "$COMPOSE_FILE" down
    log_info "Container stopped"
}

start_container() {
    log_info "Starting new container..."
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        log_info "Container started"
    else
        log_error "Failed to start container"
        return 1
    fi
}

wait_for_health() {
    log_info "Waiting for application to be ready..."
    local elapsed=0
    
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
            log_info "Application is healthy!"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    
    echo ""
    log_error "Health check timeout after ${MAX_WAIT}s"
    return 1
}

show_logs() {
    log_info "Recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
}

rollback() {
    log_warn "Rolling back to previous version..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/dev.db.backup.* 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" "$APP_DIR/prisma/dev.db"
        log_info "Database restored from $LATEST_BACKUP"
    fi
    
    docker-compose -f "$COMPOSE_FILE" up -d
    log_warn "Rollback complete"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 30 days)..."
    find "$BACKUP_DIR" -name "dev.db.backup.*" -mtime +30 -delete 2>/dev/null || true
    log_info "Old backups cleaned"
}

# Main deployment process
main() {
    echo "==================================="
    echo "  VMS Deployment Script"
    echo "==================================="
    echo "Date: $DATE"
    echo "Directory: $APP_DIR"
    echo ""
    
    # Check requirements
    check_requirements
    
    # Backup database
    backup_database
    
    # Pull latest image
    pull_image
    
    # Stop current container
    stop_container
    
    # Start new container
    if ! start_container; then
        rollback
        exit 1
    fi
    
    # Wait for health check
    if ! wait_for_health; then
        show_logs
        rollback
        exit 1
    fi
    
    # Show logs
    show_logs
    
    # Cleanup old backups
    cleanup_old_backups
    
    echo ""
    echo "==================================="
    echo "  Deployment Complete!"
    echo "==================================="
    echo "Application: http://localhost:3000"
    echo "Health: $HEALTH_URL"
    echo ""
    echo "Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Check health: curl $HEALTH_URL"
    echo "  Restart: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# Run main function
main
