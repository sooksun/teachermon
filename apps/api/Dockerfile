# ============================================
# TeacherMon API - Production Dockerfile
# Multi-stage build for NestJS API
# ============================================

# --- Stage 1: Base ---
FROM node:20-bookworm-slim AS base
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    ca-certificates curl openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --- Stage 2: Install dependencies ---
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# --- Stage 3: Build ---
FROM base AS build

# Dummy DATABASE_URL for prisma generate (no actual connection)
ENV DATABASE_URL="mysql://user:pass@localhost:3306/dummy"

COPY --from=dependencies /app ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma client
RUN pnpm --filter @teachermon/database db:generate

# Build shared package
RUN pnpm --filter @teachermon/shared build

# Build API
RUN pnpm --filter @teachermon/api build

# --- Stage 4: Production ---
FROM node:20-bookworm-slim AS production

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    ca-certificates curl openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="mysql://user:pass@localhost:3306/dummy"

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy database package (index.js, prisma schema, etc.)
COPY packages/database ./packages/database
# ติดตั้ง prisma CLI ไว้ใน production image เพื่อให้ deploy script ใช้ migrate ได้โดยไม่ต้องดาวน์โหลดใหม่
RUN pnpm add -w prisma@5.22.0
# Generate prisma client โดยระบุ path ให้ถูกต้อง
RUN cd packages/database && npx prisma@5.22.0 generate

# Copy built shared package
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Copy built API
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads && chown -R node:node /app/apps/api/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

USER node
EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
