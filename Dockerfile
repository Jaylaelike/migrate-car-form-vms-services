# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install OpenSSL for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN corepack enable pnpm && \
    pnpm i --frozen-lockfile && \
    npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application files
COPY . .

# Build Next.js application (standalone mode)
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create directories with proper permissions
RUN mkdir -p /app/prisma /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Copy standalone output (includes necessary dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy prisma directory for migrations and schema
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy the entire node_modules from builder (includes Prisma Client)
# Standalone mode includes most deps, but we need Prisma CLI for migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start script: just start the server (migrations can be run manually if needed)
CMD ["node", "server.js"]
