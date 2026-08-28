#!/usr/bin/env bash
set -euo pipefail
[ -f .env ] || cp .env.example .env
[ -f apps/mobile/.env ] || cp apps/mobile/.env.example apps/mobile/.env
npm install
npm run prisma:generate
echo "Dependencies installed. Start Docker, then run: npm run prisma:migrate"
