# Portfolio Studio V2 — Upgrade dari Admin V1

Rilis ini **bukan proyek baru**. Ini patch untuk folder `~/Projects/portfolio-saya` yang sudah berjalan di Linux Mint. Jangan menghapus folder lama atau file data.

## Cara instal (satu blok)

1. Simpan `portfolio-saya-update-v2.tar.gz` di Downloads.
2. Pada terminal server `pnpm dev` yang lama tekan **Ctrl+C**.
3. Jalankan:

```bash
cd ~/Projects && tar -xzf ~/Downloads/portfolio-saya-update-v2.tar.gz && cd portfolio-saya && bash scripts/install-v2.sh
```

Selesai. Lihat `http://localhost:3000` (publik) dan `http://localhost:3000/admin` (admin lokal). Jika tampilannya masih lama, refresh `Ctrl+Shift+R`; zoom browser `Ctrl+0` untuk ukuran normal.

## Perubahan

- Semua proyek otomatis tampak di publik, termasuk sepuluh entri roadmap bawaan. **Tidak ada status planned/in-progress/completed/live** pada editor atau kartu proyek. Entri roadmap belum merupakan hasil implementasi; deskripsinya tetap eksplisit dimulai dengan kata "Rencana:" / "Project proposal:". Jika tidak ingin menampilkan rencana, hapus entri tersebut dari admin atau ganti dengan karya nyata, jangan menyajikannya sebagai karya selesai.
- Pengunjung mengubah tema dengan ikon matahari/bulan dan bahasa melalui tombol `ID` / `EN` di dock bawah. Preferensi diingat oleh browser.
- Konten yang bisa diterjemahkan memiliki input **English (opsional)** di admin (headline, bio, proyek, pengalaman, pendidikan, sertifikat, kegiatan, blog, judul/subjudul bagian, dan teks kontak). Teks Inggris ditampilkan saat EN dipilih. Kalau kolom Inggris kosong, teks Indonesia ditampilkan sebagai cadangan. **Bukan fitur terjemahan AI otomatis.**
- Sepuluh deskripsi proyek bawaan dan banyak label statis disediakan terjemahan Inggris yang telah ditulis manual. Konten buatanmu sendiri belum otomatis diterjemahkan.
- Untuk menyimpan edit item: **Terapkan item** → **Simpan perubahan**. Konten akan tersimpan ke `src/data/site.json`. Refresh website publik.

## Aman untuk data yang sudah diisi

Arsip **tidak menyertakan `src/data/site.json`**, sehingga file tersebut tidak akan tertimpa waktu ekstraksi. Migrator `scripts/migrate-v2.mjs` membuat salinan file JSON yang lama di `src/data/site.json.backup-before-v2-...`. Perubahan lama dipertahankan, dan kolom status proyek yang tidak dipakai lagi dihapus. File media `public/uploads` juga tidak dihapus.

## Batasan

- Admin tetap **lokal**, tidak ada login dan tidak tersedia saat build production. Jangan membuka server development ke internet.
- Publikasi dari laptop ke Vercel masih perlu `git add`, `git commit`, dan `git push`. Tombol Simpan tidak mengirim data ke hosting.
- Build Next.js penuh harus diuji pada laptop dengan dependensi yang tersedia. Paket patch ini tidak mengubah daftar dependency.
