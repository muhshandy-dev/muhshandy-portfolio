# Menjalankan Portfolio Studio di laptop lain

Paket ini berisi source code lengkap Portfolio Studio V4, termasuk source Next.js, aset, data contoh, konfigurasi, lockfile, dan panduan admin. Folder `node_modules` sengaja tidak disertakan supaya ZIP lebih ringan; dependensi akan diunduh di laptop tujuan.

## Prasyarat

- Node.js versi LTS terbaru (disarankan Node.js 22 atau lebih baru)
- pnpm
- Browser modern

## Linux Mint / Ubuntu

1. Ekstrak ZIP.
2. Buka Terminal di folder `portfolio-saya`.
3. Jalankan:

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

4. Buka `http://localhost:3000` untuk melihat portofolio.
5. Buka `http://localhost:3000/admin` untuk mengedit konten.

Biarkan terminal tetap berjalan saat menggunakan website. Tekan `Ctrl+C` untuk menghentikan server.

## Windows

1. Instal Node.js LTS dari situs resmi Node.js.
2. Buka PowerShell di folder `portfolio-saya`.
3. Jalankan:

```powershell
npm install -g pnpm
pnpm install
pnpm dev
```

4. Buka `http://localhost:3000` dan `http://localhost:3000/admin`.

## Catatan penting

- `src/data/site.json` menyimpan data konten awal/demo.
- File yang diunggah melalui admin lokal dapat tersimpan di folder proyek; setelah memindahkan proyek ke laptop lain, pindahkan juga file unggahan yang dirujuk data jika ada.
- `node_modules` tidak disertakan; jalankan `pnpm install` di laptop tujuan.
- Admin ini adalah editor lokal. API penulisan dan upload hanya diaktifkan saat development di localhost; belum merupakan admin online multi-user.
- Untuk publikasi, baca `PANDUAN-ADMIN-V4.md` dan README utama.
