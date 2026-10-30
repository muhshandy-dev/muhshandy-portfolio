# Portfolio Studio V4 — Carousel Otomatis + Data Contoh

## Apa yang baru?

- Bagian Proyek (4 kartu desktop, 1 HP), Sertifikat (6 desktop, 2 HP), Pengalaman dan Kegiatan memakai **carousel horizontal** secara default. Ini bisa diganti ke grid atau pagination manual dari admin.
- Otomatis berpindah **satu kartu per 6 detik** dari kanan ke kiri. Di ujung akan kembali ke awal.
- Autoplay **berhenti saat hover mouse, fokus keyboard, atau jari menyentuh**, dan saat bagian carousel keluar dari viewport/tab browser tidak aktif. `prefers-reduced-motion` mematikan autoplay.
- Panah kiri/kanan, tombol pause/play dan **Lihat Semua** tetap disediakan supaya HR mudah menelusuri kartu tanpa menunggu.
- Navigasi `Jelajahi` membuka daftar section dan bisa lompat dengan smooth scroll (kecuali perangkat meminta reduced motion).
- Kolom desktop/tablet/HP, mode dan jeda autoplay bisa dikustom per bagian.
- Menambahkan data contoh pada koleksi **yang masih kosong**, tanpa mengganti data user. Item demo diberi badge DATA CONTOH / SAMPLE DATA. Proyek dari roadmap tetap dibiarkan sebagai rencana, bukan hasil selesai.

## Cara memasang

1. Unduh `portfolio-saya-update-v4.tar.gz` ke folder Downloads.
2. Hentikan server (`Ctrl+C`) di Terminal.
3. Jalankan:

```bash
cd ~/Projects
tar -czf "portfolio-backup-$(date +%Y%m%d-%H%M%S).tar.gz" --exclude=node_modules --exclude=.next --exclude=.git portfolio-saya
tar -xzf ~/Downloads/portfolio-saya-update-v4.tar.gz
cd portfolio-saya
bash scripts/install-v4.sh
pnpm dev
```

> File `src/data/site.json` **tidak ada dalam paket update**. Skrip membuat backup kedua sebelum migrasi. Jika terminal dev sudah otomatis restart saat update, tetap disarankan menghentikan lalu menjalankan ulang.

### Di halaman admin

- `Tampilan & urutan` → pilih mode `Geser otomatis (carousel)` / `Tampilkan semua (grid)` / `Pagination manual`.
- `Jeda tiap geser` mengatur autoplay 3–20 detik.
- `Kolom HP`, `Kolom Tablet`, `Kolom Desktop` dapat dipilih sendiri.
- `Profil & pengaturan` untuk favicon dan ID/EN.
- Data contoh aman dihapus/diganti di admin; hapus atau ubah semua contoh sebelum portofolio dikirim ke HR.

## Keamanan dan deployment

`/admin` dan endpoint edit/upload hanya tersedia untuk server **development lokal** di localhost. Ini sengaja tanpa login untuk kenyamanan pengembangan. **Jangan expose dev server ke internet.** Login aman diperlukan sebelum ada admin online publik; untuk sekarang production build tidak menyediakan halaman editor.

## Pemeriksaan

`node scripts/verify-v4.mjs` memeriksa jumlah dan keunikan section, mode, serta struktur data. Build Next.js penuh tetap harus diuji lewat `pnpm build` pada laptop dengan dependency terpasang.
