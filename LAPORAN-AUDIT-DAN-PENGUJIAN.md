# Laporan Audit & Pengujian — Portfolio Studio V5

Tanggal: 30 Oktober 2026 · Basis: `portfolio-saya-update-v4.zip` (Next.js 16.1.1, React 19.2, Tailwind 4, Magic UI)
Lingkungan uji: Linux (container), Node 22.22.0, pnpm 10.28.0, Chromium (Playwright). **Belum diuji di laptop Linux Mint asli.**

## 1. Hasil audit V4 (sebelum perbaikan)

| Pemeriksaan | Hasil V4 |
| --- | --- |
| `tsc --noEmit` | Lulus |
| `pnpm lint` | **Gagal** — 2 error `react-hooks/set-state-in-effect` di carousel (`src/app/page.tsx`) |
| `pnpm build` | Lulus |

| # | Temuan | Dampak | Status V5 |
| --- | --- | --- | --- |
| 1 | `next dev` mendengarkan di semua antarmuka; cek Host bisa dipalsukan. Diuji: request dari IP jaringan dengan header `Host: localhost` lolos ke validasi (HTTP 400, bukan ditolak). | Perangkat lain di Wi-Fi yang sama bisa menimpa `site.json` | Diperbaiki |
| 2 | Skema zod membuang field tak dikenal saat simpan (`projects[].status`, `projects[].mode`, `settings.showPlannedProjects`) | Data hilang diam-diam pada simpan pertama | Diperbaiki |
| 3 | Lint gagal (temuan di atas) | `pnpm lint` merah | Diperbaiki |
| 4 | Carousel tidak benar-benar loop (melompat balik ke awal), fokus setelah klik membuat autoplay berhenti permanen | UX | Diganti smart carousel |
| 5 | Admin: tanpa pratinjau, tanpa drag-and-drop, tidak bisa sembunyikan item, edit 2 langkah (Terapkan → Simpan), tema/animasi/SEO belum bisa diatur, tanpa riwayat | Fitur kurang | Dibangun ulang |
| 6 | Tombol ID/EN melayang, dock dan tombol bahasa menutupi admin | UX | Diperbaiki |
| 7 | Tidak ada indikator section aktif, tombol ke atas, header nav, skip link | Navigasi | Ditambahkan |
| 8 | Tidak ada halaman detail proyek, sitemap, robots, JSON-LD | SEO | Ditambahkan |
| 9 | Label DEMO menutupi teks di gambar sampul; pagination ‹ › tanpa nama aksesibel; 404 hanya Inggris | UI/a11y | Diperbaiki |
| 10 | Pipeline content-collections + 7 artikel MDX template dikompilasi tiap build tapi tidak dipakai; shiki, rehype-pretty-code, tailwindcss-animate tidak terpakai | Build lebih lambat, dependency berlebih | Dihapus |
| 11 | `pnpm-workspace.yaml` berisi placeholder "set this to true or false" | Konfigurasi tidak valid | Diperbaiki |
| 12 | Teks UI tersebar sebagai ternary; judul section tidak punya versi EN | i18n tidak lengkap | Kamus i18n + terjemahan EN ditambahkan |

## 2. Prioritas yang dikerjakan
1. Keamanan & integritas data (temuan 1, 2) → 2. Lint/build hijau → 3. Komponen koleksi reusable (carousel/grid/pagination) → 4. Navigasi + i18n → 5. Admin lengkap + pratinjau → 6. SEO, build statis, performa → 7. Pengujian & dokumentasi.

## 3. Hasil pengujian

### Pemeriksaan otomatis (setelah perbaikan)
| Pemeriksaan | Status | Bukti |
| --- | --- | --- |
| `pnpm typecheck` | PASS | 0 error |
| `pnpm lint` | PASS | 0 error, 0 warning |
| `pnpm test` (unit) | PASS | 11/11 — migrasi V2/V4, field tak dikenal dipertahankan, idempoten, validasi menolak data rusak, slug unik, matematika carousel |
| `pnpm verify` | PASS | site.json valid; 60 item DEMO dilaporkan |
| `pnpm build` | PASS | 20 halaman (10 detail proyek, 3 blog, sitemap, robots, OG image) |
| `pnpm build:static` | PASS | `out/` tanpa halaman/kode admin; `_headers` Cloudflare ditulis |
| Production `next start`: `/admin`, `GET/POST /api/admin/*` | PASS | semuanya 404 |
| Uji E2E browser (`scripts/e2e/portfolio.e2e.cjs`) | PASS | **41/41** pada putaran terakhir (lihat catatan di bagian 4) |

### Rincian per fitur
| Fitur | Status | Catatan / bukti |
| --- | --- | --- |
| Halaman publik desktop 1440 terang & gelap | PASS | tanpa error konsol, tanpa scroll horizontal |
| Halaman publik HP 390 terang & gelap | PASS | sama |
| Ganti bahasa ID ↔ EN + tersimpan setelah reload | PASS | `html[lang]` berubah, judul section EN tampil |
| Ganti tema terang/gelap + tersimpan | PASS | |
| Carousel proyek desktop 4 kartu, ‹ › , loop dua arah | PASS | 1–4 → 2–5; mundur dari awal → 10–10; maju → 1–4 |
| Carousel sertifikat desktop 6 kartu | PASS | 1–6 dari 12 |
| Autoplay jalan, berhenti saat hover, tombol pause | PASS | posisi tetap 7 detik saat hover dan saat dijeda |
| Autoplay berhenti saat section tidak terlihat | PASS | |
| Carousel keyboard (panah kanan) | PASS | |
| Lihat semua → grid seluruh item → kembali ke carousel | PASS | 10 kartu |
| Carousel HP: 1 kartu proyek, 2 kartu sertifikat, swipe | PASS | lebar kartu sertifikat 171 px; swipe disimulasikan dengan drag pointer |
| `prefers-reduced-motion`: autoplay mati | PASS | |
| Navigasi header: anchor URL + indikator aktif + fokus ke judul section | PASS | `#certifications`, fokus `#certifications-title` |
| Tombol kembali ke atas | PASS | |
| URL anchor dibagikan (`/#skills`) | PASS | |
| Menu section HP di dock, panah & Escape, fokus kembali ke tombol | PASS | |
| Tombol ID/EN di header, bukan di dock bawah | PASS | |
| Halaman detail proyek & blog; id salah → 404 | PASS | |
| Admin tampil tanpa error (desktop & HP 390 tanpa scroll horizontal) | PASS | |
| Pratinjau langsung sebelum simpan | PASS | iframe berubah, `site.json` belum berubah |
| Simpan → `site.json` berubah + cadangan otomatis + website ikut berubah | PASS | |
| Field EN tersimpan | PASS | |
| CRUD Proyek, Pengalaman, Pendidikan, Sertifikasi, Keahlian, Kegiatan, Blog, Media sosial | PASS | tiap koleksi: tambah, edit, sembunyikan, ubah urutan, duplikat, hapus |
| Edit + simpan Profil, Tema, SEO, Section | PASS | nama, headline EN, warna aksen, animasi, judul SEO, layout section |
| Edit Teks sapaan & kontak, Favicon, Riwayat → Simpan pemulihan | NOT TESTED | memakai komponen field & API yang sama, tidak diuji terpisah |
| Drag-and-drop urutan | PASS | item ke-1 dipindah ke posisi 3 lalu dikembalikan |
| Upload gambar PNG & PDF, file bisa diakses | PASS | `image/png`, `application/pdf` 200 |
| Upload SVG ditolak | PASS | HTTP 415 |
| Pengaturan layout (grid, 3 kolom, maks 3 item) berlaku di publik | PASS | 3 kartu, 3 kolom, "Lihat semua (10)" |
| Sembunyikan & urutkan section | PASS | |
| Validasi mencegah data rusak (warna "biru") | PASS | file tidak berubah |
| Deteksi konflik (site.json diubah dari luar) | PASS | HTTP 409, data luar aman sampai pilih Timpa |
| Riwayat versi dimuat ke editor | PASS | |
| Hapus semua data contoh (hanya item DEMO) | PASS | diuji di draf lalu dibatalkan |
| Migrasi data lama V2 minimal (tanpa hero, section tidak lengkap) | PASS | unit test + dijalankan di dev server: halaman & admin 200 |
| Migrasi V4 (data asli zip) + `pnpm migrate` dua kali | PASS | semua koleksi utuh, field lama tetap, cadangan dibuat |
| Keamanan API: tanpa token 401, token salah 401, Origin asing 403, Host palsu 403, Sec-Fetch-Site cross-site 403, traversal nama cadangan 404 | PASS | curl |
| Akses dari IP jaringan saat `pnpm dev` | PASS | koneksi ditolak (server hanya di 127.0.0.1) |
| Situs statis `out/` di server statis: beranda, carousel, ganti bahasa, detail proyek, sitemap; `/admin` 404 | PASS | Chromium |
| Ukuran JS beranda | PASS (diukur) | 291 KB gzip vs V4 280 KB, walau fitur jauh lebih banyak; zod hanya dimuat di mode pratinjau |
| Skor Lighthouse / Core Web Vitals | NOT TESTED | Lighthouse tidak dijalankan |
| Deploy nyata ke Cloudflare Pages | NOT TESTED | repo belum ada |
| Laptop Linux Mint asli | NOT TESTED | diuji di container Linux dengan Node 22 |
| Firefox / Safari | NOT TESTED | hanya Chromium |
| Swipe jari di perangkat sentuh asli | NOT TESTED | disimulasikan dengan drag pointer |
| Pembaca layar (screen reader) asli | NOT TESTED | hanya role, label, dan fokus yang diperiksa |
| Windows | NOT TESTED | |
| Admin online | NOT TESTED | sengaja tidak dibuat (lihat bagian 5) |

## 4. Catatan jujur
- Satu putaran E2E (putaran ke-3 dari 5) gagal 8 tes berturut-turut: upload pertama setelah server mengompilasi ulang memakan waktu lebih dari batas tunggu 8 detik tes, lalu tes berikutnya ikut macet. Aplikasi tidak bermasalah (dicek terpisah: upload berhasil). Batas tunggu upload dinaikkan ke 20 detik; dua putaran berikutnya 41/41 PASS.
- Data contoh yang diminta brief sudah ada di V4 dan tidak ditambah: 10 proyek, 12 sertifikasi, 4 pengalaman, 2 pendidikan, 24 keahlian, 5 kegiatan, 3 tulisan, semuanya berlabel DEMO.
- **Isi kartu proyek perlu keputusanmu (tidak saya ubah karena itu datamu):** 10 kartu masih berstatus "Rencana · Roadmap 2026–2027" dan berlabel DEMO, padahal Data Trust Observatory dan Industrial Sensor Sentinel sudah online. Judulnya juga masih memakai kode internal (`DA10 ·`, `AI04 ·`) yang menurut aturan proyek tidak boleh tampil di publik. Subjudul "Proyek yang sudah dikerjakan dan terbukti" bertentangan dengan status "Rencana".
- Profil masih "Nama Contoh" dan `nama@example.com`.
- HTML beranda membesar (62 → 110 KB, sebelum kompresi) karena data situs dikirim ke klien untuk ganti bahasa tanpa reload.

## 5. Keputusan desain
- Admin tetap lokal tanpa login (sesuai brief langkah 8). Admin online butuh autentikasi + penyimpanan server; tidak dibuat sebelum ada keputusan.
- Tidak ada dependency baru. Drag-and-drop memakai HTML5 bawaan, carousel ditulis sendiri.
- Desain Magic UI dipertahankan: BlurFade, BlurFadeText, FlickeringGrid, Dock (sekarang dengan magnification), tipografi Geist.

## 6. Cara menjalankan
Lihat `MULAI-DI-LAPTOP-LAIN.md` (instal & upgrade dari V4) dan `PANDUAN-ADMIN.md`.
