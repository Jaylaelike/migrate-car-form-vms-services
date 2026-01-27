# Quick Start: Docker Hub Deployment

## 🚀 5-Minute Deployment Guide

### Prerequisites
- Docker and Docker Compose installed
- Docker Hub account (jaylaelove)
- Production server with SSH access

---

## Part 1: Build & Push (Local Machine)

### Step 1: Login to Docker Hub
```bash
docker login
# Username: jaylaelove
# Password: [your-docker-hub-token]
```

### Step 2: Build and Push Image
```bash
# Using Makefile (recommended)
make push

# Or manual command
docker buildx build --platform linux/amd64 --push -t jaylaelove/vms-thaipbs-app:latest .
```

**Expected Output:**
```
✓ Building image...
✓ Pushing to Docker Hub...
✓ Image pushed: jaylaelove/vms-thaipbs-app:latest
```

---

## Part 2: Deploy (Production Server)

### Step 1: SSH to Server
```bash
ssh user@your-server.com
```

### Step 2: Setup Application Directory (First Time Only)
```bash
# Create directory
sudo mkdir -p /opt/vms-app
cd /opt/vms-app

# Create required directories
mkdir -p prisma public/uploads backups

# Copy docker-compose-prod.yml
# (Use scp, git clone, or paste content)
```

### Step 3: Configure Environment
```bash
# Create .env.production
nano .env.production
```

Paste this content (update values):
```env
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=your_secure_secret_here_min_32_chars
NEXTAUTH_SECRET=your_secure_secret_here_min_32_chars
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com
```

Generate secrets:
```bash
openssl rand -base64 32
```

### Step 4: Copy Database (If Migrating)
```bash
# From local machine (in another terminal)
scp prisma/dev.db user@your-server.com:/opt/vms-app/prisma/
```

### Step 5: Deploy
```bash
# Option A: Using deployment script (recommended)
chmod +x deploy.sh
./deploy.sh

# Option B: Using docker-compose
docker-compose -f docker-compose-prod.yml pull
docker-compose -f docker-compose-prod.yml up -d
```

### Step 6: Verify
```bash
# Check health
curl http://localhost:3000/api/health

# Check logs
docker-compose -f docker-compose-prod.yml logs -f

# Check container
docker ps | grep vms-thaipbs
```

---

## Part 3: Setup Reverse Proxy (Optional but Recommended)

### Using Nginx

```bash
# Install nginx
sudo apt update
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/vms-app
```

Paste this config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/vms-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Add SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Common Commands

### On Local Machine
```bash
# Build and push
make push

# Push with version tag
make push-tag

# Test locally first
make prod-build
make health
```

### On Production Server
```bash
# Deploy
./deploy.sh

# View logs
docker-compose -f docker-compose-prod.yml logs -f

# Restart
docker-compose -f docker-compose-prod.yml restart

# Stop
docker-compose -f docker-compose-prod.yml down

# Backup database
cp prisma/dev.db backups/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Check health
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Image Pull Fails
```bash
# Check Docker Hub login
docker login

# Manually pull
docker pull jaylaelove/vms-thaipbs-app:latest

# Check if image exists on Docker Hub
docker search jaylaelove/vms-thaipbs-app
```

### Container Won't Start
```bash
# Check logs
docker logs vms-thaipbs-prod

# Check if port is in use
sudo lsof -i :3000

# Check permissions
ls -la prisma/dev.db
sudo chown 1001:1001 prisma/dev.db
```

### Health Check Fails
```bash
# Check if container is running
docker ps

# Check logs for errors
docker logs vms-thaipbs-prod | grep -i error

# Check database
ls -la prisma/dev.db
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
```

### Database Issues
```bash
# Restore from backup
cp backups/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db
docker-compose -f docker-compose-prod.yml restart
```

---

## Update Workflow

### When You Make Changes

**1. Local Testing**
```bash
# Test changes locally
make dev
# Verify changes work
make dev-down
```

**2. Build and Push**
```bash
# Build production image
make prod-build
make health

# Push to Docker Hub
make push
```

**3. Deploy to Production**
```bash
# SSH to server
ssh user@your-server.com

# Deploy
cd /opt/vms-app
./deploy.sh
```

**4. Verify**
```bash
# Check health
curl https://your-domain.com/api/health

# Check logs
docker-compose -f docker-compose-prod.yml logs --tail=50

# Test in browser
# Open: https://your-domain.com
```

---

## Automated Deployment (Optional)

### Create Update Script on Server

```bash
nano /opt/vms-app/update.sh
```

Content:
```bash
#!/bin/bash
cd /opt/vms-app
git pull  # If using git
./deploy.sh
```

Make executable:
```bash
chmod +x /opt/vms-app/update.sh
```

### Deploy from Local Machine
```bash
# Push to Docker Hub
make push

# Trigger deployment on server
ssh user@your-server.com '/opt/vms-app/update.sh'
```

---

## Monitoring

### Setup Health Check Monitoring

**Using cron:**
```bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * curl -f http://localhost:3000/api/health || echo "Health check failed" | mail -s "VMS Health Alert" admin@example.com
```

**Using systemd timer:**
```bash
# Create service
sudo nano /etc/systemd/system/vms-health-check.service
```

Content:
```ini
[Unit]
Description=VMS Health Check

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -f http://localhost:3000/api/health
```

Create timer:
```bash
sudo nano /etc/systemd/system/vms-health-check.timer
```

Content:
```ini
[Unit]
Description=VMS Health Check Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl enable vms-health-check.timer
sudo systemctl start vms-health-check.timer
```

---

## Backup Strategy

### Automated Backups

```bash
# Create backup script
nano /opt/vms-app/backup.sh
```

Content:
```bash
#!/bin/bash
BACKUP_DIR="/opt/vms-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /opt/vms-app/prisma/dev.db $BACKUP_DIR/dev.db.backup.$DATE
find $BACKUP_DIR -name "*.backup.*" -mtime +30 -delete
```

Make executable and schedule:
```bash
chmod +x /opt/vms-app/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /opt/vms-app/backup.sh
```

---

## Success Checklist

- ✅ Image built and pushed to Docker Hub
- ✅ Production server configured
- ✅ Environment variables set
- ✅ Database copied/migrated
- ✅ Container running
- ✅ Health check passing
- ✅ Application accessible
- ✅ Reverse proxy configured (optional)
- ✅ SSL certificate installed (optional)
- ✅ Backups configured
- ✅ Monitoring setup

---

## Need Help?

- **Detailed Guide**: See [DOCKER_HUB_DEPLOYMENT.md](./DOCKER_HUB_DEPLOYMENT.md)
- **Deployment Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Docker Commands**: See [DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)
- **General Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
