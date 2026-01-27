# Docker Quick Reference

## 🚀 Quick Commands

### Start Production
```bash
make prod-build    # Build and start
make prod          # Start (without rebuild)
make prod-logs     # View logs
```

### Stop/Restart
```bash
make prod-down     # Stop
make prod-restart  # Restart
```

### Database
```bash
make backup        # Backup database
make restore       # Restore database
make migrate       # Run migrations
```

### Monitoring
```bash
make health        # Check health
make stats         # Container stats
make shell         # Open shell
```

## 📋 Manual Commands

### Production Deployment
```bash
# Full deployment
docker-compose -f docker-compose-prod.yml up -d --build

# View logs
docker-compose -f docker-compose-prod.yml logs -f

# Stop
docker-compose -f docker-compose-prod.yml down
```

### Development
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

### Database Operations
```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Restore
cp prisma/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db

# Migrations
docker exec -it vms-thaipbs-prod npx prisma migrate deploy

# Prisma Studio
docker exec -it vms-thaipbs-prod npx prisma studio
```

### Container Management
```bash
# Shell access
docker exec -it vms-thaipbs-prod sh

# View logs (last 100 lines)
docker logs --tail=100 vms-thaipbs-prod

# Follow logs
docker logs -f vms-thaipbs-prod

# Container stats
docker stats vms-thaipbs-prod

# Inspect container
docker inspect vms-thaipbs-prod
```

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/health

# Container health
docker inspect --format='{{.State.Health.Status}}' vms-thaipbs-prod

# Health logs
docker inspect --format='{{json .State.Health}}' vms-thaipbs-prod | jq
```

### Cleanup
```bash
# Remove containers
docker-compose -f docker-compose-prod.yml down

# Remove containers and volumes
docker-compose -f docker-compose-prod.yml down -v

# Remove image
docker rmi jaylaelove/vms-thaipbs-app:latest

# Full cleanup
make clean
```

### Rebuild
```bash
# Rebuild without cache
docker-compose -f docker-compose-prod.yml build --no-cache

# Rebuild and start
docker-compose -f docker-compose-prod.yml up -d --build --force-recreate
```

## 🔍 Troubleshooting

### Check Logs
```bash
docker-compose -f docker-compose-prod.yml logs --tail=100
```

### Database Permissions
```bash
ls -la prisma/dev.db
sudo chown 1001:1001 prisma/dev.db
```

### Port Already in Use
```bash
lsof -i :3000
docker-compose -f docker-compose-prod.yml down
```

### Container Won't Start
```bash
# Check logs
docker logs vms-thaipbs-prod

# Remove and recreate
docker-compose -f docker-compose-prod.yml down -v
docker-compose -f docker-compose-prod.yml up -d
```

## 📊 Monitoring

### Resource Usage
```bash
# Real-time stats
docker stats vms-thaipbs-prod

# Disk usage
docker system df

# Container processes
docker top vms-thaipbs-prod
```

### Logs
```bash
# Follow logs
docker-compose -f docker-compose-prod.yml logs -f

# Last N lines
docker-compose -f docker-compose-prod.yml logs --tail=50

# Since timestamp
docker-compose -f docker-compose-prod.yml logs --since 2024-01-01T00:00:00
```

## 🔐 Security

### Update Secrets
```bash
# Generate new secret
openssl rand -base64 32

# Update .env.production
nano .env.production

# Restart
make prod-restart
```

### File Permissions
```bash
# Check permissions
ls -la prisma/dev.db
ls -la public/uploads/

# Fix if needed
sudo chown -R 1001:1001 prisma/
sudo chown -R 1001:1001 public/uploads/
```

## 📦 Image Management

### Build
```bash
# Build image
docker build -t jaylaelove/vms-thaipbs-app:latest .

# Build with tag
docker build -t jaylaelove/vms-thaipbs-app:v1.0.0 .
```

### Push to Registry
```bash
# Login
docker login

# Push
docker push jaylaelove/vms-thaipbs-app:latest

# Tag and push
docker tag jaylaelove/vms-thaipbs-app:latest jaylaelove/vms-thaipbs-app:v1.0.0
docker push jaylaelove/vms-thaipbs-app:v1.0.0
```

### Pull
```bash
# Pull latest
docker pull jaylaelove/vms-thaipbs-app:latest

# Pull specific version
docker pull jaylaelove/vms-thaipbs-app:v1.0.0
```

## 🎯 Common Workflows

### Deploy New Version
```bash
# 1. Pull latest code
git pull

# 2. Backup database
make backup

# 3. Rebuild and deploy
make prod-build

# 4. Check health
make health

# 5. Monitor logs
make prod-logs
```

### Rollback
```bash
# 1. Stop current
make prod-down

# 2. Restore database
make restore

# 3. Deploy previous version
docker-compose -f docker-compose-prod.yml up -d

# 4. Verify
make health
```

### Database Maintenance
```bash
# 1. Backup
make backup

# 2. Run migrations
make migrate

# 3. Verify
docker exec -it vms-thaipbs-prod npx prisma studio
```
