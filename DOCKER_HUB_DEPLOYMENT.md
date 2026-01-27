# Docker Hub & Production Deployment Guide

## Overview
This guide covers building, pushing to Docker Hub, and deploying to production servers.

## Prerequisites

### 1. Docker Hub Account
- Create account at https://hub.docker.com
- Repository: `jaylaelove/vms-thaipbs-app`

### 2. Docker Buildx Setup
```bash
# Check if buildx is available
docker buildx version

# Create and use a new builder (if needed)
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap
```

### 3. Login to Docker Hub
```bash
# Option 1: Using Makefile
make docker-login

# Option 2: Manual
docker login
# Enter username: jaylaelove
# Enter password: [your-docker-hub-token]
```

**Security Tip**: Use access tokens instead of passwords
- Go to Docker Hub → Account Settings → Security → New Access Token
- Use token as password when logging in

## Building & Pushing Images

### Method 1: Using Makefile (Recommended)

#### Push Latest (AMD64)
```bash
make push
```

This runs:
```bash
docker buildx build --platform linux/amd64 --push -t jaylaelove/vms-thaipbs-app:latest .
```

#### Push Multi-Platform (AMD64 + ARM64)
```bash
make push-multi
```

This runs:
```bash
docker buildx build --platform linux/amd64,linux/arm64 --push -t jaylaelove/vms-thaipbs-app:latest .
```

#### Push with Version Tag
```bash
make push-tag
# Enter version when prompted (e.g., v1.0.0)
```

This creates both versioned and latest tags:
- `jaylaelove/vms-thaipbs-app:v1.0.0`
- `jaylaelove/vms-thaipbs-app:latest`

### Method 2: Manual Commands

#### Single Platform (AMD64)
```bash
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t jaylaelove/vms-thaipbs-app:latest \
  .
```

#### Multi-Platform
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  -t jaylaelove/vms-thaipbs-app:latest \
  .
```

#### With Version Tag
```bash
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t jaylaelove/vms-thaipbs-app:v1.0.0 \
  -t jaylaelove/vms-thaipbs-app:latest \
  .
```

#### Build Without Pushing (Test)
```bash
docker buildx build \
  --platform linux/amd64 \
  -t jaylaelove/vms-thaipbs-app:test \
  --load \
  .
```

## Production Server Deployment

### Preparation

#### 1. On Your Local Machine

**Backup Database**
```bash
make backup
# or
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

**Push Latest Image**
```bash
make push
```

#### 2. On Production Server

**Initial Setup** (First time only)
```bash
# SSH to server
ssh user@your-server.com

# Create application directory
mkdir -p /opt/vms-app
cd /opt/vms-app

# Copy docker-compose-prod.yml
# (Use scp, git, or paste content)

# Create .env.production
nano .env.production
```

**.env.production** content:
```env
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=your_secure_secret_here
NEXTAUTH_SECRET=your_secure_secret_here
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com
```

**Create Required Directories**
```bash
mkdir -p prisma public/uploads
chmod 755 prisma public/uploads
```

**Copy Existing Database** (if migrating)
```bash
# From local machine
scp prisma/dev.db user@your-server.com:/opt/vms-app/prisma/
```

### Deployment Methods

#### Method 1: Using Docker Compose (Recommended)

**On Production Server:**
```bash
cd /opt/vms-app

# Pull latest image
docker-compose -f docker-compose-prod.yml pull

# Start/restart services
docker-compose -f docker-compose-prod.yml up -d

# Check logs
docker-compose -f docker-compose-prod.yml logs -f

# Check health
curl http://localhost:3000/api/health
```

#### Method 2: Using Makefile (If Makefile is on server)

```bash
cd /opt/vms-app
make prod
make health
```

#### Method 3: Direct Docker Commands

```bash
# Pull image
docker pull jaylaelove/vms-thaipbs-app:latest

# Stop old container
docker stop vms-thaipbs-prod
docker rm vms-thaipbs-prod

# Run new container
docker run -d \
  --name vms-thaipbs-prod \
  --restart always \
  -p 3000:3000 \
  -v $(pwd)/prisma:/app/prisma:rw \
  -v $(pwd)/public/uploads:/app/public/uploads:rw \
  --env-file .env.production \
  jaylaelove/vms-thaipbs-app:latest

# Check logs
docker logs -f vms-thaipbs-prod
```

### Automated Deployment Script

Create `deploy.sh` on production server:

```bash
#!/bin/bash
set -e

APP_DIR="/opt/vms-app"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=== VMS Deployment Script ==="
echo "Date: $DATE"
echo ""

# Navigate to app directory
cd $APP_DIR

# Backup database
echo "1. Backing up database..."
mkdir -p $BACKUP_DIR
cp prisma/dev.db $BACKUP_DIR/dev.db.backup.$DATE
echo "✓ Database backed up to $BACKUP_DIR/dev.db.backup.$DATE"

# Pull latest image
echo ""
echo "2. Pulling latest image..."
docker-compose -f docker-compose-prod.yml pull
echo "✓ Image pulled"

# Stop current container
echo ""
echo "3. Stopping current container..."
docker-compose -f docker-compose-prod.yml down
echo "✓ Container stopped"

# Start new container
echo ""
echo "4. Starting new container..."
docker-compose -f docker-compose-prod.yml up -d
echo "✓ Container started"

# Wait for health check
echo ""
echo "5. Waiting for application to be ready..."
sleep 10

# Check health
echo ""
echo "6. Checking application health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Application is healthy!"
else
    echo "✗ Health check failed!"
    echo "Rolling back..."
    docker-compose -f docker-compose-prod.yml down
    cp $BACKUP_DIR/dev.db.backup.$DATE prisma/dev.db
    docker-compose -f docker-compose-prod.yml up -d
    exit 1
fi

# Show logs
echo ""
echo "7. Recent logs:"
docker-compose -f docker-compose-prod.yml logs --tail=20

echo ""
echo "=== Deployment Complete ==="
echo "Application: http://localhost:3000"
echo "Health: http://localhost:3000/api/health"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

## Complete Deployment Workflow

### Step-by-Step Process

#### 1. Local Development & Testing
```bash
# Test locally
make dev
# Test your changes
# Check http://localhost:3000

# Stop dev
make dev-down
```

#### 2. Build & Test Production Image Locally
```bash
# Build production image
make prod-build

# Test production image
make health
make prod-logs

# Stop if satisfied
make prod-down
```

#### 3. Push to Docker Hub
```bash
# Login (first time only)
make docker-login

# Push image
make push

# Or push with version tag
make push-tag
# Enter: v1.0.0
```

#### 4. Deploy to Production Server

**Option A: SSH and Deploy**
```bash
# SSH to server
ssh user@your-server.com

# Navigate to app directory
cd /opt/vms-app

# Run deployment script
./deploy.sh
```

**Option B: Remote Deployment (from local)**
```bash
# Create remote deployment script
ssh user@your-server.com 'cd /opt/vms-app && ./deploy.sh'
```

#### 5. Verify Deployment
```bash
# Check health
curl https://your-domain.com/api/health

# Check logs
ssh user@your-server.com 'cd /opt/vms-app && docker-compose -f docker-compose-prod.yml logs --tail=50'

# Test application
# Open browser: https://your-domain.com
```

## Rollback Procedure

### If Deployment Fails

#### 1. Stop Current Container
```bash
docker-compose -f docker-compose-prod.yml down
```

#### 2. Restore Database
```bash
# List backups
ls -lh backups/

# Restore specific backup
cp backups/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db
```

#### 3. Deploy Previous Version
```bash
# Pull specific version
docker pull jaylaelove/vms-thaipbs-app:v1.0.0

# Update docker-compose-prod.yml to use specific version
# Change: image: jaylaelove/vms-thaipbs-app:v1.0.0

# Start
docker-compose -f docker-compose-prod.yml up -d
```

#### 4. Verify Rollback
```bash
curl http://localhost:3000/api/health
docker-compose -f docker-compose-prod.yml logs
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: jaylaelove/vms-thaipbs-app
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/vms-app
            ./deploy.sh
```

**Required Secrets** (GitHub Settings → Secrets):
- `DOCKER_USERNAME`: jaylaelove
- `DOCKER_TOKEN`: Docker Hub access token
- `PROD_HOST`: your-server.com
- `PROD_USER`: deployment-user
- `PROD_SSH_KEY`: SSH private key

## Monitoring & Maintenance

### Health Monitoring
```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-25T...",
  "database": "connected"
}
```

### Log Monitoring
```bash
# Follow logs
docker-compose -f docker-compose-prod.yml logs -f

# Check for errors
docker-compose -f docker-compose-prod.yml logs | grep -i error

# Last 100 lines
docker-compose -f docker-compose-prod.yml logs --tail=100
```

### Resource Monitoring
```bash
# Container stats
docker stats vms-thaipbs-prod

# Disk usage
df -h
du -sh /opt/vms-app/*

# Database size
ls -lh /opt/vms-app/prisma/dev.db
```

## Troubleshooting

### Image Pull Fails
```bash
# Check Docker Hub login
docker login

# Manually pull
docker pull jaylaelove/vms-thaipbs-app:latest

# Check image exists
docker images | grep vms-thaipbs-app
```

### Container Won't Start
```bash
# Check logs
docker logs vms-thaipbs-prod

# Check permissions
ls -la prisma/dev.db
sudo chown 1001:1001 prisma/dev.db

# Check port
lsof -i :3000
```

### Database Issues
```bash
# Check database file
ls -la prisma/dev.db

# Restore from backup
cp backups/dev.db.backup.latest prisma/dev.db

# Check integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
```

## Best Practices

1. **Always backup before deployment**
   ```bash
   make backup
   ```

2. **Use version tags for production**
   ```bash
   make push-tag  # v1.0.0
   ```

3. **Test locally before pushing**
   ```bash
   make prod-build
   make health
   ```

4. **Monitor logs after deployment**
   ```bash
   docker-compose -f docker-compose-prod.yml logs -f
   ```

5. **Keep backups for 30 days**
   ```bash
   find backups/ -name "*.backup.*" -mtime +30 -delete
   ```

6. **Use environment-specific configs**
   - `.env` for development
   - `.env.production` for production

7. **Implement health checks**
   - Application: `/api/health`
   - Container: Docker health check
   - External: Uptime monitoring

## Quick Reference

```bash
# Build and push
make push

# Deploy to production
ssh user@server 'cd /opt/vms-app && ./deploy.sh'

# Check health
curl https://your-domain.com/api/health

# View logs
ssh user@server 'cd /opt/vms-app && docker-compose -f docker-compose-prod.yml logs -f'

# Rollback
ssh user@server 'cd /opt/vms-app && cp backups/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db && docker-compose -f docker-compose-prod.yml restart'
```
