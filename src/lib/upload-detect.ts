/** Tipe file dikenali dari isi (magic bytes), bukan dari nama. SVG/HTML ditolak (risiko XSS). Dipakai admin lokal dan online. */
export function detectUpload(bytes: Uint8Array): "png" | "jpg" | "webp" | "gif" | "ico" | "pdf" | null {
  const at = (sig: number[], offset = 0) => sig.every((n, i) => bytes[offset + i] === n);
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (at([0xff, 0xd8, 0xff])) return "jpg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "gif";
  if (at([0x00, 0x00, 0x01, 0x00]) && bytes.length > 6) return "ico";
  if (ascii(0, 5) === "%PDF-") return "pdf";
  return null;
}

export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

/** Nama file aman: huruf kecil, angka, tanda minus, ditambah akhiran acak. */
export function safeUploadName(original: string, ext: string, random: string) {
  const stem = original.replace(/\.[^.]*$/, "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
  return `${stem}-${random}.${ext}`;
}
