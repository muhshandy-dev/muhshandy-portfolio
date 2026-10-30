#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f src/data/site.json ]]; then echo '❌ Tidak menemukan src/data/site.json'; exit 1; fi
grep -qxF '/.portfolio-backups/' .gitignore 2>/dev/null || printf '\n/.portfolio-backups/\n' >> .gitignore
node scripts/migrate-v4.mjs
# Prevent default Next.js favicon convention from overriding admin-selected favicon.
rm -f src/app/favicon.ico
printf '\n✅ Portfolio Studio V4 siap. Ketik pnpm dev jika server belum berjalan.\nWebsite: http://localhost:3000\nAdmin:   http://localhost:3000/admin\n\n'
