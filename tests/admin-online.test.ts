import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSession, readCookie, sessionValid, SESSION_COOKIE } from "../functions/_lib/auth.ts";
import type { Env, Handler } from "../functions/_lib/http.ts";
import * as apiGate from "../functions/api/admin/_middleware.ts";
import * as pageGate from "../functions/admin/_middleware.ts";
import * as login from "../functions/api/admin/login.ts";
import * as logout from "../functions/api/admin/logout.ts";
import * as site from "../functions/api/admin/site.ts";
import * as upload from "../functions/api/admin/upload.ts";
import * as backups from "../functions/api/admin/backups.ts";
import { normalizeSite, parseSite } from "../src/lib/site-schema.ts";
import { startMockGithub, type MockGithub } from "./helpers/mock-github.ts";

const ORIGIN = "https://situs.example";
const PASSWORD = "kata-sandi-panjang-123";
const fixture = normalizeSite(JSON.parse(readFileSync(new URL("./fixtures/site-v4.json", import.meta.url), "utf8")));
const seedText = JSON.stringify(fixture, null, 2) + "\n";

const routes: Record<string, Record<string, Handler | undefined>> = {
  "/api/admin/login": { POST: login.onRequestPost },
  "/api/admin/logout": { POST: logout.onRequestPost },
  "/api/admin/site": { GET: site.onRequestGet, POST: site.onRequestPost },
  "/api/admin/upload": { POST: upload.onRequestPost },
  "/api/admin/backups": { GET: backups.onRequestGet },
};

let gh: MockGithub;
let env: Env;

type Opts = { body?: string; cookie?: string; origin?: string | null; fetchSite?: string; env?: Env };
function request(path: string, method: string, o: Opts = {}) {
  const headers: Record<string, string> = {};
  if (o.cookie) headers.cookie = `${SESSION_COOKIE}=${o.cookie}`;
  const origin = o.origin === undefined ? (method === "GET" ? null : ORIGIN) : o.origin;
  if (origin) headers.origin = origin;
  if (o.fetchSite) headers["sec-fetch-site"] = o.fetchSite;
  return new Request(`${ORIGIN}${path}`, { method, headers, body: method === "GET" ? undefined : o.body });
}
async function api(path: string, method: string, o: Opts = {}) {
  const e = o.env ?? env;
  const req = request(path, method, o);
  const route = routes[path.split("?")[0]]?.[method];
  return apiGate.onRequest({ request: req, env: e, next: async () => (route ? route({ request: req, env: e, next: async () => new Response("x") }) : new Response("Not found", { status: 404 })) });
}
const sessionOf = (res: Response) => /admin_session=([^;]*)/.exec(res.headers.get("set-cookie") ?? "")?.[1] ?? "";
const png = (extra = 0) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100 + extra, 7)]).toString("base64");

before(async () => { gh = await startMockGithub(); });
after(async () => { await gh.close(); });
beforeEach(() => {
  gh.files.clear(); gh.commits.length = 0; gh.requests.length = 0;
  gh.seed("src/data/site.json", seedText);
  env = { ADMIN_PASSWORD: PASSWORD, GITHUB_TOKEN: gh.token, GITHUB_API_URL: gh.url };
});

async function loggedIn() { return sessionOf(await api("/api/admin/login", "POST", { body: JSON.stringify({ password: PASSWORD }) })); }

describe("konfigurasi: tertutup bila belum lengkap", () => {
  test("tanpa ADMIN_PASSWORD, tanpa GITHUB_TOKEN, atau sandi terlalu pendek → 503 di semua endpoint", async () => {
    for (const bad of [{ ...env, ADMIN_PASSWORD: undefined }, { ...env, GITHUB_TOKEN: undefined }, { ...env, ADMIN_PASSWORD: "pendek" }]) {
      for (const [path, method] of [["/api/admin/site", "GET"], ["/api/admin/login", "POST"], ["/api/admin/upload", "POST"], ["/api/admin/backups", "GET"]]) {
        const res = await api(path, method, { env: bad, body: "{}" });
        assert.equal(res.status, 503, `${method} ${path}`);
      }
    }
  });
  test("sandi benar tidak berguna bila konfigurasi tidak aman", async () => {
    const res = await api("/api/admin/login", "POST", { env: { ...env, ADMIN_PASSWORD: "pendek" }, body: JSON.stringify({ password: "pendek" }) });
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("set-cookie"), null);
  });
});

describe("login dan sesi", () => {
  test("semua endpoint selain login butuh sesi", async () => {
    for (const [path, method] of [["/api/admin/site", "GET"], ["/api/admin/site", "POST"], ["/api/admin/upload", "POST"], ["/api/admin/backups", "GET"], ["/api/admin/logout", "POST"]]) {
      assert.equal((await api(path, method, { body: "{}" })).status, 401, `${method} ${path}`);
    }
    assert.equal(gh.requests.length, 0, "tidak boleh menyentuh GitHub tanpa login");
  });
  test("endpoint yang tidak dikenal di bawah /api/admin tetap butuh sesi", async () => {
    assert.equal((await api("/api/admin/rahasia", "GET")).status, 401);
  });
  test("sandi salah → 401 tanpa cookie (dan diperlambat)", async () => {
    const t = Date.now();
    const res = await api("/api/admin/login", "POST", { body: JSON.stringify({ password: "salah-salah-salah" }) });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("set-cookie"), null);
    assert.ok(Date.now() - t >= 1000, "harus ada jeda untuk percobaan gagal");
  });
  test("sandi benar → cookie HttpOnly, SameSite=Strict, Secure di https; cookie dipakai untuk akses", async () => {
    const res = await api("/api/admin/login", "POST", { body: JSON.stringify({ password: PASSWORD }) });
    assert.equal(res.status, 200);
    const cookie = res.headers.get("set-cookie") ?? "";
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/); assert.match(cookie, /Secure/); assert.match(cookie, /Path=\//);
    assert.equal((await api("/api/admin/site", "GET", { cookie: sessionOf(res) })).status, 200);
  });
  test("cookie dipalsukan, dipotong, atau dibuat dengan rahasia lain ditolak", async () => {
    const good = await loggedIn();
    const forged = good.slice(0, -2) + (good.endsWith("AA") ? "BB" : "AA");
    for (const bad of [forged, "", "x.y.z", good.split(".").slice(0, 2).join("."), await createSession({ ...env, ADMIN_PASSWORD: "sandi-lain-yang-panjang" })]) {
      assert.equal((await api("/api/admin/site", "GET", { cookie: bad })).status, 401, bad.slice(0, 20));
    }
  });
  test("sesi kedaluwarsa setelah 8 jam", async () => {
    const value = await createSession(env, Date.now());
    assert.equal(await sessionValid(env, value, Date.now() + 7 * 3600_000), true);
    assert.equal(await sessionValid(env, value, Date.now() + 9 * 3600_000), false);
  });
  test("mengganti ADMIN_PASSWORD atau GITHUB_TOKEN mengeluarkan semua sesi", async () => {
    const value = await createSession(env);
    assert.equal(await sessionValid({ ...env, GITHUB_TOKEN: "token-baru" }, value), false);
    assert.equal(await sessionValid({ ...env, ADMIN_PASSWORD: "sandi-baru-yang-panjang" }, value), false);
  });
  test("logout menghapus cookie", async () => {
    const res = await api("/api/admin/logout", "POST", { cookie: await loggedIn(), body: "{}" });
    assert.match(res.headers.get("set-cookie") ?? "", /Max-Age=0/);
  });
  test("body login tidak valid atau terlalu besar", async () => {
    assert.equal((await api("/api/admin/login", "POST", { body: "bukan json" })).status, 400);
    assert.equal((await api("/api/admin/login", "POST", { body: JSON.stringify({ password: "x".repeat(5000) }) })).status, 413);
  });
});

describe("perlindungan CSRF / origin", () => {
  test("POST tanpa Origin, Origin asing, atau Sec-Fetch-Site lintas situs ditolak walau cookie sah", async () => {
    const cookie = await loggedIn();
    const body = JSON.stringify({ data: fixture, baseRevision: "x" });
    assert.equal((await api("/api/admin/site", "POST", { cookie, body, origin: null })).status, 403);
    assert.equal((await api("/api/admin/site", "POST", { cookie, body, origin: "https://jahat.example" })).status, 403);
    assert.equal((await api("/api/admin/site", "POST", { cookie, body, fetchSite: "cross-site" })).status, 403);
    assert.equal((await api("/api/admin/site", "GET", { cookie, fetchSite: "same-site" })).status, 403);
    assert.equal((await api("/api/admin/login", "POST", { body: JSON.stringify({ password: PASSWORD }), origin: "https://jahat.example" })).status, 403);
    assert.equal(gh.commits.filter((c) => c.message !== "Seed").length, 0);
  });
});

describe("membaca dan menyimpan isi situs (commit ke GitHub)", () => {
  test("GET mengembalikan isi dari GitHub dan revisi = sha file", async () => {
    const res = await api("/api/admin/site", "GET", { cookie: await loggedIn() });
    const out = await res.json() as { data: typeof fixture; revision: string };
    assert.equal(out.revision, gh.files.get("src/data/site.json")!.sha);
    assert.equal(out.data.projects.length, fixture.projects.length);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });
  test("POST membuat satu commit berisi JSON baru dan mengembalikan revisi baru", async () => {
    const cookie = await loggedIn();
    const before = await (await api("/api/admin/site", "GET", { cookie })).json() as { data: typeof fixture; revision: string };
    const edited = { ...before.data, profile: { ...before.data.profile, name: "Shandy Contoh" } };
    const res = await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: edited, baseRevision: before.revision }) });
    assert.equal(res.status, 200);
    const out = await res.json() as { revision: string; data: typeof fixture };
    assert.notEqual(out.revision, before.revision);
    assert.equal(out.revision, gh.files.get("src/data/site.json")!.sha);
    const saved = JSON.parse(gh.files.get("src/data/site.json")!.text.toString("utf8"));
    assert.equal(saved.profile.name, "Shandy Contoh");
    assert.ok(parseSite(saved).success, "yang tersimpan harus lolos skema penuh (yang dipakai build)");
    assert.equal(saved.projects.length, fixture.projects.length, "data lain tidak hilang");
    assert.equal(gh.commits[0].message, "Admin: perbarui isi situs");
    assert.ok(!gh.commits[0].message.includes("skip ci"), "simpan isi harus memicu build");
  });
  test("revisi usang → 409 dan tidak ada commit; force=true menimpa", async () => {
    const cookie = await loggedIn();
    const cur = await (await api("/api/admin/site", "GET", { cookie })).json() as { data: typeof fixture; revision: string };
    const first = await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: cur.data, baseRevision: cur.revision }) });
    assert.equal(first.status, 200);
    const n = gh.commits.length;
    const stale = await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: cur.data, baseRevision: "0".repeat(40) }) });
    assert.equal(stale.status, 409);
    assert.equal(gh.commits.length, n);
    const forced = await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: cur.data, baseRevision: "0".repeat(40), force: true }) });
    assert.equal(forced.status, 200);
    assert.equal(gh.commits.length, n + 1);
  });
  test("tanpa baseRevision dan tanpa force ditolak", async () => {
    const res = await api("/api/admin/site", "POST", { cookie: await loggedIn(), body: JSON.stringify({ data: fixture }) });
    assert.equal(res.status, 400);
  });
  test("bentuk data rusak ditolak sebelum menyentuh GitHub", async () => {
    const cookie = await loggedIn();
    const n = gh.requests.length;
    const broken = [
      { ...fixture, profile: "bukan objek" },
      { ...fixture, projects: "bukan daftar" },
      { ...fixture, sections: undefined },
      { ...fixture, skills: [{ name: "tanpa id" }] },
    ];
    for (const data of broken) {
      const res = await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data, baseRevision: "x" }) });
      assert.equal(res.status, 400);
      assert.ok(((await res.json()) as { details: string[] }).details.length > 0);
    }
    assert.equal(gh.requests.length, n);
  });
  test("server tidak memuat skema zod (hemat CPU paket gratis); validasi penuh ada di peramban, build, dan CI", () => {
    for (const f of ["site-service.ts", "github.ts", "auth.ts", "http.ts"]) assert.ok(!/site-schema|from "zod"/.test(readFileSync(new URL(`../functions/_lib/${f}`, import.meta.url), "utf8")), f);
    for (const f of ["site", "upload", "login", "backups", "logout", "_middleware"]) assert.ok(!/site-schema|from "zod"/.test(readFileSync(new URL(`../functions/api/admin/${f}.ts`, import.meta.url), "utf8")), f);
  });
  test("field yang tidak dikenal tetap dipertahankan saat simpan", async () => {
    const cookie = await loggedIn();
    const cur = await (await api("/api/admin/site", "GET", { cookie })).json() as { data: Record<string, unknown>; revision: string };
    const withExtra = { ...cur.data, fieldMasaDepan: { a: 1 } };
    assert.equal((await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: withExtra, baseRevision: cur.revision }) })).status, 200);
    assert.deepEqual(JSON.parse(gh.files.get("src/data/site.json")!.text.toString("utf8")).fieldMasaDepan, { a: 1 });
  });
  test("body tanpa data, data bukan objek, atau JSON rusak → 400 (bukan 500)", async () => {
    const cookie = await loggedIn();
    for (const body of ["{}", JSON.stringify({ data: null, baseRevision: "x" }), JSON.stringify({ data: "teks", baseRevision: "x" }), JSON.stringify({ data: [], baseRevision: "x" }), "[1,2]", "null", "bukan json"]) {
      assert.equal((await api("/api/admin/site", "POST", { cookie, body })).status, 400, body);
    }
  });
  test("data lebih dari 2 MB ditolak", async () => {
    assert.equal((await api("/api/admin/site", "POST", { cookie: await loggedIn(), body: "x".repeat(2 * 1024 * 1024 + 1) })).status, 413);
  });
});

describe("unggah file", () => {
  test("PNG sah → commit ke public/uploads dengan [skip ci] dan nama aman", async () => {
    const res = await api("/api/admin/upload?name=" + encodeURIComponent("../../Foto Saya!.JPG"), "POST", { cookie: await loggedIn(), body: png() });
    assert.equal(res.status, 200);
    const out = await res.json() as { url: string; type: string };
    assert.match(out.url, /^\/uploads\/foto-saya-[0-9a-f]{8}\.png$/);
    assert.equal(out.type, "png");
    const path = `public${out.url}`;
    assert.ok(gh.files.has(path));
    assert.deepEqual(gh.files.get(path)!.text, Buffer.from(png(), "base64"));
    assert.match(gh.commits[0].message, /\[skip ci\]$/);
  });
  test("SVG, HTML, dan file tak dikenal → 415 tanpa commit", async () => {
    const cookie = await loggedIn();
    const n = gh.commits.length;
    for (const text of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "<!doctype html><script>1</script>", "teks biasa saja"]) {
      assert.equal((await api("/api/admin/upload?name=x.png", "POST", { cookie, body: Buffer.from(text.padEnd(40)).toString("base64") })).status, 415);
    }
    assert.equal(gh.commits.length, n);
  });
  test("terlalu besar → 413; base64 rusak atau kosong → 400", async () => {
    const cookie = await loggedIn();
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png(5 * 1024 * 1024) })).status, 413);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: "###bukan-base64###" })).status, 400);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: 'AAAA"}' })).status, 400);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: "" })).status, 400);
  });
  test("batas bawaan 2 MB; UPLOAD_MAX_MB menaikkannya (tetap maks. 8 MB)", async () => {
    const cookie = await loggedIn();
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png(3 * 1024 * 1024) })).status, 413);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png(3 * 1024 * 1024), env: { ...env, UPLOAD_MAX_MB: "4" } })).status, 200);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png(9 * 1024 * 1024), env: { ...env, UPLOAD_MAX_MB: "50" } })).status, 413);
    assert.equal((await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png(1024 * 1024) })).status, 200);
  });
  test("PDF diterima", async () => {
    const res = await api("/api/admin/upload?name=cv.pdf", "POST", { cookie: await loggedIn(), body: Buffer.from("%PDF-1.7\n".padEnd(60, "x")).toString("base64") });
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { type: string }).type, "pdf");
  });
});

describe("riwayat versi", () => {
  test("daftar hanya commit yang mengubah site.json; versi lama bisa dibuka", async () => {
    const cookie = await loggedIn();
    await api("/api/admin/upload?name=a.png", "POST", { cookie, body: png() });
    const cur = await (await api("/api/admin/site", "GET", { cookie })).json() as { data: typeof fixture; revision: string };
    const edited = { ...cur.data, profile: { ...cur.data.profile, name: "Versi Dua" } };
    await api("/api/admin/site", "POST", { cookie, body: JSON.stringify({ data: edited, baseRevision: cur.revision }) });
    const list = await (await api("/api/admin/backups", "GET", { cookie })).json() as { backups: { name: string; label: string }[] };
    assert.equal(list.backups.length, 2, "seed + satu simpan; unggahan tidak masuk riwayat");
    assert.equal(list.backups[0].label, "Admin: perbarui isi situs");
    const old = await (await api(`/api/admin/backups?name=${list.backups[1].name}`, "GET", { cookie })).json() as { data: { profile: { name: string } } };
    assert.equal(old.data.profile.name, fixture.profile.name);
  });
  test("nama versi harus berupa sha 40 heksadesimal", async () => {
    const cookie = await loggedIn();
    for (const name of ["../../etc/passwd", "main", "abc", "z".repeat(40)]) assert.equal((await api(`/api/admin/backups?name=${encodeURIComponent(name)}`, "GET", { cookie })).status, 400);
  });
});

describe("kegagalan GitHub dan kebocoran rahasia", () => {
  test("token ditolak GitHub → 502 dengan pesan jelas, tanpa membocorkan token", async () => {
    const bad = { ...env, GITHUB_TOKEN: "ghp_salah_banget_tokennya" };
    const cookie = sessionOf(await api("/api/admin/login", "POST", { env: bad, body: JSON.stringify({ password: PASSWORD }) }));
    const res = await api("/api/admin/site", "GET", { env: bad, cookie });
    assert.equal(res.status, 502);
    const text = await res.text();
    assert.match(text, /GITHUB_TOKEN ditolak/);
    assert.ok(!text.includes("ghp_salah"));
  });
  test("sandi dan token tidak pernah muncul di respons mana pun", async () => {
    const cookie = await loggedIn();
    const seen: string[] = [];
    for (const [path, method, body] of [["/api/admin/site", "GET", undefined], ["/api/admin/backups", "GET", undefined], ["/api/admin/login", "POST", JSON.stringify({ password: "salah-salah-salah" })]] as const) {
      const res = await api(path, method, { cookie, body });
      seen.push(await res.text(), [...res.headers.values()].join("|"));
    }
    for (const text of seen) { assert.ok(!text.includes(PASSWORD)); assert.ok(!text.includes(gh.token)); }
  });
  test("semua permintaan ke GitHub memakai token dari env", async () => {
    await api("/api/admin/site", "GET", { cookie: await loggedIn() });
    assert.ok(gh.requests.length > 0 && gh.requests.every((r) => r.auth === `Bearer ${gh.token}`));
  });
});

describe("halaman /admin (middleware)", () => {
  const page = (path: string, cookie?: string) => {
    const req = new Request(`${ORIGIN}${path}`, { headers: cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {} });
    return pageGate.onRequest({ request: req, env, next: async () => new Response("<html>halaman</html>", { headers: { "content-type": "text/html" } }) });
  };
  test("tanpa sesi: /admin dan subpath diarahkan ke login, halaman login tetap terbuka", async () => {
    for (const p of ["/admin", "/admin/", "/admin/index.txt", "/admin/apa-saja"]) {
      const res = await page(p);
      assert.equal(res.status, 302, p);
      assert.equal(res.headers.get("location"), "/admin/login/");
    }
    for (const p of ["/admin/login", "/admin/login/"]) assert.equal((await page(p)).status, 200, p);
  });
  test("dengan sesi: halaman admin tampil dengan header keamanan; halaman login mengarahkan ke admin", async () => {
    const cookie = await loggedIn();
    const res = await page("/admin/", cookie);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.match(res.headers.get("x-robots-tag") ?? "", /noindex/);
    assert.equal((await page("/admin/login/", cookie)).headers.get("location"), "/admin/");
  });
  test("konfigurasi belum aman: /admin selalu diarahkan ke login", async () => {
    const req = new Request(`${ORIGIN}/admin/`, { headers: { cookie: `${SESSION_COOKIE}=${await loggedIn()}` } });
    const res = await pageGate.onRequest({ request: req, env: { ...env, ADMIN_PASSWORD: undefined }, next: async () => new Response("rahasia") });
    assert.equal(res.status, 302);
  });
});

test("readCookie memilih cookie yang tepat", () => {
  const req = new Request(ORIGIN, { headers: { cookie: "a=1; admin_session=abc.def.ghi; b=2" } });
  assert.equal(readCookie(req, "admin_session"), "abc.def.ghi");
  assert.equal(readCookie(req, "c"), null);
});
