#!/usr/bin/env bash
set -euo pipefail

echo "==> Deploying CNSS SIRAP..."

echo "==> Pulling latest changes..."
git pull origin main

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building shared package..."
pnpm build:shared

echo "==> Running database migrations..."
pnpm db:migrate

echo "==> Building & restarting containers..."
docker compose build
docker compose up -d

echo "==> Done."
