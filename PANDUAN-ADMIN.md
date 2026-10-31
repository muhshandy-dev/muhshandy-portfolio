# Panduan Admin — Portfolio Studio V5

Ada dua cara memakai admin yang sama:

- **Online** (paling mudah, tanpa install): `https://<situsmu>.pages.dev/admin/`, login dengan kata sandi. **Simpan & publikasikan** membuat commit ke GitHub dan Cloudflare membangun ulang situs. Setup sekali: [docs/ADMIN_ONLINE.md](./docs/ADMIN_ONLINE.md).
- **Lokal** (bagian 1 di bawah): hanya berjalan saat `pnpm dev` di laptopmu. Tombol **Simpan & publikasikan** menulis ke `src/data/site.json`; website online baru berubah setelah kamu commit, push, dan hosting melakukan build ulang.

Tampilan dan fitur edit sama di keduanya. Perbedaan: riwayat versi online = riwayat commit GitHub, dan unggahan online dibatasi 2 MB per file.

## 1. Membuka admin

```bash
cd ~/Projects/portfolio-saya
pnpm dev
```

Buka `http://localhost:3000/admin`. Website publik ada di `http://localhost:3000`.

## 2. Tata letak admin

- **Bar atas**: status (tersimpan / ada perubahan / ada masalah), **Pratinjau**, **Batalkan** (buang perubahan yang belum disimpan), **Website**, **Simpan & publikasikan** (`Ctrl+S`).
- **Menu kiri** (di HP menjadi deretan tab yang bisa digeser):
  - *Konten*: Profil & CV, Proyek, Pengalaman, Pendidikan, Sertifikasi, Keahlian, Kegiatan, Blog, Media sosial
  - *Tampilan*: Section & layout, Tema & animasi, Teks sapaan & kontak
  - *Situs*: SEO & favicon, Backup & riwayat
- **Pratinjau** (kanan, layar ≥1280px; di layar kecil tampil penuh): menampilkan draf secara langsung sebelum disimpan, dengan pilihan ukuran Desktop 1280px / Tablet 820px / HP 390px.

## 3. Mengelola isi (CRUD)

Setiap koleksi memakai pola yang sama:

| Aksi | Cara |
| --- | --- |
| Tambah | Tombol **Tambah …** (item baru langsung terbuka) |
| Edit | Klik baris item untuk membuka form, perubahan langsung terlihat di pratinjau |
| Ubah urutan | Seret ikon ⋮⋮ (drag-and-drop) atau tombol ↑ ↓ (bisa dengan keyboard) |
| Sembunyikan | Ikon mata: item tetap tersimpan tapi tidak tampil di website |
| Duplikat | Ikon salin |
| Hapus | Ikon tempat sampah (ada konfirmasi; versi lama tetap ada di Riwayat) |
| Cari | Kotak cari muncul bila item lebih dari 6 |

Tambahan: **Keahlian** punya kolom *Tambah cepat* (`Python, SQL, Tableau`). **Blog** membuat slug otomatis dari judul. **Proyek** punya halaman detail `/projects/<id>` dengan field *Detail lengkap (Markdown)*, *Peran*, *Status* (Selesai / Sedang dikerjakan / Rencana), dan *Batasan & catatan jujur*.

### Dua bahasa (ID/EN)
Field teks yang bisa diterjemahkan tampil berdampingan: kolom **ID** (wajib) dan **EN** (opsional). Bila EN kosong, website memakai teks ID. Nama teknologi, URL, dan nama resmi tidak perlu diterjemahkan.

### Upload gambar & PDF
Klik **Unggah file** atau seret file ke kotak upload. Format: PNG, JPG, WebP, GIF, ICO, PDF (maks. 8 MB). SVG ditolak karena bisa berisi script. File tersimpan di `public/uploads/` dengan nama aman, lalu URL-nya terisi otomatis. Jangan unggah dokumen berisi data pribadi sensitif tanpa disamarkan: semua file di `public/` bisa diunduh siapa saja setelah dipublikasikan.

## 4. Section & layout

Per section kamu bisa mengatur: urutan (drag-and-drop), tampil/sembunyi, judul & subjudul ID/EN, gaya (daftar / kartu / ringkas), dan untuk section berisi koleksi:

- **Mode konten**: *Carousel* (geser otomatis), *Grid* (semua atau dibatasi), *Pagination*
- **Kolom** desktop (≥1024px), tablet (768–1023px), HP (<768px). Bila layar terlalu sempit, jumlah kolom dikurangi otomatis supaya kartu tidak terlalu kecil.
- **Carousel**: putar otomatis on/off, jeda 3–20 detik
- **Grid**: jumlah maksimal item sebelum tombol *Lihat semua*
- **Pagination**: item per halaman desktop dan HP

Bawaan: Proyek 4 kartu desktop, Sertifikasi 6 kartu desktop, keduanya carousel.

### Perilaku carousel
Bergeser kanan → kiri satu kartu, loop tanpa ujung; berhenti saat kursor di atas kartu, saat kartu disentuh/ditekan (lanjut 4 detik setelah dilepas), saat fokus keyboard di dalamnya, saat section tidak terlihat, dan saat tab browser tidak aktif. Ada tombol ‹ › , pause/play, *Lihat semua*, swipe di HP, dan panah kiri/kanan keyboard. Pengunjung dengan *prefers-reduced-motion* tidak mendapat autoplay (bisa menekan Play sendiri).

## 5. Tema, SEO, dan teks

- **Tema & animasi**: tema awal (terang/gelap/ikuti perangkat), warna aksen, sudut kartu, tingkat animasi (penuh/halus/mati), latar flickering grid, lebar konten, bahasa awal, posisi tombol ID/EN, banner data contoh.
- **SEO & favicon**: alamat situs publik (untuk canonical, `sitemap.xml`, Open Graph), judul & deskripsi SEO, kata kunci, favicon, gambar share. `robots.txt` dan `sitemap.xml` dibuat otomatis.
- **Teks sapaan & kontak**: sapaan di hero dan ajakan di section Kontak (ID/EN).

## 6. Data contoh (SAMPLE / DEMO)

Item dengan centang *Konten contoh* diberi label **CONTOH · DEMO** / **SAMPLE · DEMO** di website, dan banner peringatan tampil selama masih ada item demo. Sebelum mengirim portofolio ke rekruter: ganti isinya dengan data asli lalu hapus centangnya, atau pakai **Backup & riwayat → Hapus semua data contoh** (hanya item DEMO yang dihapus, item asli tidak disentuh).

## 7. Keamanan penyimpanan data

- Setiap simpan divalidasi dengan skema yang sama dipakai website. Data rusak (warna salah, URL `javascript:`, ID/slug ganda) tidak bisa disimpan dan field yang bermasalah ditandai.
- Penulisan atomik + **cadangan otomatis** versi sebelumnya ke `.portfolio-backups/` (30 versi terakhir). Pulihkan lewat **Backup & riwayat → Muat ke editor**, lalu Simpan.
- **Deteksi konflik**: bila `site.json` diubah dari tempat lain (tab lain, editor teks, `git pull`) setelah admin dibuka, simpan ditolak sampai kamu memuat ulang atau memilih *Timpa*.
- **Backup JSON / Import JSON** untuk memindahkan data. File lama (V2–V4) otomatis dilengkapi saat diimpor.

## 8. Keamanan admin

Admin sengaja tanpa login karena hanya untuk laptop sendiri. Perlindungannya:

1. `pnpm dev` hanya mendengarkan di `127.0.0.1`, jadi perangkat lain di Wi-Fi yang sama tidak bisa membuka admin. **Jangan** menjalankan `next dev -H 0.0.0.0` atau tunnel (ngrok, cloudflared) saat admin aktif.
2. Endpoint `/api/admin/*` menolak Host/Origin selain localhost dan permintaan lintas situs, serta wajib membawa token acak per sesi server yang hanya ada di halaman `/admin`.
3. Di build production dan ekspor statis, `/admin` dan `/api/admin/*` tidak ada (404). Ekspor statis bahkan tidak memuat kode admin sama sekali.

Admin online (bisa edit dari mana saja) **belum** dibuat. Bila suatu saat dibutuhkan: perlu autentikasi sungguhan (mis. GitHub OAuth atau Cloudflare Access), otorisasi per endpoint tulis, dan penyimpanan persisten di server (mis. commit ke GitHub lewat API, atau Cloudflare D1/KV). localStorage tidak boleh menjadi sumber data utama.

## 9. Publikasi

### Cloudflare Pages (gratis, tanpa hibernasi) — disarankan
1. Push repo ke GitHub.
2. Cloudflare Pages → *Create project* → hubungkan repo.
3. Build command: `pnpm build:static` · Output directory: `out` · Environment variable `NODE_VERSION` = `22`.
4. Setelah dapat domain (mis. `https://nama.pages.dev`), isi **SEO & favicon → Alamat situs publik**, simpan, commit, push.

### Alur harian
```bash
pnpm dev                     # edit di /admin, klik Simpan
pnpm check                   # opsional: pastikan semua lulus
git add src/data/site.json public/uploads
git commit -m "Perbarui isi portofolio"
git push                     # Cloudflare build ulang otomatis
```

## 10. Uji browser (opsional)

`scripts/e2e/portfolio.e2e.cjs` menguji halaman publik, carousel, navigasi, bahasa, tema, dan seluruh CRUD admin di browser sungguhan. Butuh Playwright (`npm i -g playwright && npx playwright install chromium`). Jalankan saat `pnpm dev` aktif:

```bash
node scripts/e2e/portfolio.e2e.cjs http://127.0.0.1:3000
```

Tes ini mengubah `site.json` lewat admin, lalu mengembalikannya persis seperti semula di akhir (juga bila gagal).
