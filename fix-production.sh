#!/bin/bash
# Quick fix script for common production issues

set -e

echo "=== VMS Production Quick Fix ==="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Note: Some operations may require sudo"
    SUDO="sudo"
else
    SUDO=""
fi

# 1. Check .env.production
echo "1. Checking .env.production..."
if [ ! -f .env.production ]; then
    echo "✗ .env.production not found!"
    echo "Creating .env.production..."
    
    read -p "Enter your domain (e.g., your-domain.com): " domain
    
    cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://${domain}
EOF
    
    echo "✓ .env.production created"
else
    echo "✓ .env.production exists"
    
    # Check if secrets are set
    if ! grep -q "AUTH_SECRET=" .env.production || grep -q "AUTH_SECRET=$" .env.production; then
        echo "⚠ AUTH_SECRET not set, generating..."
        echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.production
    fi
    
    if ! grep -q "NEXTAUTH_SECRET=" .env.production || grep -q "NEXTAUTH_SECRET=$" .env.production; then
        echo "⚠ NEXTAUTH_SECRET not set, generating..."
        echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production
    fi
fi
echo ""

# 2. Check database file
echo "2. Checking database file..."
if [ ! -d prisma ]; then
    echo "Creating prisma directory..."
    mkdir -p prisma
fi

if [ ! -f prisma/dev.db ]; then
    echo "⚠ Database file not found"
    echo "Creating empty database..."
    touch prisma/dev.db
fi

echo "✓ Database file exists"
echo ""

# 3. Fix permissions
echo "3. Fixing permissions..."
echo "Setting ownership to UID 1001 (nextjs user in container)..."
$SUDO chown -R 1001:1001 prisma/ 2>/dev/null || {
    echo "⚠ Could not change ownership (may need sudo)"
    echo "Run manually: sudo chown -R 1001:1001 prisma/"
}

$SUDO chmod 755 prisma/
$SUDO chmod 644 prisma/dev.db 2>/dev/null || true

echo "✓ Permissions fixed"
echo ""

# 4. Create uploads directory
echo "4. Checking uploads directory..."
if [ ! -d public/uploads ]; then
    mkdir -p public/uploads
    $SUDO chown -R 1001:1001 public/uploads 2>/dev/null || true
    $SUDO chmod 755 public/uploads
    echo "✓ Uploads directory created"
else
    echo "✓ Uploads directory exists"
fi
echo ""

# 5. Check Docker
echo "5. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "✗ Docker Compose not installed"
    exit 1
fi

echo "✓ Docker and Docker Compose installed"
echo ""

# 6. Stop container
echo "6. Stopping current container..."
docker-compose -f docker-compose-prod.yml down 2>/dev/null || echo "No container to stop"
echo ""

# 7. Pull latest image
echo "7. Pulling latest image..."
if docker-compose -f docker-compose-prod.yml pull; then
    echo "✓ Image pulled"
else
    echo "⚠ Could not pull image, will try to build locally"
fi
echo ""

# 8. Start container
echo "8. Starting container..."
if docker-compose -f docker-compose-prod.yml up -d; then
    echo "✓ Container started"
else
    echo "✗ Failed to start container"
    echo "Check logs: docker-compose -f docker-compose-prod.yml logs"
    exit 1
fi
echo ""

# 9. Wait for startup
echo "9. Waiting for application to start..."
sleep 15
echo ""

# 10. Check health
echo "10. Checking health..."
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Application is healthy!"
    curl -s http://localhost:3000/api/health | head -3
else
    echo "⚠ Health check failed"
    echo "Checking logs..."
    docker-compose -f docker-compose-prod.yml logs --tail=30
fi
echo ""

# 11. Show status
echo "=== Status ==="
docker ps | grep vms-thaipbs || echo "Container not running"
echo ""

echo "=== Next Steps ==="
echo "View logs: docker-compose -f docker-compose-prod.yml logs -f"
echo "Check health: curl http://localhost:3000/api/health"
echo "Restart: docker-compose -f docker-compose-prod.yml restart"
echo ""

echo "=== Environment Variables (verify these) ==="
docker exec vms-thaipbs-prod env 2>/dev/null | grep -E "NODE_ENV|AUTH_SECRET|NEXTAUTH" | sed 's/=.*/=***/' || echo "Container not running"
echo ""

echo "✓ Fix complete!"
