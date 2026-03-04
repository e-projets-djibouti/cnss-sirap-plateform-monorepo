#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "==> Backup PostgreSQL..."
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-sirap}" \
  "${POSTGRES_DB:-sirap}" \
  > "$BACKUP_DIR/postgres_$TIMESTAMP.sql"

echo "==> Backup saved to $BACKUP_DIR/postgres_$TIMESTAMP.sql"
