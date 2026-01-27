# Complete Production Setup Guide

## Current Issue Fix

Your environment variables are not being loaded. Here's the immediate fix:

### Option 1: Restart with env file (Quick Fix)
```bash
# Stop current container
sudo docker-compose -f docker-compose-prod.yml down

# Start with env file explicitly
sudo docker-compose --env-file .env.production -f docker-compose-prod.yml up -d

# Check logs
sudo docker-compose -f docker-compose-prod.yml logs -f
```

### Option 2: Update docker-compose-prod.yml (Permanent Fix)

The `docker-compose-prod.yml` has been updated to include `env_file: - .env.production`.

Copy the updated file to your server and restart:

```bash
# Copy updated docker-compose-prod.yml to server
# Then restart:
sudo docker-compose -f docker-compose-prod.yml down
sudo docker-compose -f docker-compose-prod.yml up -d
```

### Option 3: Use the startup script

```bash
# Copy start-production.sh to server
chmod +x start-production.sh
./start-production.sh
```

## Verify Environment Variables

After starting, verify the variables are loaded:

```bash
# Check environment variables in container
sudo docker exec vms-thaipbs-prod env | grep -E "AUTH_SECRET|NEXTAUTH"

# Should show:
# AUTH_SECRET=your_secret_here
# NEXTAUTH_SECRET=your_secret_here
# NEXTAUTH_URL=https://your-domain.com
# AUTH_TRUST_HOST=true
```

## Fix Database Permissions

```bash
# Fix ownership (UID 1001 = nextjs user in container)
sudo chown -R 1001:1001 prisma/
sudo chmod 755 prisma/
sudo chmod 644 prisma/dev.db

# Restart container
sudo docker-compose -f docker-compose-prod.yml restart
```

## Complete Production Setup Steps

### 1. Prepare Server

```bash
# Create application directory
sudo mkdir -p /opt/vms-app
cd /opt/vms-app

# Create required directories
mkdir -p prisma public/uploads backups
```

### 2. Copy Files to Server

From your local machine:

```bash
# Copy docker-compose file
scp docker-compose-prod.yml user@server:/opt/vms-app/

# Copy startup script
scp start-production.sh user@server:/opt/vms-app/

# Copy database (if migrating)
scp prisma/dev.db user@server:/opt/vms-app/prisma/
```

### 3. Create .env.production

On the server:

```bash
cd /opt/vms-app
nano .env.production
```

Content:
```env
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=your_secure_secret_min_32_chars
NEXTAUTH_SECRET=your_secure_secret_min_32_chars
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com
```

Generate secrets:
```bash
openssl rand -base64 32
```

### 4. Fix Permissions

```bash
sudo chown -R 1001:1001 prisma/
sudo chmod 755 prisma/
sudo chmod 644 prisma/dev.db
```

### 5. Start Application

```bash
# Make script executable
chmod +x start-production.sh

# Run startup script
./start-production.sh
```

Or manually:
```bash
sudo docker-compose -f docker-compose-prod.yml up -d
```

### 6. Verify Deployment

```bash
# Check container is running
sudo docker ps | grep vms-thaipbs

# Check logs
sudo docker-compose -f docker-compose-prod.yml logs --tail=50

# Check health
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"...","database":"connected"}
```

### 7. Test Application

```bash
# Test locally
curl http://localhost:3000

# If using nginx/reverse proxy
curl https://your-domain.com
```

## Common Commands

```bash
# Start
sudo docker-compose -f docker-compose-prod.yml up -d

# Stop
sudo docker-compose -f docker-compose-prod.yml down

# Restart
sudo docker-compose -f docker-compose-prod.yml restart

# View logs
sudo docker-compose -f docker-compose-prod.yml logs -f

# View last 100 lines
sudo docker-compose -f docker-compose-prod.yml logs --tail=100

# Check status
sudo docker ps | grep vms-thaipbs

# Check health
curl http://localhost:3000/api/health

# Shell access
sudo docker exec -it vms-thaipbs-prod sh

# Check environment variables
sudo docker exec vms-thaipbs-prod env | grep AUTH
```

## Backup & Restore

### Backup
```bash
# Create backup
cp prisma/dev.db backups/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# List backups
ls -lh backups/
```

### Restore
```bash
# Stop container
sudo docker-compose -f docker-compose-prod.yml down

# Restore backup
cp backups/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db

# Fix permissions
sudo chown 1001:1001 prisma/dev.db
sudo chmod 644 prisma/dev.db

# Start container
sudo docker-compose -f docker-compose-prod.yml up -d
```

## Update Application

### Pull New Image
```bash
# Stop container
sudo docker-compose -f docker-compose-prod.yml down

# Backup database
cp prisma/dev.db backups/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest image
sudo docker-compose -f docker-compose-prod.yml pull

# Start container
sudo docker-compose -f docker-compose-prod.yml up -d

# Check logs
sudo docker-compose -f docker-compose-prod.yml logs -f
```

## Troubleshooting

### Issue: AUTH_SECRET not set

**Check .env.production:**
```bash
cat .env.production | grep AUTH_SECRET
```

**Verify it's loaded in container:**
```bash
sudo docker exec vms-thaipbs-prod env | grep AUTH_SECRET
```

**If not loaded, restart with env file:**
```bash
sudo docker-compose -f docker-compose-prod.yml down
sudo docker-compose --env-file .env.production -f docker-compose-prod.yml up -d
```

### Issue: Database permission error

**Fix permissions:**
```bash
sudo chown -R 1001:1001 prisma/
sudo chmod 755 prisma/
sudo chmod 644 prisma/dev.db
sudo docker-compose -f docker-compose-prod.yml restart
```

### Issue: Container keeps restarting

**Check logs:**
```bash
sudo docker logs vms-thaipbs-prod --tail=100
```

**Check if port is in use:**
```bash
sudo lsof -i :3000
```

**Rebuild if needed:**
```bash
sudo docker-compose -f docker-compose-prod.yml down
sudo docker-compose -f docker-compose-prod.yml build --no-cache
sudo docker-compose -f docker-compose-prod.yml up -d
```

## Monitoring

### Setup Log Monitoring
```bash
# Follow logs in real-time
sudo docker-compose -f docker-compose-prod.yml logs -f

# Check for errors
sudo docker-compose -f docker-compose-prod.yml logs | grep -i error

# Check last hour
sudo docker-compose -f docker-compose-prod.yml logs --since 1h
```

### Setup Health Check Cron
```bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * curl -f http://localhost:3000/api/health || echo "VMS health check failed" | mail -s "Alert" admin@example.com
```

## Security Checklist

- [ ] `.env.production` has strong secrets (min 32 chars)
- [ ] `.env.production` is not in git
- [ ] Database file has correct permissions (644, owned by 1001:1001)
- [ ] Firewall configured (only allow 80, 443, 22)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Regular backups configured
- [ ] Log rotation configured
- [ ] Monitoring setup

## Performance Optimization

### Increase Memory Limit
Edit `docker-compose-prod.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

### Enable Log Rotation
Already configured in `docker-compose-prod.yml`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Next Steps

1. ✅ Fix environment variables (use updated docker-compose-prod.yml)
2. ✅ Fix database permissions
3. ✅ Verify application is running
4. ⬜ Setup reverse proxy (nginx)
5. ⬜ Install SSL certificate
6. ⬜ Configure automated backups
7. ⬜ Setup monitoring

## Support

For more help, see:
- [PRODUCTION_TROUBLESHOOTING.md](./PRODUCTION_TROUBLESHOOTING.md)
- [DOCKER_HUB_DEPLOYMENT.md](./DOCKER_HUB_DEPLOYMENT.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
