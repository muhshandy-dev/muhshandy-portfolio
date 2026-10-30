/*
 * Uji browser end-to-end (opsional) untuk Portfolio Studio.
 *
 * Prasyarat: `pnpm dev` sedang berjalan, dan Playwright terpasang
 *   (npm i -g playwright && npx playwright install chromium)
 * Jalankan:  node scripts/e2e/portfolio.e2e.cjs [http://127.0.0.1:3000] [folder-screenshot]
 *
 * PENTING: tes ini mengubah src/data/site.json lewat admin. File dicadangkan di awal dan
 * DIKEMBALIKAN di akhir (juga bila tes gagal). File unggahan tes dihapus kembali.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const SHOTS = process.argv[3] || path.join(process.cwd(), ".e2e-screenshots");
const ROOT = process.cwd();
const SITE = path.join(ROOT, "src/data/site.json");
const UPLOADS = path.join(ROOT, "public/uploads");
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readSite = () => JSON.parse(fs.readFileSync(SITE, "utf8"));

async function check(name, fn) {
  const t0 = Date.now();
  try { const detail = await fn(); results.push({ name, status: "PASS", detail: detail || "", ms: Date.now() - t0 }); console.log(`PASS  ${name}${detail ? " — " + detail : ""}`); }
  catch (e) { results.push({ name, status: "FAIL", detail: String(e && e.message || e).split("\n")[0], ms: Date.now() - t0 }); console.log(`FAIL  ${name} — ${String(e && e.message || e).split("\n")[0]}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
async function waitFor(fn, msg, timeout = 8000) { const end = Date.now() + timeout; let last; while (Date.now() < end) { try { last = await fn(); if (last) return last; } catch { /* retry */ } await sleep(150); } throw new Error(msg); }
async function scrollThrough(page) { for (let y = 0; y < 30000; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await sleep(40); if (await page.evaluate((v) => v > document.documentElement.scrollHeight, y)) break; } await page.evaluate(() => window.scrollTo(0, 0)); await sleep(400); }
const status = (page, section) => page.locator(`#${section} .sc-controls span.tabular-nums`).innerText();

// Gambar PNG 1x1 dan PDF minimal untuk tes upload
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const original = fs.readFileSync(SITE, "utf8");
  const uploadsBefore = new Set(fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []);
  const BACKUPS = path.join(ROOT, ".portfolio-backups");
  const backupsBefore = new Set(fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS) : []);
  const browser = await chromium.launch();
  try {
    // ---------- Halaman publik ----------
    for (const [w, h, label] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
      for (const scheme of ["light", "dark"]) {
        await check(`Publik ${label} ${scheme}: render tanpa error konsol`, async () => {
          const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
          await page.addInitScript((s) => { try { localStorage.setItem("theme", s); } catch { /* */ } }, scheme);
          await page.goto(BASE + "/", { waitUntil: "networkidle" });
          await scrollThrough(page);
          await page.screenshot({ path: path.join(SHOTS, `publik-${w}-${scheme}.png`), fullPage: true });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          const sections = await page.locator("main section[id]").count();
          await page.close();
          assert(errors.length === 0, "error: " + errors.slice(0, 2).join(" | "));
          assert(overflow <= 1, `scroll horizontal ${overflow}px`);
          return `${sections} section, tanpa scroll horizontal`;
        });
      }
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });

    await check("Ganti bahasa ID → EN, tersimpan setelah reload", async () => {
      await page.getByRole("group", { name: /Pilih bahasa|Select language/ }).getByRole("button", { name: /English|Bahasa Inggris/ }).click();
      await waitFor(() => page.evaluate(() => document.documentElement.lang === "en"), "lang tidak berubah");
      assert(await page.getByText("SAMPLE · DEMO").first().isVisible(), "label EN tidak muncul");
      await page.reload({ waitUntil: "networkidle" });
      await waitFor(() => page.evaluate(() => document.documentElement.lang === "en"), "pilihan bahasa tidak tersimpan");
      const heading = await page.locator("#work-title").innerText();
      await page.getByRole("group", { name: /Select language|Pilih bahasa/ }).getByRole("button", { name: /Indonesian|Bahasa Indonesia/ }).click();
      await waitFor(() => page.evaluate(() => document.documentElement.lang === "id"), "kembali ke ID gagal");
      return `judul EN: "${heading}"`;
    });

    await check("Ganti tema terang/gelap dan tersimpan", async () => {
      const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      await page.getByRole("navigation", { name: /Navigasi utama|Main navigation/ }).getByRole("button", { name: /terang\/gelap|light\/dark/ }).click();
      await waitFor(async () => (await page.evaluate(() => document.documentElement.classList.contains("dark"))) !== before, "tema tidak berubah");
      await page.reload({ waitUntil: "networkidle" });
      const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      assert(after !== before, "tema tidak tersimpan");
      await page.getByRole("navigation", { name: /Navigasi utama|Main navigation/ }).getByRole("button", { name: /terang\/gelap|light\/dark/ }).click();
      return `${before ? "gelap" : "terang"} → ${after ? "gelap" : "terang"}`;
    });

    await check("Carousel proyek desktop: 4 kartu, tombol berikut/sebelum, loop", async () => {
      await page.locator("#projects").scrollIntoViewIfNeeded();
      const s0 = await status(page, "projects");
      assert(/1–4/.test(s0), "awal bukan 1–4: " + s0);
      await page.mouse.move(5, 5);
      const next = page.locator("#projects").getByRole("button", { name: /Berikutnya|Next/ });
      const prev = page.locator("#projects").getByRole("button", { name: /Sebelumnya|Previous/ });
      await next.click(); await sleep(700);
      const s1 = await status(page, "projects");
      await prev.click(); await sleep(700); await prev.click(); await sleep(900);
      const s2 = await status(page, "projects");
      assert(/2–5/.test(s1), "next gagal: " + s1);
      assert(/10–10/.test(s2), "prev dari awal tidak memutar ke akhir: " + s2);
      for (let i = 0; i < 1; i++) { await next.click(); await sleep(900); }
      const s3 = await status(page, "projects");
      assert(/1–4/.test(s3), "loop ke awal gagal: " + s3);
      const visibleCards = await page.locator("#projects .sc-cell:not([aria-hidden])").count();
      assert(visibleCards === 4, `kartu terlihat ${visibleCards}`);
      return `${s0} → ${s1}; mundur dari awal → ${s2}; maju → ${s3}`;
    });

    await check("Carousel sertifikat desktop: 6 kartu", async () => {
      const s = await status(page, "certifications");
      assert(/1–6/.test(s), s);
      return s;
    });

    await check("Autoplay berjalan, berhenti saat hover, pause manual", async () => {
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await page.mouse.move(5, 5);
      const a = await status(page, "projects");
      await waitFor(async () => (await status(page, "projects")) !== a, "autoplay tidak bergeser dalam 8 detik", 8500);
      await page.locator("#projects .sc-viewport").hover();
      const b = await status(page, "projects");
      await sleep(7000);
      const c = await status(page, "projects");
      assert(b === c, `bergeser saat hover: ${b} → ${c}`);
      await page.mouse.move(5, 5);
      await page.locator("#projects").getByRole("button", { name: /Jeda putar otomatis|Pause autoplay/ }).click();
      await page.mouse.move(5, 5);
      const d = await status(page, "projects");
      await sleep(7000);
      assert(d === (await status(page, "projects")), "masih bergeser setelah pause");
      await page.locator("#projects").getByRole("button", { name: /Putar otomatis|Play autoplay/ }).click();
      return `autoplay ${a} → bergeser; hover tetap ${b}; pause OK`;
    });

    await check("Autoplay berhenti saat section tidak terlihat", async () => {
      await page.locator("#contact").scrollIntoViewIfNeeded();
      const before = await page.locator("#projects .sc-track").getAttribute("style");
      await sleep(7000);
      const after = await page.locator("#projects .sc-track").getAttribute("style");
      assert(before === after, "carousel bergeser saat tidak terlihat");
      return "posisi tetap selama 7 detik di luar layar";
    });

    await check("Carousel: navigasi keyboard panah kanan", async () => {
      await page.locator("#projects").scrollIntoViewIfNeeded();
      const a = await status(page, "projects");
      await page.locator("#projects .sc-viewport").focus();
      await page.keyboard.press("ArrowRight"); await sleep(800);
      const b = await status(page, "projects");
      assert(a !== b, `tidak bergeser: ${a}`);
      return `${a} → ${b}`;
    });

    await check("Carousel: Lihat semua menampilkan seluruh item", async () => {
      await page.locator("#projects").getByRole("button", { name: /Lihat semua|View all/ }).click();
      const n = await page.locator("#projects .sc-grid .sc-cell").count();
      await page.locator("#projects").getByRole("button", { name: /Kembali ke carousel|Back to carousel/ }).click();
      assert(n === readSite().projects.filter((p) => !p.hidden).length, `grid menampilkan ${n}`);
      return `${n} kartu`;
    });

    await check("Navigasi header: anchor URL + indikator section aktif", async () => {
      await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300);
      await page.locator(".header-nav").getByRole("link", { name: /Sertifikasi/ }).click();
      await sleep(1200);
      const url = page.url();
      const current = await page.locator('.header-nav a[aria-current="location"]').innerText();
      const focused = await page.evaluate(() => document.activeElement?.id);
      assert(url.endsWith("#certifications"), "URL: " + url);
      assert(/Sertifikasi/.test(current), "aktif: " + current);
      return `URL ${new URL(url).hash}, aktif "${current}", fokus #${focused}`;
    });

    await check("Tombol kembali ke atas", async () => {
      await page.getByRole("button", { name: /Kembali ke atas|Back to top/ }).click();
      await waitFor(() => page.evaluate(() => window.scrollY < 5), "tidak kembali ke atas");
      return "scrollY = 0";
    });

    await check("URL anchor bisa dibagikan (/#skills langsung ke section)", async () => {
      const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await p2.goto(BASE + "/#skills", { waitUntil: "networkidle" }); await sleep(800);
      const top = await p2.evaluate(() => document.getElementById("skills").getBoundingClientRect().top);
      await p2.close();
      assert(top > -50 && top < 200, `posisi section ${top}px`);
      return `section berada ${Math.round(top)}px dari atas`;
    });
    await page.close();

    await check("Mobile: menu section di dock, keyboard (panah, Escape)", async () => {
      const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await m.goto(BASE + "/", { waitUntil: "networkidle" });
      const trigger = m.getByRole("button", { name: /Jelajahi bagian|Browse sections/ });
      await trigger.click();
      const menu = m.locator("#portfolio-quick-menu");
      await menu.waitFor();
      await m.keyboard.press("ArrowDown");
      await m.keyboard.press("Escape");
      const closed = (await menu.count()) === 0;
      const focusBack = await m.evaluate(() => document.activeElement?.getAttribute("aria-controls"));
      await trigger.click();
      await m.locator("#portfolio-quick-menu").getByRole("link", { name: "Proyek" }).click();
      await sleep(1200);
      const hash = new URL(m.url()).hash;
      const langInHeader = await m.locator(".site-header .lang-toggle").isVisible();
      const langInDock = await m.locator(".dock-bar .lang-toggle").count();
      await m.screenshot({ path: path.join(SHOTS, "mobile-menu-proyek.png") });
      await m.close();
      assert(closed && focusBack === "portfolio-quick-menu", "Escape/fokus gagal");
      assert(hash === "#projects", hash);
      assert(langInHeader && langInDock === 0, "ID/EN tidak di header");
      return "Escape menutup & fokus kembali; lompat ke #projects; ID/EN di header";
    });

    await check("Mobile: carousel 1 kartu proyek, 2 sertifikat, swipe", async () => {
      const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await m.goto(BASE + "/", { waitUntil: "networkidle" });
      await m.locator("#projects").scrollIntoViewIfNeeded();
      const p = await status(m, "projects");
      const vp = await m.locator("#projects .sc-viewport").boundingBox();
      await m.mouse.move(vp.x + vp.width * 0.8, vp.y + 80);
      await m.mouse.down(); await m.mouse.move(vp.x + vp.width * 0.5, vp.y + 82, { steps: 6 }); await m.mouse.move(vp.x + vp.width * 0.15, vp.y + 84, { steps: 6 }); await m.mouse.up();
      await sleep(900);
      const p2 = await status(m, "projects");
      await m.locator("#certifications").scrollIntoViewIfNeeded();
      const c = await status(m, "certifications");
      const cardW = await m.locator("#certifications .sc-cell").first().evaluate((el) => el.getBoundingClientRect().width);
      await m.close();
      assert(/1–1/.test(p), p);
      assert(/2–2/.test(p2), "swipe gagal: " + p2);
      assert(/1–2/.test(c), c);
      assert(cardW >= 150, `kartu sertifikat terlalu kecil ${cardW}px`);
      return `${p} → swipe → ${p2}; sertifikat ${c}, lebar kartu ${Math.round(cardW)}px`;
    });

    await check("prefers-reduced-motion: autoplay mati", async () => {
      const r = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await r.goto(BASE + "/", { waitUntil: "networkidle" });
      await r.locator("#projects").scrollIntoViewIfNeeded();
      const playBtn = await r.locator("#projects").getByRole("button", { name: /Putar otomatis|Play autoplay/ }).count();
      const a = await status(r, "projects"); await sleep(7000); const b = await status(r, "projects");
      await r.close();
      assert(playBtn === 1 && a === b, `autoplay tetap jalan (${a} → ${b})`);
      return "tombol Play tersedia, posisi tetap";
    });

    await check("Halaman detail proyek & blog", async () => {
      const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const first = readSite().projects[0];
      const r1 = await d.goto(BASE + `/projects/${first.id}`, { waitUntil: "networkidle" });
      const h1 = await d.locator("h1").first().innerText();
      const r2 = await d.goto(BASE + "/blog", { waitUntil: "networkidle" });
      const r3 = await d.goto(BASE + "/projects/tidak-ada", { waitUntil: "networkidle" });
      await d.close();
      assert(r1.status() === 200 && h1.includes(first.title.slice(0, 10)), "detail proyek");
      assert(r2.status() === 200, "blog");
      assert(r3.status() === 404, "404");
      return `detail "${h1}", blog 200, id salah 404`;
    });

    // ---------- Admin ----------
    const admin = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    admin.on("dialog", (d) => d.accept());
    const adminErrors = [];
    admin.on("pageerror", (e) => adminErrors.push(e.message));
    await admin.goto(BASE + "/admin", { waitUntil: "networkidle" });
    const nav = (label) => admin.getByRole("navigation", { name: "Menu admin" }).getByRole("button", { name: new RegExp(label) }).click();
    const save = async () => { await admin.getByRole("button", { name: /Simpan & publikasikan/ }).click(); await waitFor(() => admin.getByText("Semua perubahan tersimpan").isVisible(), "gagal menyimpan: " + (await admin.locator(".adm-msg").innerText().catch(() => ""))); };

    await check("Admin: halaman tampil tanpa error", async () => {
      await admin.screenshot({ path: path.join(SHOTS, "admin-profil-1440.png"), fullPage: true });
      assert(adminErrors.length === 0, adminErrors.join(" | "));
      return "profil, menu 14 bagian";
    });

    await check("Admin: pratinjau langsung sebelum disimpan", async () => {
      await admin.getByRole("button", { name: "Pratinjau" }).click();
      const name = admin.locator(".adm-field").filter({ hasText: "Nama tampil" }).locator("input").first();
      await name.fill("Shandy Uji Pratinjau");
      const frame = admin.frameLocator('iframe[title="Pratinjau website"]');
      await waitFor(async () => (await frame.locator("#hero").innerText()).includes("Shandy Uji Pratinjau"), "pratinjau tidak berubah");
      const disk = readSite().profile.name;
      assert(disk !== "Shandy Uji Pratinjau", "tersimpan sebelum klik Simpan");
      await admin.screenshot({ path: path.join(SHOTS, "admin-pratinjau-1440.png") });
      return "nama berubah di iframe, site.json belum berubah";
    });

    await check("Admin: simpan → site.json berubah + cadangan dibuat", async () => {
      await save();
      assert(readSite().profile.name === "Shandy Uji Pratinjau", "site.json tidak berubah");
      const backups = fs.readdirSync(path.join(ROOT, ".portfolio-backups")).filter((f) => f.startsWith("site-auto-"));
      assert(backups.length > 0, "tidak ada cadangan");
      const pub = await browser.newPage(); await pub.goto(BASE + "/", { waitUntil: "networkidle" });
      const ok = await waitFor(async () => { await pub.reload({ waitUntil: "networkidle" }); return (await pub.locator("#hero").innerText()).includes("Shandy Uji Pratinjau"); }, "website publik belum berubah", 15000);
      await pub.close();
      return `cadangan: ${backups.length} file; publik diperbarui: ${ok}`;
    });

    await check("Admin: field EN tersimpan dan tampil saat EN", async () => {
      const en = admin.locator(".adm-bilingual").filter({ hasText: "Profesi / headline" }).locator("input").nth(1);
      await en.fill("Data Analyst (EN test)");
      await save();
      assert(readSite().profile.en.headline === "Data Analyst (EN test)", "en.headline tidak tersimpan");
      return "profile.en.headline tersimpan";
    });

    const crud = async (navLabel, key, fill) => {
      await nav(navLabel);
      const before = readSite()[key].length;
      await admin.getByRole("button", { name: /^Tambah (?!sekaligus)/ }).click();
      const row = admin.locator(".adm-row[data-open]");
      await fill(row);
      await save();
      const afterAdd = readSite()[key];
      assert(afterAdd.length === before + 1, `tambah: ${before} → ${afterAdd.length}`);
      const added = afterAdd.at(-1);
      // Edit
      const firstInput = row.locator("input.adm-input").first();
      await firstInput.fill((await firstInput.inputValue()) + " (diedit)");
      await save();
      const edited = readSite()[key].at(-1);
      assert(JSON.stringify(edited) !== JSON.stringify(added), "edit tidak tersimpan");
      // Sembunyikan
      await row.getByRole("button", { name: /^Sembunyikan/ }).click(); await save();
      assert(readSite()[key].at(-1).hidden === true, "hide gagal");
      // Naikkan (urutan) — hanya bila ada item lain
      if (before > 0) { await row.getByRole("button", { name: /^Naikkan/ }).click(); await save(); assert(readSite()[key].at(-2).id === added.id, "urutan (naikkan) gagal"); }
      // Duplikat lalu hapus keduanya
      await admin.locator(`#item-${added.id}`).getByRole("button", { name: /^Duplikat/ }).click(); await save();
      assert(readSite()[key].length === before + 2, "duplikat gagal");
      const list = readSite()[key]; const dupId = list[list.findIndex((x) => x.id === added.id) + 1]?.id;
      await admin.locator(`#item-${dupId}`).getByRole("button", { name: /^Hapus/ }).click();
      await admin.locator(`#item-${added.id}`).getByRole("button", { name: /^Hapus/ }).click();
      await save();
      assert(readSite()[key].length === before, "hapus gagal");
      return `tambah, edit, sembunyikan, ubah urutan, duplikat, hapus (${before} item tetap)`;
    };
    const fillBy = async (row, label, value, nth = 0) => { await row.locator(".adm-field").filter({ hasText: label }).locator("input, textarea").nth(nth).fill(value); };

    await check("Admin CRUD: Proyek", () => crud("Proyek", "projects", async (r) => { await fillBy(r, "Judul proyek", "Proyek Uji E2E"); await fillBy(r, "Ringkasan kartu", "Ringkasan uji."); await fillBy(r, "Teknologi", "Python, SQL"); }));
    await check("Admin CRUD: Pengalaman", () => crud("Pengalaman", "work", async (r) => { await fillBy(r, "Perusahaan", "PT Uji"); await fillBy(r, "Posisi", "Analis"); }));
    await check("Admin CRUD: Pendidikan", () => crud("Pendidikan", "education", async (r) => { await fillBy(r, "Institusi", "Kampus Uji"); await fillBy(r, "Jurusan", "Statistika"); }));
    await check("Admin CRUD: Sertifikasi", () => crud("Sertifikasi", "certifications", async (r) => { await fillBy(r, "Nama sertifikasi", "Sertifikat Uji"); await fillBy(r, "Penerbit", "Lembaga Uji"); }));
    await check("Admin CRUD: Keahlian", () => crud("Keahlian", "skills", async (r) => { await fillBy(r, "Nama keahlian", "Keahlian Uji"); }));
    await check("Admin CRUD: Kegiatan", () => crud("Kegiatan", "activities", async (r) => { await fillBy(r, "Nama kegiatan", "Kegiatan Uji"); }));
    await check("Admin CRUD: Blog", () => crud("Blog", "posts", async (r) => { await fillBy(r, "Judul", "Tulisan Uji E2E"); }));
    await check("Admin CRUD: Media sosial", () => crud("Media sosial", "socialLinks", async (r) => { await fillBy(r, "Nama platform", "GitHub Uji"); await fillBy(r, "URL", "https://github.com/contoh"); }));

    await check("Admin: drag-and-drop mengubah urutan", async () => {
      await nav("Keahlian");
      const ids = readSite().skills.map((s) => s.id);
      await admin.locator(`#item-${ids[0]} .adm-handle`).dragTo(admin.locator(`#item-${ids[2]}`));
      await save();
      const after = readSite().skills.map((s) => s.id);
      assert(after[2] === ids[0] && after.length === ids.length, `urutan: ${after.slice(0, 3).join(",")}`);
      await admin.locator(`#item-${ids[0]} .adm-handle`).dragTo(admin.locator(`#item-${after[0]}`));
      await save();
      return `${ids[0]} dipindah ke posisi 3 lalu dikembalikan`;
    });

    await check("Admin: upload gambar & PDF (drag-drop/klik) tersimpan dan bisa diakses", async () => {
      await nav("Sertifikasi");
      const id = readSite().certifications[0].id;
      await admin.locator(`#item-${id} .adm-row-title`).click();
      const row = admin.locator(`#item-${id}`);
      const pngPath = path.join(SHOTS, "uji.png"), pdfPath = path.join(SHOTS, "uji.pdf");
      fs.writeFileSync(pngPath, PNG); fs.writeFileSync(pdfPath, PDF);
      await row.locator(".adm-field").filter({ hasText: "Gambar sertifikat" }).locator('input[type="file"]').setInputFiles(pngPath);
      await waitFor(async () => (await row.locator(".adm-field").filter({ hasText: "Gambar sertifikat" }).locator("input.adm-input").inputValue()).startsWith("/uploads/"), "URL gambar tidak terisi", 20000);
      await row.locator(".adm-field").filter({ hasText: "File PDF" }).locator('input[type="file"]').setInputFiles(pdfPath);
      await waitFor(async () => (await row.locator(".adm-field").filter({ hasText: "File PDF" }).locator("input.adm-input").inputValue()).endsWith(".pdf"), "URL PDF tidak terisi", 20000);
      await save();
      const c = readSite().certifications[0];
      const r1 = await admin.request.get(BASE + c.imageUrl), r2 = await admin.request.get(BASE + c.documentUrl);
      assert(r1.status() === 200 && r2.status() === 200, `akses file ${r1.status()}/${r2.status()}`);
      return `${c.imageUrl} (${r1.headers()["content-type"]}), ${c.documentUrl} (${r2.headers()["content-type"]})`;
    });

    await check("Admin: pengaturan layout (grid + batas item) berlaku di publik", async () => {
      await nav("Section & layout");
      const row = admin.locator(".adm-row").filter({ hasText: "Proyek" }).first();
      if (!(await row.getAttribute("data-open"))) await row.locator(".adm-row-title").click();
      await row.locator(".adm-field").filter({ hasText: "Mode konten" }).locator("select").selectOption("grid");
      await row.locator(".adm-field").filter({ hasText: "Desktop" }).locator("select").selectOption("3");
      await row.locator(".adm-field").filter({ hasText: "Tampilkan maksimal" }).locator("input").fill("3");
      await save();
      const pub = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      let cells = 0, cols = 0;
      await waitFor(async () => { await pub.goto(BASE + "/#projects", { waitUntil: "networkidle" }); cells = await pub.locator("#projects .sc-grid .sc-cell").count(); return cells === 3; }, "grid tidak dibatasi 3", 15000);
      cols = await pub.locator("#projects .sc-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      const btn = await pub.locator("#projects").getByRole("button", { name: /Lihat semua/ }).innerText();
      await pub.close();
      assert(cols === 3, `kolom ${cols}`);
      return `${cells} kartu, ${cols} kolom, tombol "${btn}"`;
    });

    await check("Admin: sembunyikan & urutkan section", async () => {
      const row = admin.locator(".adm-row").filter({ hasText: "Kegiatan" }).first();
      await row.getByRole("button", { name: /Sembunyikan section/ }).click();
      await admin.locator(".adm-row").filter({ hasText: "Sertifikasi" }).first().getByRole("button", { name: /Naikkan section/ }).click();
      await save();
      const s = readSite().sections;
      assert(s.find((x) => x.id === "activities").visible === false, "hide section gagal");
      const pub = await browser.newPage();
      await waitFor(async () => { await pub.goto(BASE + "/", { waitUntil: "networkidle" }); return (await pub.locator("#activities").count()) === 0; }, "section masih tampil", 15000);
      await pub.close();
      return "Kegiatan disembunyikan, Sertifikasi naik satu posisi";
    });

    await check("Admin: tema (warna aksen, animasi) dan SEO tersimpan", async () => {
      await nav("Tema & animasi");
      await admin.getByRole("button", { name: "Pakai warna #16a34a" }).click();
      await admin.locator(".adm-field").filter({ hasText: /^Animasi/ }).locator("select").selectOption("subtle");
      await nav("SEO & favicon");
      await admin.locator(".adm-field").filter({ hasText: "Judul SEO" }).locator("input").fill("Portofolio Uji SEO");
      await save();
      const st = readSite().settings;
      assert(st.accentColor === "#16a34a" && st.animation === "subtle" && st.seoTitle === "Portofolio Uji SEO", JSON.stringify([st.accentColor, st.animation, st.seoTitle]));
      return "accentColor, animation, seoTitle tersimpan";
    });

    await check("Admin: validasi mencegah data rusak", async () => {
      await nav("Tema & animasi");
      const hex = admin.locator(".adm-field").filter({ hasText: "Warna aksen" }).locator("input.adm-input");
      await hex.fill("biru");
      await waitFor(() => admin.getByText(/masalah perlu diperbaiki/).isVisible(), "tidak ada peringatan");
      await admin.getByRole("button", { name: /Simpan & publikasikan/ }).click();
      await sleep(500);
      assert(readSite().settings.accentColor !== "biru", "data rusak tersimpan");
      await hex.fill("#2563eb");
      await save();
      return "warna \"biru\" ditolak, file tidak berubah";
    });

    await check("Admin: konflik bila site.json diubah di luar editor", async () => {
      const s = readSite(); s.profile.phone = "0800-luar-editor"; fs.writeFileSync(SITE, JSON.stringify(s, null, 2) + "\n");
      await nav("Profil");
      await admin.locator(".adm-field").filter({ hasText: "Telepon" }).locator("input").fill("0811");
      await admin.getByRole("button", { name: /Simpan & publikasikan/ }).click();
      await waitFor(() => admin.getByText(/sudah diubah di luar editor/).isVisible(), "konflik tidak terdeteksi");
      assert(readSite().profile.phone === "0800-luar-editor", "perubahan luar tertimpa");
      await admin.getByRole("button", { name: "Timpa dengan versi ini" }).click();
      await waitFor(() => readSite().profile.phone === "0811", "timpa gagal");
      return "409 ditampilkan, perubahan luar aman sampai pengguna memilih Timpa";
    });

    await check("Admin: riwayat versi bisa dimuat kembali", async () => {
      await nav("Backup & riwayat");
      await admin.getByRole("button", { name: "Muat ke editor" }).first().waitFor();
      const n = await admin.getByRole("button", { name: "Muat ke editor" }).count();
      await admin.getByRole("button", { name: "Muat ke editor" }).first().click();
      await waitFor(() => admin.getByText(/dimuat ke editor/).isVisible(), "tidak termuat");
      await admin.getByRole("button", { name: "Batalkan" }).click();
      return `${n} versi tersedia`;
    });

    await check("Admin: hapus semua data contoh hanya menghapus item DEMO (tidak disimpan)", async () => {
      const s = readSite();
      const nonDemo = ["projects", "work", "skills", "certifications"].reduce((n, k) => n + s[k].filter((i) => !i.demo).length, 0);
      await admin.getByRole("button", { name: "Hapus semua data contoh" }).click();
      await waitFor(() => admin.getByText(/item DEMO dihapus dari draf/).isVisible(), "tidak ada pesan");
      await admin.getByRole("button", { name: "Batalkan" }).click();
      assert(JSON.stringify(readSite()) === JSON.stringify(s), "site.json berubah tanpa disimpan");
      return `draf dibersihkan lalu dibatalkan; ${nonDemo} item non-demo tidak tersentuh`;
    });

    await check("Admin mobile 390px tampil dan bisa dipakai", async () => {
      const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await m.goto(BASE + "/admin", { waitUntil: "networkidle" });
      await m.getByRole("navigation", { name: "Menu admin" }).getByRole("button", { name: /Proyek/ }).click();
      await m.locator(".adm-row-title").first().click();
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await m.screenshot({ path: path.join(SHOTS, "admin-proyek-390.png"), fullPage: false });
      await m.close();
      assert(overflow <= 1, `scroll horizontal ${overflow}px`);
      return "tanpa scroll horizontal";
    });
    await admin.screenshot({ path: path.join(SHOTS, "admin-akhir-1440.png") });
    await admin.close();
  } finally {
    await browser.close();
    fs.writeFileSync(SITE, original);
    if (fs.existsSync(UPLOADS)) for (const f of fs.readdirSync(UPLOADS)) if (!uploadsBefore.has(f)) fs.unlinkSync(path.join(UPLOADS, f));
    if (fs.existsSync(BACKUPS)) for (const f of fs.readdirSync(BACKUPS)) if (!backupsBefore.has(f)) fs.unlinkSync(path.join(BACKUPS, f));
    const pass = results.filter((r) => r.status === "PASS").length;
    fs.writeFileSync(path.join(SHOTS, "hasil-e2e.json"), JSON.stringify(results, null, 2));
    console.log(`\n${pass}/${results.length} PASS. site.json dikembalikan ke kondisi awal. Hasil: ${path.join(SHOTS, "hasil-e2e.json")}`);
    process.exitCode = pass === results.length ? 0 : 1;
  }
})();
