/**
 * Berapa kartu yang muat: tidak melebihi pengaturan admin, dan tidak membuat kartu
 * lebih sempit dari minCardWidth (supaya teks tetap terbaca di layar kecil).
 */
export function visibleCount(containerWidth: number, wanted: number, minCardWidth: number, gap: number) {
  if (containerWidth <= 0) return Math.max(1, wanted);
  const fit = Math.floor((containerWidth + gap) / (minCardWidth + gap));
  return Math.max(1, Math.min(wanted, fit));
}

/** Indeks melingkar 0..n-1 (untuk loop tak berujung). */
export function wrapIndex(i: number, n: number) {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}
