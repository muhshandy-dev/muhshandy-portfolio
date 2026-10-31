/*
 * Uji end-to-end admin ONLINE di runtime Cloudflare lokal (workerd lewat `wrangler pages dev`), dengan GitHub palsu.
 * TIDAK menyentuh GitHub atau Cloudflare sungguhan, dan tidak mengubah file di repo.
 *
 * Prasyarat: `pnpm build:static` sudah dijalankan (folder out/), Playwright terpasang, dan wrangler tersedia:
 *   WRANGLER=/jalur/ke/wrangler/bin/wrangler.js   (mis. `npm i wrangler` di folder sementara, tidak perlu masuk package.json)
 * Jalankan: node --experimental-strip-types scripts/e2e/admin-online.e2e.mjs [folder-screenshot]
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { startMockGithub } = await import("../../tests/helpers/mock-github.ts");
const { normalizeSite } = await import("../../src/lib/site-schema.ts");

const WRANGLER = process.env.WRANGLER;
if (!WRANGLER) { console.error("Set WRANGLER=/jalur/ke/wrangler/bin/wrangler.js"); process.exit(2); }
const SHOTS = process.argv[2] || path.join(process.cwd(), ".e2e-screenshots");
mkdirSync(SHOTS, { recursive: true });
const PASSWORD = "kata-sandi-panjang-123";
const PORT = 8788;
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function check(name, fn) {
  const t0 = Date.now();
  try { const detail = await fn(); results.push({ name, status: "PASS", detail: detail || "", ms: Date.now() - t0 }); console.log(`PASS  ${name}${detail ? " — " + detail : ""}`); }
  catch (e) { const msg = String((e && e.message) || e).split("\n")[0]; results.push({ name, status: "FAIL", detail: msg, ms: Date.now() - t0 }); console.log(`FAIL  ${name} — ${msg}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
async function waitFor(fn, msg, timeout = 10000) { const end = Date.now() + timeout; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch { /* ulangi */ } await sleep(150); } throw new Error(msg); }

function startWrangler(bindings) {
  const args = [WRANGLER, "pages", "dev", "out", "--port", String(PORT), "--ip", "127.0.0.1", "--compatibility-date", "2025-01-01", ...Object.entries(bindings).flatMap(([k, v]) => ["--binding", `${k}=${v}`])];
  const child = spawn("node", args, { env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" }, stdio: "ignore" });
  return child;
}
async function waitUp() { await waitFor(async () => (await fetch(`${BASE}/`)).ok, "wrangler tidak naik", 60000); }
async function stop(child) { child.kill("SIGTERM"); await sleep(1500); if (child.exitCode === null) child.kill("SIGKILL"); await sleep(500); }

const gh = await startMockGithub();
const seedSite = normalizeSite(JSON.parse(readFileSync("tests/fixtures/site-v4.json", "utf8")));
gh.seed("src/data/site.json", JSON.stringify(seedSite, null, 2) + "\n");
const siteInRepo = () => JSON.parse(gh.files.get("src/data/site.json").text.toString("utf8"));

let server = startWrangler({ ADMIN_PASSWORD: PASSWORD, GITHUB_TOKEN: gh.token, GITHUB_API_URL: gh.url });
const browser = await chromium.launch();
try {
  await waitUp();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|40[139]|415/.test(m.text())) consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("response", (r) => { if (r.status() === 404) consoleErrors.push(`404 ${r.url()}`); });

  await check("situs publik tetap terbuka tanpa login (beranda, detail proyek)", async () => {
    for (const p of ["/", "/projects/da10/", "/sitemap.xml"]) { const r = await fetch(BASE + p); assert(r.ok, `${p} → ${r.status}`); }
  });
  await check("tanpa login: /admin dialihkan ke halaman login, API 401", async () => {
    await page.goto(`${BASE}/admin/`);
    await waitFor(() => page.url().endsWith("/admin/login/"), `URL ${page.url()}`);
    assert(await page.locator("#admin-password").isVisible(), "form login tidak tampil");
    await page.screenshot({ path: path.join(SHOTS, "online-login-1440.png") });
    for (const [p, m] of [["/api/admin/site", "GET"], ["/api/admin/backups", "GET"]]) { const r = await fetch(BASE + p, { method: m }); assert(r.status === 401, `${p} → ${r.status}`); }
    const noLogin = await fetch(`${BASE}/admin/index.txt`, { redirect: "manual" });
    assert(noLogin.status === 302, `/admin/index.txt → ${noLogin.status}`);
  });
  await check("sandi salah ditolak dengan pesan, tetap di halaman login", async () => {
    await page.fill("#admin-password", "sandi-salah-sekali");
    await page.click("button[type=submit]");
    await page.waitForSelector(".adm-error", { timeout: 8000 });
    assert(/salah/i.test(await page.locator(".adm-error").innerText()), "pesan salah tidak tampil");
    assert(page.url().endsWith("/admin/login/"), "pindah halaman padahal sandi salah");
  });
  await check("sandi benar: masuk ke admin online, data dimuat dari GitHub", async () => {
    await page.fill("#admin-password", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForSelector(".portfolio-admin", { timeout: 15000 });
    assert(/admin online/i.test(await page.locator(".adm-topbar").innerText()), "label Admin online tidak ada");
    const cookies = await ctx.cookies();
    const c = cookies.find((x) => x.name === "admin_session");
    assert(c && c.httpOnly && c.sameSite === "Strict", `cookie: ${JSON.stringify(c)}`);
    const val = await page.locator("input.adm-input").first().inputValue();
    assert(val.length > 0, "form profil kosong");
    await page.screenshot({ path: path.join(SHOTS, "online-admin-1440.png") });
  });
  await check("cookie sesi tidak bisa dibaca JavaScript halaman", async () => {
    assert(!(await page.evaluate(() => document.cookie)).includes("admin_session"), "cookie terbaca dari JS");
  });
  await check("ubah nama + Ctrl+S → satu commit di GitHub, isi lain utuh", async () => {
    const field = page.locator(".adm-field", { hasText: "Nama" }).locator("input").first();
    await field.fill("Shandy Uji Online");
    await page.keyboard.press("Control+s");
    await waitFor(async () => /Terkirim ke GitHub/.test(await page.locator(".adm-msg").innerText()), "pesan sukses tidak tampil");
    const saved = siteInRepo();
    assert(saved.profile.name === "Shandy Uji Online", `nama di repo: ${saved.profile.name}`);
    assert(saved.projects.length === seedSite.projects.length && saved.certifications.length === seedSite.certifications.length, "data lain berubah");
    assert(gh.commits[0].message === "Admin: perbarui isi situs", gh.commits[0].message);
    assert(gh.commits.filter((c) => c.path === "src/data/site.json").length === 2, "jumlah commit site.json");
  });
  await check("pratinjau menampilkan draf yang belum disimpan", async () => {
    await page.getByRole("button", { name: "Pratinjau", exact: true }).click();
    await page.locator(".adm-field", { hasText: "Nama" }).locator("input").first().fill("Nama Draf Pratinjau");
    const frame = page.frameLocator('iframe[title="Pratinjau website"]');
    await waitFor(async () => (await frame.locator("#hero").innerText()).includes("Nama Draf Pratinjau"), "draf tidak tampil di pratinjau", 15000);
    assert(siteInRepo().profile.name === "Shandy Uji Online", "draf sudah ter-commit sebelum Simpan");
    await page.locator(".adm-field", { hasText: "Nama" }).locator("input").first().fill("Shandy Uji Online");
    await page.getByRole("button", { name: "Pratinjau", exact: true }).click();
  });
  await check("unggah gambar lewat UI → file di GitHub dengan [skip ci], pratinjau lokal tampil", async () => {
    await page.getByRole("button", { name: /^Proyek/ }).click();
    await page.locator(".adm-row-title").first().click();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const input = page.locator(".adm-upload input[type=file]").first();
    await input.setInputFiles({ name: "Gambar Uji.png", mimeType: "image/png", buffer: png });
    await waitFor(() => gh.commits.some((c) => /^Admin: unggah gambar-uji-[0-9a-f]{8}\.png \[skip ci\]$/.test(c.message)), "commit unggahan tidak ada", 15000);
    const url = await page.locator(".adm-upload input.adm-input").first().inputValue();
    assert(/^\/uploads\/gambar-uji-[0-9a-f]{8}\.png$/.test(url), `URL: ${url}`);
    assert(gh.files.has(`public${url}`), "file tidak ada di repo");
    const src = await page.locator(".adm-upload-preview img").first().getAttribute("src");
    assert(src?.startsWith("blob:"), `pratinjau tidak lokal: ${src}`);
  });
  await check("unggah SVG ditolak dengan pesan", async () => {
    const input = page.locator(".adm-upload input[type=file]").first();
    const n = gh.commits.length;
    await input.setInputFiles({ name: "x.png", mimeType: "image/png", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>'.padEnd(60)) });
    await page.waitForSelector(".adm-upload .adm-error", { timeout: 8000 });
    assert(gh.commits.length === n, "SVG ikut ter-commit");
  });
  await check("Simpan lagi setelah unggah → commit kedua; revisi baru dipakai (tanpa 409 palsu)", async () => {
    await page.locator(".adm-field", { hasText: "Judul" }).locator("input").first().fill("Judul Uji Online").catch(() => {});
    await page.keyboard.press("Control+s");
    await waitFor(async () => /Terkirim ke GitHub/.test(await page.locator(".adm-msg").innerText()), "pesan sukses tidak tampil");
    assert(gh.commits.filter((c) => c.path === "src/data/site.json").length === 3, "jumlah commit site.json");
  });
  await check("konflik: file di GitHub diubah dari luar → 409 dengan pilihan Timpa", async () => {
    const outside = { ...siteInRepo(), profile: { ...siteInRepo().profile, name: "Diubah Dari Luar" } };
    gh.seed("src/data/site.json", JSON.stringify(outside, null, 2) + "\n");
    await page.getByRole("button", { name: /Profil & CV/ }).click();
    await page.locator(".adm-field", { hasText: "Nama" }).locator("input").first().fill("Nama Dari Admin");
    await page.keyboard.press("Control+s");
    await waitFor(async () => /sudah berubah/.test(await page.locator(".adm-msg").innerText()), "pesan konflik tidak tampil");
    assert(siteInRepo().profile.name === "Diubah Dari Luar", "data luar tertimpa tanpa izin");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Timpa dengan versi ini" }).click();
    await waitFor(() => siteInRepo().profile.name === "Nama Dari Admin", "timpa tidak berhasil");
  });
  await check("Riwayat: daftar commit site.json, versi lama dimuat ke editor", async () => {
    await page.getByRole("button", { name: /Backup & riwayat/ }).click();
    await page.waitForSelector(".divide-y li", { timeout: 8000 });
    const n = await page.locator(".divide-y li").count();
    assert(n >= 3, `hanya ${n} versi`);
    await page.locator(".divide-y li").last().getByRole("button", { name: "Muat ke editor" }).click();
    await waitFor(async () => /dimuat ke editor/.test(await page.locator(".adm-msg").innerText()), "versi tidak dimuat");
  });
  await check("tidak ada error konsol selama sesi admin", async () => { assert(consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | ")); });
  await check("HP 390px: admin tampil tanpa scroll horizontal", async () => {
    const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
    await m.goto(`${BASE}/admin/`); await m.waitForSelector(".portfolio-admin", { timeout: 15000 });
    assert(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "ada scroll horizontal");
    await m.screenshot({ path: path.join(SHOTS, "online-admin-390.png") }); await m.close();
  });
  await check("keluar: cookie dihapus, /admin kembali ke login, API 401", async () => {
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Keluar" }).click();
    await waitFor(() => page.url().endsWith("/admin/login/"), `URL ${page.url()}`);
    assert(!(await ctx.cookies()).some((c) => c.name === "admin_session" && c.value), "cookie masih ada");
    await page.goto(`${BASE}/admin/`); await waitFor(() => page.url().endsWith("/admin/login/"), "tidak dialihkan");
  });
  await check("serangan lintas situs: POST dengan Origin asing ditolak walau ada cookie sah", async () => {
    await page.goto(`${BASE}/admin/login/`);
    await page.fill("#admin-password", PASSWORD); await page.click("button[type=submit]");
    await page.waitForSelector(".portfolio-admin", { timeout: 15000 });
    const n = gh.commits.length;
    const status = await page.evaluate(async () => (await fetch("/api/admin/site", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://jahat.example" }, body: "{}" })).status);
    // Header Origin dari fetch same-origin tidak bisa dipalsukan oleh peramban; uji server langsung dengan cookie:
    const cookie = (await ctx.cookies()).find((c) => c.name === "admin_session");
    const forged = await fetch(`${BASE}/api/admin/site`, { method: "POST", headers: { cookie: `admin_session=${cookie.value}`, origin: "https://jahat.example", "content-type": "application/json" }, body: "{}" });
    const noOrigin = await fetch(`${BASE}/api/admin/site`, { method: "POST", headers: { cookie: `admin_session=${cookie.value}`, "content-type": "application/json" }, body: "{}" });
    assert(forged.status === 403 && noOrigin.status === 403, `forged=${forged.status} noOrigin=${noOrigin.status}`);
    assert(gh.commits.length === n, "ada commit dari permintaan terlarang");
    return `fetch same-origin tanpa data valid → ${status}`;
  });
} finally {
  await browser.close();
  await stop(server);
}

// Konfigurasi belum lengkap: admin tertutup dan memberi tahu apa yang kurang.
server = startWrangler({ GITHUB_TOKEN: gh.token, GITHUB_API_URL: gh.url });
try {
  await waitUp();
  await check("tanpa ADMIN_PASSWORD: API 503 + halaman login menjelaskan penyebabnya", async () => {
    const r = await fetch(`${BASE}/api/admin/site`); assert(r.status === 503, `status ${r.status}`);
    const b = await chromium.launch(); const p = await b.newPage();
    await p.goto(`${BASE}/admin/login/`); await p.fill("#admin-password", PASSWORD); await p.click("button[type=submit]");
    await p.waitForSelector(".adm-error", { timeout: 8000 });
    const text = await p.locator(".adm-error").innerText(); await b.close();
    assert(/ADMIN_PASSWORD/.test(text), text);
  });
} finally { await stop(server); await gh.close(); }

const pass = results.filter((r) => r.status === "PASS").length;
writeFileSync(path.join(SHOTS, "hasil-e2e-admin-online.json"), JSON.stringify({ date: new Date().toISOString(), pass, total: results.length, results }, null, 2));
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
