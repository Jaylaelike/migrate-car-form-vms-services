# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Generate secure `AUTH_SECRET` (min 32 chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Generate secure `NEXTAUTH_SECRET` (min 32 chars)
- [ ] Set correct `NEXTAUTH_URL` (your production domain)
- [ ] Verify `DATABASE_URL=file:/app/prisma/dev.db`

### 2. Database Preparation
- [ ] Verify `prisma/dev.db` exists and has data
- [ ] Create initial backup
  ```bash
  make backup
  # or
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
  ```
- [ ] Check database integrity
  ```bash
  sqlite3 prisma/dev.db "PRAGMA integrity_check;"
  ```
- [ ] Verify migrations are up to date
  ```bash
  npx prisma migrate status
  ```

### 3. File Permissions
- [ ] Ensure `prisma/` directory is writable
  ```bash
  chmod 755 prisma/
  chmod 644 prisma/dev.db
  ```
- [ ] Ensure `public/uploads/` exists and is writable
  ```bash
  mkdir -p public/uploads
  chmod 755 public/uploads/
  ```

### 4. Docker Setup
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Sufficient disk space (min 2GB free)
- [ ] Port 3000 is available
  ```bash
  lsof -i :3000
  ```

### 5. Code Preparation
- [ ] Latest code pulled from repository
- [ ] All dependencies installed locally (for testing)
  ```bash
  pnpm install
  ```
- [ ] Build succeeds locally
  ```bash
  pnpm build
  ```

## Deployment

### 1. Build and Start
```bash
# Option 1: Using Makefile
make prod-build

# Option 2: Using docker-compose
docker-compose -f docker-compose-prod.yml up -d --build
```

### 2. Verify Deployment
- [ ] Container is running
  ```bash
  docker ps | grep vms-thaipbs-prod
  ```
- [ ] Health check passes
  ```bash
  make health
  # or
  curl http://localhost:3000/api/health
  ```
- [ ] Application accessible at http://localhost:3000
- [ ] Can login with existing credentials
- [ ] Database data is visible

### 3. Monitor Logs
```bash
# Follow logs for 2-3 minutes
make prod-logs
# or
docker-compose -f docker-compose-prod.yml logs -f
```

Look for:
- [ ] No error messages
- [ ] Migrations completed successfully
- [ ] Server started on port 3000
- [ ] No database connection errors

## Post-Deployment

### 1. Functional Testing
- [ ] Login works
- [ ] Can view vehicles list
- [ ] Can view trips list
- [ ] Can create new trip
- [ ] Can add fuel log
- [ ] Admin dashboard accessible (if admin user)
- [ ] File uploads work

### 2. Performance Check
- [ ] Page load times acceptable (<2s)
- [ ] No console errors in browser
- [ ] Database queries fast (<100ms)
  ```bash
  make stats
  ```

### 3. Security Verification
- [ ] Environment variables not exposed in logs
- [ ] Database file not publicly accessible
- [ ] HTTPS configured (if using reverse proxy)
- [ ] Strong secrets in use (not defaults)

### 4. Backup Verification
- [ ] Automatic backup created
- [ ] Backup file readable
  ```bash
  ls -lh backups/
  sqlite3 backups/dev.db.backup.* "SELECT COUNT(*) FROM Vehicle;"
  ```

### 5. Monitoring Setup
- [ ] Health check endpoint working
  ```bash
  curl http://localhost:3000/api/health
  ```
- [ ] Container health status healthy
  ```bash
  docker inspect --format='{{.State.Health.Status}}' vms-thaipbs-prod
  ```
- [ ] Log rotation configured (check docker-compose-prod.yml)

## Ongoing Maintenance

### Daily
- [ ] Check application health
  ```bash
  make health
  ```
- [ ] Monitor disk space
  ```bash
  df -h
  ```

### Weekly
- [ ] Review logs for errors
  ```bash
  make prod-logs | grep -i error
  ```
- [ ] Check container stats
  ```bash
  make stats
  ```
- [ ] Backup database
  ```bash
  make backup
  ```

### Monthly
- [ ] Update dependencies (if needed)
- [ ] Review and clean old backups
- [ ] Check database size and optimize
  ```bash
  sqlite3 prisma/dev.db "VACUUM;"
  ```

## Rollback Plan

If deployment fails:

### 1. Stop Current Deployment
```bash
make prod-down
```

### 2. Restore Database
```bash
make restore
# Select the backup file from before deployment
```

### 3. Deploy Previous Version
```bash
# If using git tags
git checkout v1.0.0
make prod-build
```

### 4. Verify Rollback
```bash
make health
make prod-logs
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs vms-thaipbs-prod

# Common issues:
# - Port 3000 in use: lsof -i :3000
# - Database locked: rm prisma/dev.db-journal
# - Permissions: sudo chown -R 1001:1001 prisma/
```

### Database Issues
```bash
# Check database file
ls -la prisma/dev.db

# Check integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Check migrations
docker exec -it vms-thaipbs-prod npx prisma migrate status
```

### Health Check Fails
```bash
# Check if server is running
docker exec -it vms-thaipbs-prod ps aux

# Check database connection
docker exec -it vms-thaipbs-prod npx prisma db pull

# Check logs
make prod-logs
```

## Emergency Contacts

- **Database Issues**: Check DATABASE_GUIDE.md
- **Docker Issues**: Check DOCKER_QUICK_REFERENCE.md
- **Deployment Issues**: Check DEPLOYMENT.md

## Success Criteria

Deployment is successful when:
- ✅ Container running and healthy
- ✅ Health endpoint returns 200 OK
- ✅ Application accessible via browser
- ✅ Users can login
- ✅ Database data visible
- ✅ No errors in logs
- ✅ Backup created and verified

## Notes

- Database file: `prisma/dev.db` (persisted via volume)
- Uploads directory: `public/uploads/` (persisted via volume)
- Container name: `vms-thaipbs-prod`
- Image: `jaylaelove/vms-thaipbs-app:latest`
- Port: 3000
- User: nextjs (UID 1001)
