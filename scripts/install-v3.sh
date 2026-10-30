#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f src/data/site.json ]]; then
  echo "❌ Data V2 tidak ditemukan. Instal update ini di folder portfolio-saya yang sudah dipakai." >&2
  exit 1
fi
node scripts/migrate-v3.mjs
# Next.js file-convention favicon overrides metadata-based custom favicon.
# This original generic file is intentionally removed for the admin favicon setting.
rm -f src/app/favicon.ico
node scripts/verify-v3.mjs
printf '\n✅ Portfolio Studio V3 terpasang.\nWebsite: http://localhost:3000\nAdmin:   http://localhost:3000/admin\n\n'
if ! command -v pnpm >/dev/null 2>&1; then echo "pnpm tidak ditemukan. Instal pnpm dulu." >&2; exit 1; fi
pnpm dev
