# Portfolio Studio — admin lokal untuk Magic UI

Ini adalah versi yang dimodifikasi dari source Magic UI portfolio milikmu (Next.js 16.1.1). **Tanpa database, tanpa akun berbayar, tanpa secret di browser.**

## 1. Pasang di Linux Mint (tanpa menghapus folder kerja atau Git)

Pastikan project lamamu ada di `~/Projects/portfolio-saya` (sesuaikan kalau lokasimu berbeda).
Simpan arsip unduhan `portfolio-saya-admin-v1.tar.gz` ke folder `~/Downloads`.

```bash
# Matikan server lama (Ctrl+C), lalu buat cadangan data penting
cd ~/Projects/portfolio-saya
cp -f src/data/resume.tsx ~/Projects/resume-lama-backup.tsx 2>/dev/null || true

# Kembali ke Projects dan timpa file proyek dengan versi admin; folder .git/node_modules aman
cd ~/Projects
tar -xzf ~/Downloads/portfolio-saya-admin-v1.tar.gz

# Jalankan ulang (gunakan Node.js LTS 20+ dan pnpm)
cd ~/Projects/portfolio-saya
sh UPDATE-CLEANUP.sh
pnpm install
pnpm dev
```

Buka:
- `http://localhost:3000` → halaman publik
- `http://localhost:3000/admin` → panel admin **hanya pada server development lokal**

## 2. Cara menggunakan

1. Buka `/admin`, pilih menu **Profil & pengaturan**, ganti Nama Kamu, email, foto, headline, bio, alamat publik.
2. Menu **Proyek**: tambah, edit, hapus, urutkan; status `planned`, `in_progress`, `completed`, atau `live`.
3. Menu **Magang & kerja**, **Pendidikan**, **Sertifikat**, **Skill**, **Kegiatan**, **Blog**, **Sosial**: semuanya dapat diatur.
4. Menu **Tampilan & urutan**: ubah judul/subjudul, centang bagian yang tampil, geser naik/turun.
5. Klik **Terapkan item** untuk menyimpan edit item ke draft form utama, lalu **Simpan perubahan** di bagian atas.
6. Buka atau refresh halaman publik untuk melihat hasilnya. Fitur **Backup JSON** dan **Import JSON** bisa dipakai memindahkan data ke laptop lain.

Foto dan PDF ditulis ke `public/uploads/`. Konten disimpan ke **`src/data/site.json`**. Jangan lupa commit folder `uploads` saat ingin menerbitkan media. Ukuran maksimal 8 MiB per berkas, hanya PNG/JPG/WebP/PDF (tanpa SVG). Dokumen yang diunggah ke situs publik dapat diakses siapa saja: jangan unggah sertifikat berisi data rahasia tanpa menyamarkan detailnya.

**Batasan penting:** Admin ini **bukan** admin online multi-pengguna. Tidak ada halaman login atau server database. Penulisan file via API hanya aktif saat dev dan diakses melalui `localhost`; `/admin` dan endpoint write tidak tersedia saat build production (404). Jangan pakai tunnel publik atau membuka port dev ke internet. Untuk mengedit secara online di Vercel perlu backend terotentikasi (misalnya Supabase atau GitHub CMS); ini adalah tahap selanjutnya.

## 3. Publikasikan ke GitHub → Vercel

Pertama, siapkan GitHub repo dan Vercel yang sudah terhubung dengan repo itu. Setelah isi admin disimpan:

```bash
cd ~/Projects/portfolio-saya
git status
git add src/data/site.json public/uploads src/app src/components src/lib PANDUAN-ADMIN.md
# Kalau project baru diinisialisasi dari nol, tambahkan file lain dengan git add -A
git commit -m "Update portfolio content"
git push
```

Vercel akan build ulang dari commit dan memperbarui website publik. Ini **tidak langsung terpublikasi dari tombol Simpan**; tombol menyimpan file di laptop saja. Setiap orang yang clone template ini punya admin lokal dan `site.json` masing-masing.

Setelah mendapat domain Vercel, ubah **Profil → Alamat situs publik** menjadi `https://DOMAIN-KAMU.vercel.app`, simpan, dan push. Metadata SEO dan gambar preview akan ikut berubah ketika deploy selesai.

## 4. Hubungan dengan master plan

10 proyek AI/Data dari *Audit Teknis Master Plan 11 Website AI & Data* diisi sebagai **rencana** dan tidak terlihat di halaman publik pada kondisi awal. Di `/admin → Profil & pengaturan`, centang "Tampilkan proyek planned" jika ingin memperlihatkan roadmap dengan label **Rencana · belum dibuat**. Saat selesai, ubah statusnya sesuai bukti sebenarnya. Jangan isi angka metrik, URL demo atau klaim deployment sampai benar-benar ada bukti dalam repo / evaluation/. Website portofolio ini adalah "Website 00" dari master plan, bukan pengganti 10 website proyek.

## 5. Jika ada error

- `pnpm: command not found`: jalankan `npm install -g pnpm` lalu ulangi.
- Halaman admin 404: pastikan perintah yang digunakan `pnpm dev`, bukan `pnpm start`; akses dari `localhost`.
- Setelah simpan tidak berubah: refresh browser (Ctrl+Shift+R). Jika perlu, hentikan `pnpm dev` dan mulai lagi.
- Build gagal karena koneksi Google Fonts: cek koneksi internet saat build, terutama akses Google Fonts.

Lisensi asal template tetap dipertahankan. Kode ini adalah template portofolio personal reusable, belum platform SaaS dengan akun terpisah.
