# ============================================
# TeacherMon Web - Production Dockerfile
# Multi-stage build for Next.js Frontend
# ============================================

# --- Stage 1: Base ---
FROM node:20-bookworm-slim AS base
RUN apt-get update -qq && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --- Stage 2: Install dependencies ---
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# --- Stage 3: Build ---
FROM base AS build

# Build-time env (will be baked into the client bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Build shared package
RUN pnpm --filter @teachermon/shared build

# Build Next.js
RUN pnpm --filter @teachermon/web build

# --- Stage 4: Production ---
FROM node:20-bookworm-slim AS production

RUN apt-get update -qq && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output (if using standalone mode)
# Otherwise copy full build
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.js ./apps/web/
COPY --from=build /app/apps/web/package.json ./apps/web/

# Copy shared package
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY packages/shared/package.json ./packages/shared/

# Copy workspace root
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Install production deps
RUN corepack enable && corepack prepare pnpm@9 --activate \
    && pnpm install --frozen-lockfile --prod

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

USER node
EXPOSE 3000

CMD ["npx", "--yes", "next", "start", "-p", "3000", "--dir", "apps/web"]
