#!/bin/sh
set -e

echo "========================================================"
echo "  MSTUDIO CHANNEL — NAS / COOLIFY RUNTIME ENGINE        "
echo "  Backend: Cloudflare D1 via Edge API Gateway           "
echo "========================================================"

echo "[MStudio Engine] Edge API Gateway: ${MSTUDIO_API_URL:-https://mstudio-api.vn002187444.workers.dev}"
echo "[MStudio Engine] Host: ${HOSTNAME:-0.0.0.0} | Port: ${PORT:-3000}"
echo "[MStudio Engine] Hardware Profile: Max 1.5 Core CPU | 1.5GB RAM"

# Chạy server qua exec để nhận tín hiệu SIGTERM an toàn
exec "$@"
