# Multi-stage Dockerfile for MStudio Web on NAS / Coolify (Cloudflare D1 Backend)
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -------------------------------------------------------------
# 1. Dependency installation & Build (Single App build, không overload CPU NAS)
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ gcc libc6-dev libc++1 ca-certificates && rm -rf /var/lib/apt/lists/*

# Chỉ copy apps/web và packages liên quan, loại bỏ apps/studio để giảm 60% tải build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web ./apps/web
COPY workers/ ./workers/

RUN pnpm install --frozen-lockfile --workspace-concurrency=1
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN pnpm --filter web build --workspace-concurrency=1

# -------------------------------------------------------------
# 2. Production Runner (Glibc / Debian Slim siêu ổn định cho workerd)
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN apt-get update && apt-get install -y --no-install-recommends wget bash libc++1 ca-certificates && rm -rf /var/lib/apt/lists/*

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
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
