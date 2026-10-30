# Portfolio Studio Admin V3

## Pasang pada Linux Mint

1. Simpan file `portfolio-saya-update-v3.tar.gz` di folder Downloads.
2. Di terminal yang menjalankan portofolio, tekan `Ctrl+C`.
3. Jalankan perintah:

```bash
cd ~/Projects
# Backup source + data (tanpa dependency besar)
tar -czf "portfolio-backup-$(date +%Y%m%d-%H%M%S).tar.gz" --exclude='node_modules' --exclude='.next' portfolio-saya
# Overlay kode V3. src/data/site.json tidak ada di paket, jadi aman dari overwrite.
tar -xzf ~/Downloads/portfolio-saya-update-v3.tar.gz
cd portfolio-saya
bash scripts/install-v3.sh
```

Buka `http://localhost:3000/admin` untuk mengatur halaman, dan `http://localhost:3000` untuk melihat hasilnya.

## Yang dapat diatur

- Admin > **Tampilan & urutan**: pengaturan setiap section termasuk hero, urutan naik-turun, tampil/sembunyikan, gaya daftar/kartu/kartu ringkas, 1-6 kolom desktop. Grid turun otomatis menjadi maksimal 2 kolom di tablet dan 1 di HP.
- Admin > **Profil & pengaturan**: favicon (unggah PNG persegi yang terlihat jelas pada ukuran kecil), lebar website, posisi tombol ID/EN (atas kiri/kanan), warna aksen, profil, CV, SEO.
- Home/Blog/Sosial/Theme memakai tombol dengan interaksi hover dan tekan yang sama. ID/EN muncul di pojok atas.
- Konten tetap dikelola dari admin V2. Data asli disimpan sebagai `src/data/site.json`.

## Catatan penting

- Admin ini **hanya untuk local development**. Pada production mode endpoint admin dimatikan. Setelah mengedit di laptop, commit/push ke repo untuk deploy, termasuk `src/data/site.json` dan upload file di `public/uploads/`.
- Favicon custom menggunakan URL unik hasil upload, tetapi cache browser favicon cukup agresif. Setelah mengganti favicon, tekan Ctrl+Shift+R atau cek di jendela privat; saat menguji jalankan server ulang bila perlu.
- Jangan unggah secret/token dalam data atau aset publik.
- Bila kamu sudah mengedit custom source pada V2, bandingkan perubahannya karena kode V3 akan menimpa beberapa komponen. Backup proyek dibuat sebelum instalasi.
- "4/6 per baris" berarti maksimum kolom pada layar **desktop**, bukan batas jumlah total konten. Tidak ada item yang dipotong otomatis.
