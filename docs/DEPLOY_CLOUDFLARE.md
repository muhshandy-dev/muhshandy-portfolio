# Deploy ke Cloudflare Pages

Yang dipublikasikan adalah situs statis hasil `pnpm build:static` (folder `out/`) ditambah folder `functions/` (Cloudflare Pages Functions) untuk login admin online. Halaman publik tetap statis dan tidak "tidur"; hanya `/admin*` dan `/api/admin/*` yang menjalankan fungsi. Cara mengaktifkan admin online: [ADMIN_ONLINE.md](./ADMIN_ONLINE.md). Admin lokal (`pnpm dev`) tetap tersedia.

## Pengaturan proyek Pages (sekali saja)

1. Cloudflare dashboard → Workers & Pages → Create → tab **Pages** → **Connect to Git** → pilih repo `muhshandy-portfolio`.
2. Project name: `muhshandy-portfolio` → URL `https://muhshandy-portfolio.pages.dev`.
3. Production branch: `main`.
4. Framework preset: **None**.
5. Build command: `pnpm build:static`
6. Build output directory: `out`
7. Environment variables: tidak wajib untuk situs publik. Untuk admin online isi `ADMIN_PASSWORD` dan `GITHUB_TOKEN` (lihat ADMIN_ONLINE.md). Node 22 dibaca dari `.node-version`, pnpm dari `packageManager` di `package.json`. URL situs untuk sitemap/canonical diturunkan otomatis dari URL Pages; isi `SITE_URL` hanya bila memakai domain sendiri.
8. Save and Deploy. Build sekitar 1–2 menit.

## Alur mengubah isi

**Online:** buka `/admin/`, login, ubah, **Simpan & publikasikan**. Cloudflare membangun ulang otomatis; cek tab Deployments.

**Lokal:** `pnpm dev` → `http://127.0.0.1:3000/admin` → ubah → Simpan → commit `src/data/site.json` (dan `public/uploads/`) → push ke `main`.

## Pemeriksaan setelah deploy

1. Buka situs di jendela incognito. Beranda, carousel proyek dan sertifikat, ganti bahasa ID/EN, ganti tema.
2. Buka satu halaman detail proyek dan `/blog`.
3. `https://muhshandy-portfolio.pages.dev/admin/` tanpa login harus mengalihkan ke `/admin/login/`, dan `/api/admin/site` harus menjawab 401 (atau 503 bila variabel belum diisi).
4. `/sitemap.xml` harus berisi alamat `https://muhshandy-portfolio.pages.dev/...`, bukan `localhost`.
