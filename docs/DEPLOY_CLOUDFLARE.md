# Deploy ke Cloudflare Pages

Yang dipublikasikan adalah situs statis hasil `pnpm build:static` (folder `out/`). Halaman dan API admin **tidak ikut**: admin hanya berjalan di laptop lewat `pnpm dev`. Situs statis tidak "tidur", jadi tidak ada jeda saat pertama dibuka.

## Pengaturan proyek Pages (sekali saja)

1. Cloudflare dashboard → Workers & Pages → Create → tab **Pages** → **Connect to Git** → pilih repo `muhshandy-portfolio`.
2. Project name: `muhshandy-portfolio` → URL `https://muhshandy-portfolio.pages.dev`.
3. Production branch: `main`.
4. Framework preset: **None**.
5. Build command: `pnpm build:static`
6. Build output directory: `out`
7. Environment variables: tidak wajib. Node 22 dibaca dari `.node-version`, pnpm dari `packageManager` di `package.json`. URL situs untuk sitemap/canonical diturunkan otomatis dari URL Pages; isi `SITE_URL` hanya bila memakai domain sendiri.
8. Save and Deploy. Build sekitar 1–2 menit.

## Alur mengubah isi

1. Di laptop: `pnpm dev` → buka `http://127.0.0.1:3000/admin` → ubah → Simpan.
2. Commit `src/data/site.json` (dan file baru di `public/uploads/`) lalu push ke `main`.
3. Cloudflare membangun ulang otomatis. Cek tab Deployments: commit teratas harus berstatus Success.

## Pemeriksaan setelah deploy

1. Buka situs di jendela incognito. Beranda, carousel proyek dan sertifikat, ganti bahasa ID/EN, ganti tema.
2. Buka satu halaman detail proyek dan `/blog`.
3. `https://muhshandy-portfolio.pages.dev/admin` harus menampilkan halaman 404.
4. `/sitemap.xml` harus berisi alamat `https://muhshandy-portfolio.pages.dev/...`, bukan `localhost`.
