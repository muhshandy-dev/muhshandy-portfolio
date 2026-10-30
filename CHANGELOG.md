# Changelog

## V5.0.0 — 2026-10-30

### Diperbaiki (bug dari audit V4)
- **Keamanan admin**: server dev sebelumnya mendengarkan di semua antarmuka jaringan dan pengecekan Host bisa dipalsukan, sehingga perangkat lain di Wi-Fi yang sama bisa menimpa `site.json`. Sekarang `pnpm dev` hanya di 127.0.0.1, API butuh token per sesi, Origin/Sec-Fetch-Site dicek.
- **Kehilangan data diam-diam**: skema lama membuang field yang tidak dikenal saat menyimpan (mis. `projects[].status`, `projects[].mode`, `settings.showPlannedProjects`). Sekarang field tak dikenal dipertahankan.
- Lint gagal (2 error `set-state-in-effect` di carousel).
- Label DEMO di kartu proyek menutupi gambar sampul; tombol ID/EN dan dock menutupi halaman admin.
- Tombol pagination ‹ › tanpa nama aksesibel; halaman 404 hanya berbahasa Inggris.
- `pnpm-workspace.yaml` berisi placeholder yang tidak valid.

### Baru
- **Smart carousel** reusable untuk semua section: loop tanpa putus, swipe, tombol ‹ › , pause/play, Lihat semua, panah keyboard, berhenti saat hover/sentuh/fokus keyboard/tidak terlihat/tab tidak aktif, menghormati `prefers-reduced-motion`, indikator waktu autoplay. Jumlah kolom otomatis dikurangi bila kartu akan terlalu sempit.
- Mode **grid** (dengan batas item + Lihat semua) dan **pagination** memakai komponen yang sama.
- **Header atas** dengan nama, navigasi section + indikator section aktif (desktop), tombol ID/EN. **Dock Magic UI** (magnification) di bawah: beranda, menu section (keyboard: panah, Home/End, Escape), blog, sosial, tema. Tombol kembali ke atas, skip link, URL anchor yang bisa dibagikan.
- **i18n**: semua teks UI publik di `src/lib/i18n.ts`; konten admin dua bahasa dengan fallback ke ID; pilihan bahasa pengunjung tersimpan; bahasa awal bisa diatur.
- **Halaman detail proyek** `/projects/[id]` (status, peran, detail Markdown, batasan).
- **SEO**: `sitemap.xml`, `robots.txt`, JSON-LD Person, canonical, judul/deskripsi/kata kunci/gambar Open Graph dan favicon dari admin.
- **Admin baru**: edit langsung dengan pratinjau live (desktop/tablet/HP), drag-and-drop + tombol ↑↓, sembunyikan item, duplikat, cari, tambah keahlian sekaligus, upload drag & drop dengan pratinjau gambar, validasi per field, Ctrl+S, peringatan sebelum menutup tab, Tema & animasi, SEO & favicon, riwayat versi (30 cadangan otomatis), deteksi konflik, hapus semua data contoh.
- **Build statis** `pnpm build:static` untuk Cloudflare Pages tanpa kode admin.
- Unit test (`pnpm test`), validasi data (`pnpm verify`), migrasi opsional (`pnpm migrate`), uji browser E2E (`scripts/e2e/portfolio.e2e.cjs`).

### Diubah
- Data lama (V2–V4) dibaca langsung lewat `normalizeSite()` dengan default untuk field baru; tidak perlu migrasi manual.
- Field baru: `hidden` (semua item), `projects[].status/role/details/featured`, `education[].description`, `sections[].maxItems`, `settings.defaultLanguage/defaultTheme/animation/radius/backgroundGrid/showDemoBanner/seo*`.
- `site.json`: ditambah terjemahan EN untuk judul section, deskripsi profil, dan teks kontak (tidak ada isi lama yang diubah).
- Dihapus: pipeline content-collections/MDX template yang tidak dipakai (7 artikel contoh Magic UI berbahasa Inggris) beserta dependency `shiki`, `rehype-pretty-code`, `tailwindcss-animate`, `@content-collections/*`.
- Panduan dan skrip versi lama dipindah ke `docs/arsip/` dan `scripts/legacy/`.
- `zod` dipindah ke dependencies; Node ≥ 22.6.
