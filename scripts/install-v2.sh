#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f src/data/site.json ]]; then
  echo "File src/data/site.json tidak ditemukan. Pastikan instalasi Admin V1 sudah ada." >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm tidak ditemukan. Jalankan: npm install -g pnpm" >&2
  exit 1
fi
node scripts/migrate-v2.mjs
printf '\n✅ Portfolio Studio V2 siap dijalankan.\n'
printf 'Website: http://localhost:3000\nAdmin:   http://localhost:3000/admin\n'
printf 'Tekan Ctrl+C untuk menghentikan server.\n\n'
pnpm dev
