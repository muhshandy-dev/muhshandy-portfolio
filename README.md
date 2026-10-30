# Portfolio Studio V5 (Magic UI + Admin Lokal)

Website portofolio berbasis Next.js 16, React 19, Tailwind CSS 4, shadcn/ui dan Magic UI, dengan admin lokal untuk mengelola semua isi tanpa database. Konten tersimpan di `src/data/site.json`, file unggahan di `public/uploads/`.

```bash
pnpm install
pnpm dev          # http://localhost:3000  dan  http://localhost:3000/admin
```

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Server development + admin (hanya bisa diakses dari laptop ini, 127.0.0.1) |
| `pnpm build` / `pnpm start` | Build & jalankan production (admin otomatis 404) |
| `pnpm build:static` | Ekspor situs statis ke `out/` untuk Cloudflare Pages (tanpa kode admin) |
| `pnpm check` | typecheck + lint + unit test + validasi data + build |
| `pnpm test` | Unit test skema/migrasi data dan logika carousel |
| `pnpm verify` | Validasi `src/data/site.json` dan hitung item DEMO |
| `pnpm migrate` | (Opsional) tulis field baru V5 ke `site.json`, dengan cadangan otomatis |

Dokumentasi:
- [PANDUAN-ADMIN.md](./PANDUAN-ADMIN.md) — cara memakai admin, deploy, keamanan
- [docs/DEPLOY_CLOUDFLARE.md](./docs/DEPLOY_CLOUDFLARE.md) — pengaturan Cloudflare Pages dan pemeriksaan setelah deploy
- [MULAI-DI-LAPTOP-LAIN.md](./MULAI-DI-LAPTOP-LAIN.md) — instalasi Linux Mint / Windows dan upgrade dari V4
- [CHANGELOG.md](./CHANGELOG.md) — daftar perubahan V5
- [LAPORAN-AUDIT-DAN-PENGUJIAN.md](./LAPORAN-AUDIT-DAN-PENGUJIAN.md) — temuan audit dan hasil uji PASS/FAIL/NOT TESTED
- `docs/arsip/` — panduan versi lama (V1–V4)

Dikembangkan dari [Magic UI Portfolio](https://github.com/magicuidesign/portfolio), lisensi MIT (lihat LICENSE).
