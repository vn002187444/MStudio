# Multi-stage Dockerfile for MStudio Web on NAS / Coolify
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Dependency installation & Build
FROM base AS builder
WORKDIR /app

# Install build dependencies for native modules (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc libc-dev

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm install --frozen-lockfile
RUN pnpm -r build

# 2. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies for SQLite
RUN apk add --no-cache wget

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web

RUN mkdir -p /data

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["node", "./dist/server/index.js"]
