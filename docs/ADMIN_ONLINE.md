# Admin online (login + simpan ke GitHub)

Alamat: `https://muhshandy-portfolio.pages.dev/admin/` (sesuaikan bila alamat Pages-mu berbeda). Tanpa install apa pun, bisa dari Windows, HP, atau laptop mana pun.

## Cara kerja singkat
1. Halaman `/admin` dan `/api/admin/*` dijaga oleh Cloudflare Pages Functions (folder `functions/`). Tanpa login, `/admin` dialihkan ke halaman login dan API menjawab 401.
2. Login memakai satu kata sandi (variabel `ADMIN_PASSWORD`). Setelah benar, peramban menerima cookie sesi (HttpOnly, SameSite=Strict, Secure, berlaku 8 jam).
3. Tombol **Simpan & publikasikan** membuat satu commit ke `src/data/site.json` di GitHub memakai `GITHUB_TOKEN`. Cloudflare lalu membangun ulang situs otomatis (sekitar 1–2 menit).
4. Unggahan gambar/PDF menjadi commit ke `public/uploads/` dengan tanda `[skip ci]`, jadi tidak memicu build sendiri. Build jalan sekali saat kamu menyimpan.
5. Riwayat versi = riwayat commit `site.json` di GitHub. Dua sesi yang menyimpan bersamaan tidak saling menimpa: yang kedua mendapat peringatan konflik.

## Setup (sekali saja, sekitar 5 menit)

### A. Buat token GitHub
1. Buka https://github.com/settings/personal-access-tokens/new
2. Token name: `portfolio-admin`. Expiration: 1 tahun (beri pengingat di kalender).
3. Repository access: **Only select repositories** → pilih `muhshandy-portfolio`.
4. Permissions → Repository permissions → **Contents: Read and write** (Metadata: Read-only otomatis ikut).
5. **Generate token**, lalu salin (diawali `github_pat_`). Token hanya tampil sekali.

### B. Isi variabel di Cloudflare
1. Cloudflare dashboard → Workers & Pages → `muhshandy-portfolio` → **Settings** → **Variables and Secrets** → **Add**.
2. Tambah dua variabel untuk **Production**, tipe **Secret** (terenkripsi):

   | Nama | Isi |
   | --- | --- |
   | `ADMIN_PASSWORD` | kata sandi pilihanmu, **minimal 12 karakter** (saran: 4–5 kata acak, mis. `kopi-pasir-lampu-hijau-83`). Jangan dipakai di tempat lain. |
   | `GITHUB_TOKEN` | token dari langkah A |

3. Simpan. Variabel baru berlaku untuk deploy berikutnya: buka tab **Deployments** lalu **Retry deployment** pada deploy terbaru (atau push commit apa pun).
4. Biarkan variabel **Preview** kosong: admin di alamat preview otomatis tertutup.

### C. Masuk
Buka `/admin/`, masukkan kata sandi. Bila yang tampil pesan "Admin online belum aktif: …", pesan itu menyebut variabel mana yang kurang.

### D. (Disarankan) Batasi tebakan kata sandi
Server hanya memberi jeda 1,2 detik pada tiap kata sandi salah. Penghitung percobaan butuh pengaturan Cloudflare: **Security → WAF → Rate limiting rules → Create rule** (paket gratis mendapat 1 aturan): *URI Path equals* `/api/admin/login`, 5 permintaan per 10 detik per IP, aksi **Block**. Kata sandi panjang tetap pertahanan utama.

## Pemakaian sehari-hari
- Kumpulkan banyak perubahan lalu **Simpan sekali**: setiap simpan = 1 build. Kuota gratis 500 build/bulan dipakai bersama semua proyek Pages-mu.
- Gambar baru tampil di editor langsung (salinan lokal), tetapi baru ada di situs setelah build selesai.
- Batas unggahan online 2 MB per file (paket gratis Cloudflare membatasi CPU per permintaan). File lebih besar: kecilkan dulu (mis. squoosh.app), atau unggah lewat GitHub web: buka folder `public/uploads`, **Add file → Upload files**, lalu tulis alamatnya `/uploads/namafile.ext` di admin. Bila nanti memakai paket berbayar, naikkan dengan variabel `UPLOAD_MAX_MB` (maks. 8).
- Menutup tab atau sesi 8 jam habis: perubahan yang belum disimpan tetap di halaman; login lagi di tab baru lalu klik Simpan di tab lama.

## Bila ada masalah
Cek cepat tanpa login: buka `/versi.json` (commit yang sedang tayang; kalau 404, yang tayang deployment lama) dan `/api/status` (`functions: true` = login aktif, `adminSiap: true` = dua rahasia sudah terisi; hanya ya/tidak, tanpa isi rahasia).

| Gejala | Penyebab dan solusi |
| --- | --- |
| "GITHUB_TOKEN ditolak GitHub" | Token salah atau kedaluwarsa. Buat token baru (langkah A), ganti variabel, Retry deployment. |
| "GitHub menolak akses … Contents: Read and write" | Token belum punya izin Contents atau bukan untuk repo ini. |
| Salah kata sandi terus | Kata sandi di Cloudflare tidak sama. Ganti variabel, Retry deployment. |
| Simpan berhasil tetapi situs tidak berubah | Build gagal. Cek tab Deployments di Cloudflare dan tab Actions di GitHub. Situs lama tetap tayang. Pulihkan versi dari menu Backup & riwayat. |
| Error 1102 "Worker exceeded resource limits" | Batas CPU paket gratis terlampaui (belum pernah teramati, lihat "Belum diuji"). Kecilkan unggahan, atau pakai paket Workers berbayar. |
| Mengganti `ADMIN_PASSWORD` atau `GITHUB_TOKEN` | Semua sesi login otomatis keluar. Itu disengaja. |

## Keamanan
- Fail closed: sebelum `ADMIN_PASSWORD` (≥ 12 karakter) dan `GITHUB_TOKEN` terisi, semua endpoint admin menjawab 503 dan tidak bisa login.
- Perbandingan kata sandi memakai hash SHA-256 dengan waktu konstan. Cookie sesi ditandatangani HMAC (kunci diturunkan dari token + kata sandi), kedaluwarsa 8 jam.
- Semua endpoint di bawah `/api/admin/` lewat satu gerbang yang mewajibkan sesi sah, Origin sama dengan situs, dan melarang permintaan lintas situs.
- Token GitHub dan kata sandi tidak pernah dikirim ke peramban, tidak ada di kode, dan tidak muncul di pesan error (diuji).
- Unggahan diperiksa dari isi file (PNG, JPG, WebP, GIF, ICO, PDF); SVG dan HTML ditolak. Nama file dibuat ulang oleh server.
- Token hanya berlaku untuk satu repo dan hanya bisa membaca/menulis isi file, bukan mengatur repo.
- Batasan: satu pemilik dengan satu kata sandi, tanpa verifikasi dua langkah. Lapisan ekstra gratis bila diinginkan: Cloudflare Access (Zero Trust, gratis sampai 50 pengguna) di depan `/admin*` dan `/api/admin/*`.

## Pengujian
- Unit test `tests/admin-online.test.ts` (GitHub palsu): login, sesi, CSRF, konflik, unggahan, riwayat, kebocoran rahasia.
- Uji browser `scripts/e2e/admin-online.e2e.mjs`: Chromium + runtime Cloudflare lokal (`wrangler pages dev`, workerd) + GitHub palsu. Cara menjalankan ada di kepala berkas.
- Belum diuji: Cloudflare dan GitHub sungguhan, cookie `Secure` lewat https, batas CPU 10 ms paket gratis (di Node: kode handler ±4–8 ms pada isolate hangat, di Cloudflare belum diukur), dan apakah Cloudflare benar-benar melewati build untuk commit `[skip ci]`.
