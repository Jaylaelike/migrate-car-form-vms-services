# VMS - Vehicle Management System

A Next.js application for managing vehicles, trips, and fuel logs with SQLite database.

## Features

- Vehicle registration and management
- Trip tracking with odometer readings
- Fuel log management
- User authentication with NextAuth
- Admin dashboard with analytics
- SQLite database for easy deployment

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Setup database
npx prisma generate
npx prisma migrate deploy

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
# Using docker-compose
docker-compose up -d

# Or using Makefile
make dev
```

## Production Deployment

### Using Docker (Recommended)

#### 1. Build and Push to Docker Hub
```bash
# Login to Docker Hub
make docker-login

# Build and push image
make push

# Or push with version tag
make push-tag
```

#### 2. Deploy on Production Server
```bash
# SSH to server
ssh user@your-server.com

# Run deployment script
cd /opt/vms-app
./deploy.sh
```

See [DOCKER_HUB_DEPLOYMENT.md](./DOCKER_HUB_DEPLOYMENT.md) for detailed deployment guide.

### Using Makefile Commands

```bash
make help          # Show all available commands
make push          # Build and push to Docker Hub
make prod          # Start production locally
make prod-logs     # View logs
make backup        # Backup database
make health        # Check health
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

## Database

This application uses SQLite with Prisma ORM:
- Database file: `prisma/dev.db`
- Persisted via Docker volumes
- Automatic migrations on container start
- See [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) for details

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/             # Utilities and database
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── dev.db          # SQLite database
│   └── migrations/     # Database migrations
├── docker-compose.yml           # Development
├── docker-compose-prod.yml      # Production
└── Dockerfile                   # Multi-stage build
```

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth v5
- **UI**: Tailwind CSS + Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: ApexCharts

## Environment Variables

Required variables (see `.env.production.example`):

```env
DATABASE_URL=file:/app/prisma/dev.db
AUTH_SECRET=your_secret_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-domain.com
```

Generate secrets:
```bash
openssl rand -base64 32
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database management
- [CONTEXT.md](./CONTEXT.md) - Project context

## Health Check

```bash
curl http://localhost:3000/api/health
```

## Backup & Restore

```bash
# Backup
make backup

# Restore
make restore

# Manual backup
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

## Support

For issues or questions, check:
1. Application logs: `make prod-logs`
2. Health status: `make health`
3. Database integrity: `sqlite3 prisma/dev.db "PRAGMA integrity_check;"`
# migrate-car-form-vms-services
