#!/bin/sh
set -e

echo "========================================================"
echo "  MSTUDIO CHANNEL — NAS / COOLIFY RUNTIME ENGINE        "
echo "========================================================"

# 1. Cấp quyền thư mục /data cho SQLite WAL mode
mkdir -p /data
chmod 777 /data 2>/dev/null || true

# 2. Kiểm tra trạng thái cơ sở dữ liệu SQLite
if [ -f "/data/mstudio.db" ]; then
  echo "[MStudio Engine] Database found: /data/mstudio.db"
else
  echo "[MStudio Engine] Notice: /data/mstudio.db not detected yet."
  echo "[MStudio Engine] Initializing database from dump if available..."
  if [ -f "/data/mstudio_dev_dump.sql" ]; then
    echo "[MStudio Engine] Importing /data/mstudio_dev_dump.sql into /data/mstudio.db..."
    sqlite3 /data/mstudio.db < /data/mstudio_dev_dump.sql
    echo "[MStudio Engine] Enabling WAL mode..."
    sqlite3 /data/mstudio.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=-64000;"
    echo "[MStudio Engine] Database initialized successfully!"
  else
    echo "[MStudio Engine] System is running in initial mode."
    echo "[MStudio Engine] Import 'mstudio_dev_dump.sql' as per NAS_DEPLOYMENT_RUNBOOK.md."
  fi
fi

# 3. Chạy lệnh ứng dụng qua exec để nhận tín hiệu SIGTERM an toàn (tránh hỏng WAL log khi restart container)
exec "$@"
