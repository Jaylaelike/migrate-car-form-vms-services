# Production Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: MissingSecret Error

**Error:**
```
[auth][error] MissingSecret: Please define a `secret`
```

**Cause:** NextAuth can't find AUTH_SECRET or NEXTAUTH_SECRET environment variable.

**Solutions:**

#### Solution A: Check .env.production file exists
```bash
# On production server
cd /opt/vms-app
ls -la .env.production

# If missing, create it
nano .env.production
```

Content:
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

#### Solution B: Pass environment variables directly
```bash
# Stop container
docker-compose -f docker-compose-prod.yml down

# Start with explicit env vars
AUTH_SECRET="your_secret_here" \
NEXTAUTH_SECRET="your_secret_here" \
NEXTAUTH_URL="https://your-domain.com" \
docker-compose -f docker-compose-prod.yml up -d
```

#### Solution C: Use env_file in docker-compose
Update `docker-compose-prod.yml`:
```yaml
services:
  web:
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/prisma/dev.db
```

#### Solution D: Check environment variables are loaded
```bash
# Check if env vars are set in container
docker exec vms-thaipbs-prod env | grep AUTH

# Should show:
# AUTH_SECRET=...
# NEXTAUTH_SECRET=...
```

---

### Issue 2: Database Permission Error

**Error:**
```
Error code 14: Unable to open the database file
```

**Cause:** Container user (UID 1001) doesn't have permission to access database file.

**Solutions:**

#### Solution A: Fix file permissions
```bash
# On production server
cd /opt/vms-app

# Check current permissions
ls -la prisma/dev.db

# Fix ownership (UID 1001 = nextjs user in container)
sudo chown 1001:1001 prisma/dev.db
sudo chmod 644 prisma/dev.db

# Fix directory permissions
sudo chown 1001:1001 prisma/
sudo chmod 755 prisma/

# Restart container
docker-compose -f docker-compose-prod.yml restart
```

#### Solution B: Create database with correct permissions
```bash
# If database doesn't exist yet
cd /opt/vms-app
mkdir -p prisma
touch prisma/dev.db
sudo chown 1001:1001 prisma/dev.db
sudo chmod 644 prisma/dev.db

# Run migrations to create schema
docker exec vms-thaipbs-prod sh -c "cd /app && npx prisma migrate deploy"
```

#### Solution C: Check SELinux (if applicable)
```bash
# Check if SELinux is enforcing
getenforce

# If enforcing, set context
sudo chcon -R -t container_file_t /opt/vms-app/prisma/

# Or disable SELinux temporarily (not recommended for production)
sudo setenforce 0
```

#### Solution D: Verify volume mount
```bash
# Check if volume is mounted correctly
docker inspect vms-thaipbs-prod | grep -A 10 Mounts

# Should show:
# "Source": "/opt/vms-app/prisma",
# "Destination": "/app/prisma",
# "RW": true
```

---

### Issue 3: Container Keeps Restarting

**Check logs:**
```bash
docker logs vms-thaipbs-prod --tail=100
```

**Common causes:**

#### A. Port already in use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process or change port in docker-compose-prod.yml
# ports:
#   - "3001:3000"
```

#### B. Out of memory
```bash
# Check container stats
docker stats vms-thaipbs-prod

# Increase memory limit in docker-compose-prod.yml
# deploy:
#   resources:
#     limits:
#       memory: 4G
```

#### C. Missing dependencies
```bash
# Rebuild image
docker-compose -f docker-compose-prod.yml build --no-cache
docker-compose -f docker-compose-prod.yml up -d
```

---

### Issue 4: Health Check Failing

**Check health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Solutions:**

#### A. Wait for startup
```bash
# Container needs time to start
sleep 30
curl http://localhost:3000/api/health
```

#### B. Check if server is running
```bash
# Check if process is running in container
docker exec vms-thaipbs-prod ps aux | grep node

# Check if port is listening
docker exec vms-thaipbs-prod netstat -tlnp | grep 3000
```

#### C. Check logs for errors
```bash
docker logs vms-thaipbs-prod | grep -i error
```

---

### Issue 5: Database Not Persisting

**Check volume mount:**
```bash
# Verify volume is mounted
docker inspect vms-thaipbs-prod | grep -A 10 Mounts

# Check if database file exists on host
ls -la /opt/vms-app/prisma/dev.db

# Check if database file exists in container
docker exec vms-thaipbs-prod ls -la /app/prisma/dev.db
```

**Solutions:**

#### A. Recreate with correct volume
```bash
docker-compose -f docker-compose-prod.yml down
docker-compose -f docker-compose-prod.yml up -d
```

#### B. Copy database manually
```bash
# Copy from host to container
docker cp /opt/vms-app/prisma/dev.db vms-thaipbs-prod:/app/prisma/dev.db

# Fix permissions
docker exec vms-thaipbs-prod chown nextjs:nodejs /app/prisma/dev.db
```

---

### Issue 6: Image Pull Fails

**Error:**
```
Error response from daemon: pull access denied
```

**Solutions:**

#### A. Login to Docker Hub
```bash
docker login
# Username: jaylaelove
# Password: [your-token]
```

#### B. Check image exists
```bash
# Search for image
docker search jaylaelove/vms-thaipbs-app

# Try pulling manually
docker pull jaylaelove/vms-thaipbs-app:latest
```

#### C. Build locally if pull fails
```bash
# Build on production server
docker-compose -f docker-compose-prod.yml build
docker-compose -f docker-compose-prod.yml up -d
```

---

## Complete Diagnostic Script

Save as `diagnose.sh`:

```bash
#!/bin/bash

echo "=== VMS Production Diagnostics ==="
echo ""

echo "1. Docker Status:"
docker --version
docker-compose --version
echo ""

echo "2. Container Status:"
docker ps -a | grep vms-thaipbs
echo ""

echo "3. Container Logs (last 20 lines):"
docker logs vms-thaipbs-prod --tail=20
echo ""

echo "4. Environment Variables:"
docker exec vms-thaipbs-prod env | grep -E "NODE_ENV|DATABASE_URL|AUTH_SECRET|NEXTAUTH" || echo "Container not running"
echo ""

echo "5. File Permissions:"
ls -la prisma/dev.db 2>/dev/null || echo "Database file not found"
echo ""

echo "6. Volume Mounts:"
docker inspect vms-thaipbs-prod 2>/dev/null | grep -A 10 Mounts || echo "Container not found"
echo ""

echo "7. Port Status:"
sudo lsof -i :3000 || echo "Port 3000 not in use"
echo ""

echo "8. Health Check:"
curl -f http://localhost:3000/api/health 2>/dev/null && echo "✓ Healthy" || echo "✗ Unhealthy"
echo ""

echo "9. Disk Space:"
df -h /opt/vms-app
echo ""

echo "10. Memory Usage:"
free -h
echo ""
```

Run it:
```bash
chmod +x diagnose.sh
./diagnose.sh
```

---

## Quick Fixes

### Complete Reset (Nuclear Option)

```bash
# Backup database first!
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Stop and remove everything
docker-compose -f docker-compose-prod.yml down -v
docker rmi jaylaelove/vms-thaipbs-app:latest

# Fix permissions
sudo chown -R 1001:1001 prisma/
sudo chmod 755 prisma/
sudo chmod 644 prisma/dev.db

# Recreate .env.production
cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com
EOF

# Pull and start
docker-compose -f docker-compose-prod.yml pull
docker-compose -f docker-compose-prod.yml up -d

# Wait and check
sleep 30
curl http://localhost:3000/api/health
```

---

## Prevention Checklist

Before deploying, ensure:

- [ ] `.env.production` exists with all required variables
- [ ] `AUTH_SECRET` and `NEXTAUTH_SECRET` are set (min 32 chars)
- [ ] `NEXTAUTH_URL` matches your domain
- [ ] Database file exists: `prisma/dev.db`
- [ ] Database permissions: `chown 1001:1001 prisma/dev.db`
- [ ] Directory permissions: `chmod 755 prisma/`
- [ ] Port 3000 is available
- [ ] Docker Hub login successful
- [ ] Image exists: `docker pull jaylaelove/vms-thaipbs-app:latest`
- [ ] Backup created before deployment

---

## Getting Help

If issues persist:

1. **Collect diagnostics:**
   ```bash
   ./diagnose.sh > diagnostics.txt
   ```

2. **Check all logs:**
   ```bash
   docker logs vms-thaipbs-prod > container.log
   ```

3. **Review configuration:**
   ```bash
   cat docker-compose-prod.yml
   cat .env.production  # Remove secrets before sharing!
   ```

4. **Test locally first:**
   ```bash
   # On local machine
   make prod-build
   make health
   ```
