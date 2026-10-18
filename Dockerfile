# Multi-stage Dockerfile for MStudio Web on NAS / Coolify (Cloudflare D1 Backend)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -------------------------------------------------------------
# 1. Dependency installation & Build
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ gcc libc-dev

# Copy đầy đủ packages theo pnpm-workspace.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY workers/ ./workers/

RUN pnpm install --frozen-lockfile
RUN pnpm -r build

# -------------------------------------------------------------
# 2. Production Runner (Siêu nhẹ, bảo vệ CPU & RAM NAS)
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime: wget cho healthcheck, bash cho startup script
RUN apk add --no-cache wget bash

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

WORKDIR /app/apps/web

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npx", "vinext", "start", "--port", "3000", "--hostname", "0.0.0.0"]
