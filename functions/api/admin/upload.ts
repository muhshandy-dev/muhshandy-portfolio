import { detectUpload, safeUploadName, UPLOAD_MAX_BYTES } from "../../../src/lib/upload-detect.ts";
import { GithubError, putFile } from "../../_lib/github.ts";
import { json, type Handler } from "../../_lib/http.ts";

/**
 * Batas online lebih kecil dari lokal: paket gratis Cloudflare membatasi CPU 10 ms per permintaan (unggahan 1 MB ≈ 4 ms CPU
 * pada pengukuran Node, belum diukur di Cloudflare asli) dan setiap file masuk repo Git. Bisa dinaikkan dengan variabel UPLOAD_MAX_MB.
 */
export function uploadLimitBytes(env: { UPLOAD_MAX_MB?: string }) {
  const mb = Number(env.UPLOAD_MAX_MB);
  return Math.min(Number.isFinite(mb) && mb > 0 ? mb : 2, UPLOAD_MAX_BYTES / 1024 / 1024) * 1024 * 1024;
}

/**
 * Body = isi file dalam base64 (teks biasa), nama file asli di query `?name=`.
 * Peramban yang menghitung base64, supaya Worker tidak perlu menyandi ulang file besar (hemat CPU).
 */
export const onRequestPost: Handler = async ({ request, env }) => {
  const b64 = (await request.text()).trim();
  const limit = uploadLimitBytes(env);
  if (!b64) return json({ error: "Pilih file terlebih dahulu" }, 400);
  if (b64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(b64)) return json({ error: "Isi file tidak valid" }, 400);
  const size = (b64.length / 4) * 3 - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
  if (size > limit) return json({ error: `Ukuran maksimal ${limit / 1024 / 1024} MB untuk admin online. Kecilkan dulu (mis. squoosh.app untuk gambar), atau unggah file besar langsung lewat GitHub: folder public/uploads, Add file, Upload files.` }, 413);
  const head = Uint8Array.from(atob(b64.slice(0, 32)), (c) => c.charCodeAt(0));
  const ext = detectUpload(head);
  if (!ext) return json({ error: "Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, ICO, atau PDF (SVG ditolak demi keamanan)." }, 415);
  const name = safeUploadName(new URL(request.url).searchParams.get("name") ?? "file", ext, crypto.randomUUID().slice(0, 8));
  try {
    // [skip ci]: unggahan tidak memicu build sendiri; build berjalan sekali saat isi situs disimpan (hemat kuota 500 build/bulan).
    await putFile(env, { path: `public/uploads/${name}`, contentBase64: b64, message: `Admin: unggah ${name} [skip ci]` });
    return json({ url: `/uploads/${name}`, size, type: ext });
  } catch (e) {
    if (e instanceof GithubError) return json({ error: e.message }, e.status);
    console.error("[admin] upload gagal", e);
    return json({ error: "Upload gagal" }, 500);
  }
};
