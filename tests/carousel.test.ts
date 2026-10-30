import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleCount, wrapIndex } from "../src/lib/carousel-math.ts";

test("desktop memakai jumlah kolom dari admin bila muat", () => {
  assert.equal(visibleCount(1216, 4, 240, 16), 4); // proyek
  assert.equal(visibleCount(1216, 6, 170, 16), 6); // sertifikat
});
test("kolom otomatis dikurangi agar kartu tidak terlalu kecil", () => {
  assert.equal(visibleCount(900, 6, 170, 16), 4);
  assert.equal(visibleCount(358, 2, 170, 16), 2);
  assert.equal(visibleCount(320, 2, 170, 16), 1);
  assert.equal(visibleCount(200, 1, 240, 16), 1); // tidak pernah 0
});
test("lebar belum terukur memakai pengaturan", () => {
  assert.equal(visibleCount(0, 3, 240, 16), 3);
});
test("indeks melingkar untuk loop tak berujung", () => {
  assert.equal(wrapIndex(10, 10), 0);
  assert.equal(wrapIndex(-1, 10), 9);
  assert.equal(wrapIndex(23, 10), 3);
  assert.equal(wrapIndex(5, 0), 0);
});
