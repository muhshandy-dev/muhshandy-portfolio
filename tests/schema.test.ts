import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSite, normalizeSite, SECTION_IDS } from "../src/lib/site-schema.ts";

const load = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

test("data V4 asli lolos skema tanpa kehilangan field lama", () => {
  const raw = load("site-v4.json");
  const data = normalizeSite(raw);
  assert.equal(data.projects.length, raw.projects.length);
  assert.equal(data.certifications.length, 12);
  // field yang tidak dikenal skema tetap disimpan
  assert.equal((data.projects[0] as Record<string, unknown>).mode, "Planned");
  assert.equal((data.settings as Record<string, unknown>).showPlannedProjects, false);
  assert.equal(data.projects[0].status, "planned");
  // field baru mendapat default
  assert.equal(data.settings.animation, "full");
  assert.equal(data.sections.find((s) => s.id === "projects")?.maxItems, 0);
  assert.equal(data.skills[0].hidden, false);
});

test("data V2 minimal dilengkapi: section hilang ditambah, urutan pengguna dipertahankan", () => {
  const raw = load("site-v2-minimal.json");
  const data = normalizeSite(raw);
  assert.deepEqual([...data.sections.map((s) => s.id)].sort(), [...SECTION_IDS].sort());
  assert.equal(data.sections[0].id, "hero");
  assert.equal(data.sections[1].id, "about");
  assert.equal(data.sections[2].id, "projects");
  assert.equal(data.sections[2].title, "Proyek Saya");
  assert.equal(data.sections[2].columns, 3);
  assert.equal(data.projects[0].status, "completed");
  assert.equal((data.projects[0] as Record<string, unknown>).customNote, "field buatan pengguna");
  assert.equal(data.settings.accentColor, "#0d9488");
  assert.equal(data.settings.defaultTheme, "light");
});

test("normalisasi tidak mengubah objek masukan", () => {
  const raw = load("site-v2-minimal.json");
  const before = JSON.stringify(raw);
  normalizeSite(raw);
  assert.equal(JSON.stringify(raw), before);
});

test("hasil normalisasi stabil (idempoten)", () => {
  const once = normalizeSite(load("site-v4.json"));
  const twice = normalizeSite(JSON.parse(JSON.stringify(once)));
  assert.deepEqual(twice, once);
});

test("data tidak valid ditolak dengan pesan yang jelas", () => {
  const raw = load("site-v4.json");
  raw.settings.accentColor = "biru";
  raw.projects[1].id = raw.projects[0].id;
  raw.socialLinks.push({ id: "x", label: "X", href: "javascript:alert(1)", icon: "globe", dock: true });
  const result = parseSite(raw);
  assert.equal(result.success, false);
  const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  assert.ok(paths.includes("settings.accentColor"));
  assert.ok(paths.includes("projects"));
  assert.ok(paths.some((p) => p.startsWith("socialLinks.0.href")));
});

test("slug blog published harus unik", () => {
  const raw = load("site-v4.json");
  raw.posts[1].slug = raw.posts[0].slug;
  assert.equal(parseSite(raw).success, false);
  raw.posts[1].status = "draft";
  assert.equal(parseSite(raw).success, true);
});

test("site.json saat ini valid", () => {
  const raw = JSON.parse(readFileSync(new URL("../src/data/site.json", import.meta.url), "utf8"));
  assert.equal(parseSite(raw).success, true);
});
