#!/bin/bash
# Simple production startup script

set -e

echo "=== Starting VMS Production ==="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found!"
    echo "Please create it with:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Check if docker-compose-prod.yml exists
if [ ! -f docker-compose-prod.yml ]; then
    echo "ERROR: docker-compose-prod.yml not found!"
    exit 1
fi

# Fix permissions
echo "Fixing permissions..."
sudo chown -R 1001:1001 prisma/ 2>/dev/null || true
sudo chmod 755 prisma/
sudo chmod 644 prisma/dev.db 2>/dev/null || true

# Stop existing container
echo "Stopping existing container..."
sudo docker-compose -f docker-compose-prod.yml down 2>/dev/null || true

# Pull latest image
echo "Pulling latest image..."
sudo docker-compose -f docker-compose-prod.yml pull || echo "Could not pull, using local image"

# Start container
echo "Starting container..."
sudo docker-compose -f docker-compose-prod.yml up -d

# Wait for startup
echo "Waiting for application to start..."
sleep 10

# Check status
echo ""
echo "=== Container Status ==="
sudo docker ps | grep vms-thaipbs

echo ""
echo "=== Checking Health ==="
sleep 5
curl -s http://localhost:3000/api/health || echo "Health check pending..."

echo ""
echo "=== View Logs ==="
echo "Run: sudo docker-compose -f docker-compose-prod.yml logs -f"
echo ""
echo "✓ Startup complete!"
