# Menjalankan Portfolio Studio V5

## Prasyarat
- **Node.js 22 LTS** (minimal 22.6, dibutuhkan oleh `pnpm test`/`verify`; Next.js 16 sendiri butuh ≥ 20.9)
- pnpm (`npm install -g pnpm`)
- Browser modern

## Linux Mint / Ubuntu — instal baru

```bash
# Node 22 lewat nvm (bila belum ada)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
npm install -g pnpm

# Proyek
cd ~/Projects
unzip ~/Downloads/portfolio-saya-v5.zip
cd portfolio-saya
pnpm install
pnpm dev
```

Buka `http://localhost:3000` (website) dan `http://localhost:3000/admin` (admin). `Ctrl+C` untuk berhenti.

## Upgrade dari V4 (data lama tetap aman)

Pakai **folder baru**, jangan menimpa folder V4 (beberapa file V4 dipindah/diganti nama; file lama yang tertinggal bisa bentrok).

```bash
cd ~/Projects
# 1. Cadangkan folder lama
tar -czf "portfolio-v4-backup-$(date +%Y%m%d-%H%M%S).tar.gz" --exclude=node_modules --exclude=.next portfolio-saya
mv portfolio-saya portfolio-saya-v4

# 2. Ekstrak V5
unzip ~/Downloads/portfolio-saya-v5.zip       # menghasilkan folder portfolio-saya

# 3. Bawa data dan unggahanmu
cp portfolio-saya-v4/src/data/site.json portfolio-saya/src/data/site.json
cp -r portfolio-saya-v4/public/uploads portfolio-saya/public/ 2>/dev/null || true
cp -r portfolio-saya-v4/.portfolio-backups portfolio-saya/ 2>/dev/null || true
# Bila folder V4 adalah repo git, pindahkan juga riwayatnya:
[ -d portfolio-saya-v4/.git ] && cp -r portfolio-saya-v4/.git portfolio-saya/

# 4. Jalankan
cd portfolio-saya
pnpm install
pnpm verify        # cek site.json lama terbaca
pnpm dev
```

`site.json` versi lama langsung terbaca tanpa migrasi (field baru otomatis diberi nilai bawaan, field lama tidak dibuang). `pnpm migrate` opsional: menulis field baru ke file supaya terlihat, dengan cadangan di `.portfolio-backups/`.

Catatan: `site.json` di paket V5 sudah berisi terjemahan EN untuk judul section, deskripsi profil, dan teks kontak. Bila kamu menyalin `site.json` lamamu, isi terjemahan itu lewat admin (bagian *Section & layout*, *Profil & CV*, *Teks sapaan & kontak*).

## Windows (PowerShell)

```powershell
npm install -g pnpm
pnpm install
pnpm dev
```

## Catatan
- `node_modules`, `.next`, `out`, dan `.portfolio-backups` tidak disertakan dan tidak di-commit.
- File unggahan ada di `public/uploads/`; ikut commit bila ingin dipublikasikan.
