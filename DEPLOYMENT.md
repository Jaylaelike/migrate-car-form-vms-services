# Production Deployment Guide

## Overview
This guide covers deploying the VMS application with SQLite database persistence using Docker.

## Prerequisites
- Docker and Docker Compose installed
- Existing `prisma/dev.db` database file
- Production environment variables configured

## Quick Start

### 1. Prepare Environment Variables
```bash
# Copy the example file
cp .env.production.example .env.production

# Generate secure secrets
openssl rand -base64 32

# Edit .env.production with your values
```

### 2. Build and Deploy
```bash
# Production deployment
docker-compose -f docker-compose-prod.yml up -d --build

# Check logs
docker-compose -f docker-compose-prod.yml logs -f

# Check health
curl http://localhost:3000/api/health
```

## Database Persistence

### How It Works
- SQLite database is stored in `./prisma/dev.db` on the host
- Volume mount: `./prisma:/app/prisma:rw` ensures persistence
- Database survives container restarts and rebuilds
- Migrations run automatically on container start

### Backup Database
```bash
# Create backup
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Or use SQLite backup
sqlite3 prisma/dev.db ".backup prisma/dev.db.backup"
```

### Restore Database
```bash
# Stop container
docker-compose -f docker-compose-prod.yml down

# Restore backup
cp prisma/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db

# Start container
docker-compose -f docker-compose-prod.yml up -d
```

## File Uploads Persistence
- Uploads stored in `./public/uploads` on host
- Volume mount: `./public/uploads:/app/public/uploads:rw`
- Files persist across container restarts

## Docker Commands

### Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production
```bash
# Build and start
docker-compose -f docker-compose-prod.yml up -d --build

# View logs
docker-compose -f docker-compose-prod.yml logs -f web

# Restart
docker-compose -f docker-compose-prod.yml restart

# Stop
docker-compose -f docker-compose-prod.yml down

# Rebuild without cache
docker-compose -f docker-compose-prod.yml build --no-cache
```

### Maintenance
```bash
# Execute commands in container
docker exec -it vms-thaipbs-prod sh

# Check database
docker exec -it vms-thaipbs-prod npx prisma studio

# Run migrations manually
docker exec -it vms-thaipbs-prod npx prisma migrate deploy

# View container stats
docker stats vms-thaipbs-prod
```

## Optimization Features

### Dockerfile
- **Multi-stage build**: Reduces final image size by ~60%
- **Layer caching**: Faster rebuilds with optimized layer order
- **Security**: Non-root user (nextjs:nodejs)
- **Health checks**: Automatic container health monitoring
- **Binary targets**: Correct Prisma binaries for Alpine Linux

### Docker Compose Production
- **Resource limits**: CPU and memory constraints
- **Log rotation**: Prevents disk space issues
- **Health checks**: Automatic restart on failure
- **Restart policy**: Always restart on failure
- **Environment variables**: Secure configuration management

## Monitoring

### Health Check
```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-25T...",
  "database": "connected"
}
```

### Container Health
```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' vms-thaipbs-prod

# View health check logs
docker inspect --format='{{json .State.Health}}' vms-thaipbs-prod | jq
```

### Logs
```bash
# Follow logs
docker-compose -f docker-compose-prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose-prod.yml logs --tail=100

# Specific service
docker-compose -f docker-compose-prod.yml logs -f web
```

## Troubleshooting

### Database Issues
```bash
# Check database file permissions
ls -la prisma/dev.db

# Should be writable by container user (UID 1001)
# If not, fix permissions:
sudo chown 1001:1001 prisma/dev.db
```

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose-prod.yml logs

# Check if port is in use
lsof -i :3000

# Remove and recreate
docker-compose -f docker-compose-prod.yml down -v
docker-compose -f docker-compose-prod.yml up -d
```

### Migration Failures
```bash
# Run migrations manually
docker exec -it vms-thaipbs-prod npx prisma migrate deploy

# Reset database (CAUTION: destroys data)
docker exec -it vms-thaipbs-prod npx prisma migrate reset --force
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.production` to git
2. **Secrets**: Use strong, randomly generated secrets (min 32 chars)
3. **File Permissions**: Ensure database and uploads have correct permissions
4. **Network**: Use reverse proxy (nginx/traefik) with SSL in production
5. **Backups**: Regular automated backups of database and uploads

## Performance Tips

1. **Database**: SQLite is fast for small-medium workloads (<100k records)
2. **Caching**: Consider adding Redis for session/cache if needed
3. **CDN**: Serve static assets via CDN for better performance
4. **Monitoring**: Use tools like Prometheus/Grafana for metrics

## Scaling Considerations

SQLite limitations:
- Single writer at a time
- Not suitable for high-concurrency writes
- File-based, not distributed

For high-traffic production:
- Consider PostgreSQL or MySQL
- Use managed database service
- Implement connection pooling

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose-prod.yml logs`
2. Verify health: `curl http://localhost:3000/api/health`
3. Check database: `sqlite3 prisma/dev.db "PRAGMA integrity_check;"`
