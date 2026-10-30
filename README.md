# Portfolio Studio (Magic UI + Admin Lokal)

Website etalase portofolio berbasis Next.js 16, React 19, shadcn/ui dan Magic UI, dengan editor admin berbasis berkas JSON. Semua konten personal dapat diedit melalui `/admin` saat `pnpm dev`. Untuk dokumentasi lengkap lihat [PANDUAN-ADMIN.md](./PANDUAN-ADMIN.md).

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000/admin dan http://localhost:3000.

Admin write API dan upload API hanya diaktifkan saat development di localhost. Production pada Vercel/hosting bersifat read-only (konten dipublikasikan melalui Git commit).

Dikembangkan dari [Magic UI Portfolio](https://github.com/magicuidesign/portfolio), lisensi MIT (lihat LICENSE).
