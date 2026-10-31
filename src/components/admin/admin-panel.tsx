"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, History, Loader2, LogOut, Monitor, PanelRightClose, PanelRightOpen, RotateCcw, Save, Smartphone, Tablet, Trash2, Upload } from "lucide-react";
import { COLLECTION_KEYS, parseSite, type CollectionKey, type SiteData } from "@/lib/site-schema";
import { PREVIEW_MESSAGE } from "@/components/site-provider";
import { collections, contactFields, profileFields, seoFields, type FieldDef } from "./config";
import { Field, rememberPreview, UploadLimitContext, type UploadFn } from "./fields";
import { CollectionEditor } from "./collection-editor";
import { SectionsEditor } from "./sections-editor";
import { pathKey, setAt, type Path } from "./utils";

type Tab = "profile" | CollectionKey | "sections" | "theme" | "seo" | "contact" | "data";
const NAV: { group: string; items: { key: Tab; label: string }[] }[] = [
  { group: "Konten", items: [{ key: "profile", label: "Profil & CV" }, { key: "projects", label: "Proyek" }, { key: "work", label: "Pengalaman" }, { key: "education", label: "Pendidikan" }, { key: "certifications", label: "Sertifikasi" }, { key: "skills", label: "Keahlian" }, { key: "activities", label: "Kegiatan" }, { key: "posts", label: "Blog" }, { key: "socialLinks", label: "Media sosial" }] },
  { group: "Tampilan", items: [{ key: "sections", label: "Section & layout" }, { key: "theme", label: "Tema & animasi" }, { key: "contact", label: "Teks sapaan & kontak" }] },
  { group: "Situs", items: [{ key: "seo", label: "SEO & favicon" }, { key: "data", label: "Backup & riwayat" }] },
];
const DEVICES = { desktop: { w: 1280, icon: Monitor, label: "Desktop" }, tablet: { w: 820, icon: Tablet, label: "Tablet" }, mobile: { w: 390, icon: Smartphone, label: "HP" } } as const;
type Device = keyof typeof DEVICES;
const ACCENTS = ["#2563eb", "#7c3aed", "#0d9488", "#16a34a", "#ea580c", "#e11d48", "#0f172a"];

const themeFields: FieldDef[] = [
  { key: "defaultTheme", label: "Tema awal pengunjung", kind: "select", options: [{ value: "light", label: "Terang" }, { value: "dark", label: "Gelap" }, { value: "system", label: "Ikuti perangkat" }], help: "Pengunjung tetap bisa mengganti lewat tombol di dock." },
  { key: "accentColor", label: "Warna aksen", kind: "color" },
  { key: "radius", label: "Sudut kartu", kind: "select", options: [{ value: "sharp", label: "Tegas" }, { value: "normal", label: "Normal" }, { value: "round", label: "Bulat" }] },
  { key: "animation", label: "Animasi", kind: "select", options: [{ value: "full", label: "Penuh (Magic UI blur-fade)" }, { value: "subtle", label: "Halus" }, { value: "off", label: "Mati" }], help: "Pengunjung dengan prefers-reduced-motion selalu mendapat versi tanpa animasi." },
  { key: "backgroundGrid", label: "Latar flickering grid di atas halaman", kind: "boolean" },
  { key: "contentWidth", label: "Lebar konten", kind: "select", options: [{ value: "medium", label: "Sedang (1024px)" }, { value: "wide", label: "Lebar (1280px)" }, { value: "full", label: "Sangat lebar (1600px)" }] },
  { key: "defaultLanguage", label: "Bahasa awal", kind: "select", options: [{ value: "id", label: "Bahasa Indonesia" }, { value: "en", label: "English" }] },
  { key: "languagePosition", label: "Posisi tombol ID/EN di header", kind: "select", options: [{ value: "top-right", label: "Kanan atas" }, { value: "top-left", label: "Kiri atas" }] },
  { key: "showDemoBanner", label: "Tampilkan banner peringatan data contoh", kind: "boolean", help: "Banner otomatis hilang bila tidak ada lagi item DEMO." },
];

type Msg = { kind: "ok" | "error" | "info"; text: string; action?: { label: string; run: () => void } } | null;

/** Dibaca sebagai base64 di peramban supaya server online tidak perlu menyandi file besar. */
function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("File tidak bisa dibaca"));
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel({ initialData, initialRevision, token = "", mode = "local" }: { initialData: SiteData; initialRevision: string; token?: string; mode?: "local" | "online" }) {
  const online = mode === "online";
  const [data, setData] = useState<SiteData>(initialData);
  const [saved, setSaved] = useState<SiteData>(initialData);
  const [revision, setRevision] = useState(initialRevision);
  const [tab, setTab] = useState<Tab>("profile");
  const [msg, setMsg] = useState<Msg>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const importRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved]);
  const validation = useMemo(() => parseSite(data), [data]);
  const errors = useMemo(() => {
    const map = new Map<string, string>();
    if (!validation.success) for (const issue of validation.error.issues) map.set(pathKey(issue.path as Path), issue.message);
    return map;
  }, [validation]);

  const set = useCallback((path: Path, value: unknown) => setData((d) => setAt(d, path, value)), []);
  const headers = useMemo(() => { const h: Record<string, string> = {}; if (token) h["x-admin-token"] = token; return h; }, [token]);

  const upload: UploadFn = useCallback(async (file) => {
    let res: Response;
    if (online) res = await fetch(`/api/admin/upload?name=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: await toBase64(file) });
    else { const form = new FormData(); form.append("file", file); res = await fetch("/api/admin/upload", { method: "POST", body: form, headers }); }
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error("Sesi login habis. Buka /admin/login di tab baru, login lagi, lalu ulangi unggah (perubahan di tab ini tetap aman).");
    if (!res.ok) throw new Error(json.error || `Upload gagal (${res.status})`);
    if (online) rememberPreview(json.url as string, file);
    setMsg({ kind: "info", text: online ? `${file.name} terunggah ke GitHub. Gambar baru tampil di website setelah Simpan & publikasikan selesai dibangun (1–2 menit).` : `${file.name} terunggah. Klik Simpan untuk mempublikasikan perubahan.` });
    return json.url as string;
  }, [headers, online]);

  const save = useCallback(async (force = false) => {
    if (!validation.success) { setMsg({ kind: "error", text: `Belum bisa disimpan: ${errors.size} masalah. ${[...errors.entries()].slice(0, 3).map(([p, m]) => `${p}: ${m}`).join(" · ")}` }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/site", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ data: validation.data, baseRevision: revision, force }) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { setMsg({ kind: "error", text: "Sesi login habis. Perubahanmu masih ada di halaman ini. Buka halaman login di tab baru, login lagi, lalu kembali ke sini dan klik Simpan.", action: { label: "Buka halaman login", run: () => window.open("/admin/login/", "_blank", "noopener") } }); return; }
      if (res.status === 409) { setMsg({ kind: "error", text: online ? "Isi situs di GitHub sudah berubah sejak halaman ini dibuka (tab lain, perangkat lain, atau edit langsung di GitHub). Muat ulang halaman untuk mengambil versi terbaru, atau timpa dengan versi ini." : "site.json sudah diubah di luar editor ini (tab lain atau editor teks). Muat ulang halaman untuk mengambil versi terbaru, atau timpa dengan versi ini.", action: { label: "Timpa dengan versi ini", run: () => { if (window.confirm("Timpa site.json? Versi yang sekarang tetap dicadangkan di Riwayat.")) void save(true); } } }); return; }
      if (!res.ok) throw new Error((json.error || `Gagal (${res.status})`) + (json.details ? `: ${json.details.join("; ")}` : ""));
      setSaved(json.data); setData(json.data); setRevision(json.revision);
      setMsg({ kind: "ok", text: online ? `Terkirim ke GitHub pukul ${new Date().toLocaleTimeString("id-ID")}. Cloudflare sedang membangun ulang; website online berubah sekitar 1–2 menit lagi. Versi sebelumnya ada di Riwayat.` : `Tersimpan ke src/data/site.json pukul ${new Date().toLocaleTimeString("id-ID")}. Versi sebelumnya dicadangkan.` });
    } catch (e) { setMsg({ kind: "error", text: e instanceof Error ? e.message : "Gagal menyimpan" }); }
    finally { setSaving(false); }
  }, [validation, errors, revision, headers, online]);

  // Ctrl/Cmd+S untuk simpan, dan peringatan sebelum menutup tab bila ada perubahan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); } };
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("keydown", onKey); window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onUnload); };
  }, [save, dirty]);

  // Pratinjau: kirim draf ke iframe setiap kali berubah (dibatasi 250 ms).
  const postPreview = useCallback(() => { iframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, data }, window.location.origin); }, [data]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}-ready`) postPreview(); };
    window.addEventListener("message", onMessage); return () => window.removeEventListener("message", onMessage);
  }, [postPreview]);
  useEffect(() => { if (!previewOpen) return; const t = window.setTimeout(postPreview, 250); return () => window.clearTimeout(t); }, [previewOpen, postPreview]);

  const demoCounts = COLLECTION_KEYS.map((k) => [k, (data[k] as { demo?: boolean }[]).filter((i) => i.demo).length] as const).filter(([, n]) => n > 0);
  function removeDemo() {
    const total = demoCounts.reduce((s, [, n]) => s + n, 0);
    if (!total) { setMsg({ kind: "info", text: "Tidak ada item DEMO." }); return; }
    const list = demoCounts.map(([k, n]) => `${collections[k].title}: ${n}`).join("\n");
    if (!window.confirm(`Hapus ${total} item berlabel DEMO?\n\n${list}\n\nItem tanpa label DEMO tidak disentuh. Perubahan baru tersimpan setelah klik Simpan.`)) return;
    let next = data;
    for (const k of COLLECTION_KEYS) next = setAt(next, [k], (next[k] as { demo?: boolean }[]).filter((i) => !i.demo));
    setData(next); setMsg({ kind: "info", text: `${total} item DEMO dihapus dari draf. Tinjau lalu klik Simpan.` });
  }
  function exportJSON() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  async function importJSON(file?: File) {
    if (!file) return;
    try {
      const parsed = parseSite(JSON.parse(await file.text()));
      if (!parsed.success) throw new Error(parsed.error.issues.slice(0, 3).map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
      setData(parsed.data); setMsg({ kind: "info", text: "Backup dibaca (format lama otomatis dilengkapi). Tinjau lalu klik Simpan untuk menerapkan." });
    } catch (e) { setMsg({ kind: "error", text: "Import gagal: " + (e instanceof Error ? e.message : "file rusak") }); }
    finally { if (importRef.current) importRef.current.value = ""; }
  }

  const count = (k: Tab) => (COLLECTION_KEYS as readonly string[]).includes(k) ? (data[k as CollectionKey] as unknown[]).length : null;
  const tabErrors = (k: Tab) => {
    const prefixes = k === "profile" ? ["profile"] : k === "theme" || k === "seo" || k === "contact" ? ["settings", ...(k === "seo" ? ["profile.siteUrl"] : [])] : [k];
    return [...errors.keys()].filter((p) => prefixes.some((x) => p === x || p.startsWith(`${x}.`))).length;
  };

  const profileSet = (f: FieldDef) => <Field key={f.key} field={f} value={(data.profile as Record<string, unknown>)[f.key]} enValue={data.profile.en?.[f.key]} upload={upload} error={errors.get(`profile.${f.key}`)} onChange={(v) => set(["profile", f.key], v)} onEnChange={(v) => set(["profile", "en", f.key], v)} />;
  const settingSet = (f: FieldDef) => <Field key={f.key} field={f} value={(data.settings as Record<string, unknown>)[f.key]} enValue={data.settings.en?.[f.key]} upload={upload} error={errors.get(`settings.${f.key}`)} onChange={(v) => set(["settings", f.key], v)} onEnChange={(v) => set(["settings", "en", f.key], v)} />;

  let content: ReactNode;
  if ((COLLECTION_KEYS as readonly string[]).includes(tab)) content = <CollectionEditor key={tab} k={tab as CollectionKey} data={data} upload={upload} errors={errors} onChange={(items) => set([tab], items)} />;
  else if (tab === "profile") content = <Panel title="Profil & CV" caption="Identitas utama di hero, CV, dan kontak."><div className="adm-grid">{profileFields.map(profileSet)}</div></Panel>;
  else if (tab === "sections") content = <SectionsEditor data={data} onChange={(s) => set(["sections"], s)} />;
  else if (tab === "theme") content = <Panel title="Tema & animasi" caption="Warna, mode terang/gelap, animasi, dan lebar layout.">
    <div className="adm-grid">{themeFields.map(settingSet)}</div>
    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Warna cepat:</span>{ACCENTS.map((c) => <button key={c} type="button" className="adm-swatch" style={{ background: c }} aria-label={`Pakai warna ${c}`} aria-pressed={data.settings.accentColor === c} onClick={() => set(["settings", "accentColor"], c)} />)}</div>
  </Panel>;
  else if (tab === "contact") content = <Panel title="Teks sapaan & kontak" caption="Kalimat pembuka di hero dan ajakan di section Kontak."><div className="adm-grid">{contactFields.map(settingSet)}</div></Panel>;
  else if (tab === "seo") content = <Panel title="SEO & favicon" caption="Judul dan deskripsi untuk Google dan media sosial. Berlaku setelah build/deploy ulang.">
    <div className="adm-grid">{profileSet({ key: "siteUrl", label: "Alamat situs publik", kind: "url", wide: true, placeholder: "https://nama.pages.dev", help: "Dipakai untuk canonical URL, sitemap.xml, dan Open Graph." })}{seoFields.map(settingSet)}</div>
  </Panel>;
  else content = <DataPanel online={online} headers={headers} onLoad={(d, name) => { setData(d); setMsg({ kind: "info", text: `Versi ${name} dimuat ke editor. Tinjau lalu klik Simpan untuk memulihkannya.` }); }} onExport={exportJSON} onImport={() => importRef.current?.click()} onRemoveDemo={removeDemo} demoCounts={demoCounts.map(([k, n]) => `${collections[k].title} ${n}`)} />;

  const scale = useFitScale(DEVICES[device].w, previewOpen);

  return <UploadLimitContext.Provider value={online ? 2 : 8}><div className="portfolio-admin" data-preview={previewOpen || undefined}>
    <header className="adm-topbar">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Portfolio Studio · {online ? "Admin online" : "Admin lokal"}</p>
        <p className="flex items-center gap-1.5 text-sm font-medium" role="status" aria-live="polite">
          {saving ? <><Loader2 className="size-4 animate-spin" aria-hidden />Menyimpan…</> : errors.size ? <><AlertTriangle className="size-4 text-amber-500" aria-hidden />{errors.size} masalah perlu diperbaiki</> : dirty ? <><span className="size-2 rounded-full bg-amber-500" aria-hidden />Ada perubahan belum disimpan</> : <><CheckCircle2 className="size-4 text-emerald-500" aria-hidden />Semua perubahan tersimpan</>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="adm-btn" onClick={() => setPreviewOpen((v) => !v)} aria-pressed={previewOpen}>{previewOpen ? <PanelRightClose className="size-4" aria-hidden /> : <PanelRightOpen className="size-4" aria-hidden />}Pratinjau</button>
        <button type="button" className="adm-btn" aria-label="Batalkan" title="Batalkan perubahan yang belum disimpan" onClick={() => { if (window.confirm("Buang semua perubahan yang belum disimpan?")) { setData(saved); setMsg(null); } }} disabled={!dirty || saving}><RotateCcw className="size-4" aria-hidden /><span className="adm-btn-label">Batalkan</span></button>
        <a className="adm-btn" aria-label="Website" title="Buka website di tab baru" href="/" target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" aria-hidden /><span className="adm-btn-label">Website</span></a>
        {online && <button type="button" className="adm-btn" aria-label="Keluar" title="Keluar dari admin" onClick={() => { if (dirty && !window.confirm("Ada perubahan yang belum disimpan. Tetap keluar?")) return; void fetch("/api/admin/logout", { method: "POST" }).finally(() => window.location.assign("/admin/login/")); }}><LogOut className="size-4" aria-hidden /><span className="adm-btn-label">Keluar</span></button>}
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => void save()} disabled={saving || !dirty} title="Ctrl+S"><Save className="size-4" aria-hidden />{dirty ? "Simpan & publikasikan" : "Tersimpan"}</button>
      </div>
      <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(e) => void importJSON(e.target.files?.[0])} />
    </header>
    {msg && <div className={`adm-msg adm-msg-${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}><span className="min-w-0 flex-1 wrap-break-word">{msg.text}</span>{msg.action && <button type="button" className="adm-btn adm-btn-sm" onClick={msg.action.run}>{msg.action.label}</button>}<button type="button" className="adm-btn adm-btn-sm" onClick={() => setMsg(null)} aria-label="Tutup pesan">×</button></div>}

    <div className="adm-layout">
      <nav aria-label="Menu admin" className="adm-nav">
        {NAV.map((g) => <div key={g.group} className="adm-nav-group"><p>{g.group}</p>{g.items.map((it) => { const c = count(it.key); const e = tabErrors(it.key); return <button key={it.key} type="button" onClick={() => setTab(it.key)} aria-current={tab === it.key ? "page" : undefined}><span>{it.label}</span>{e > 0 ? <span className="adm-badge adm-badge-error">{e}</span> : c !== null ? <span className="text-xs opacity-60">{c}</span> : null}</button>; })}</div>)}
      </nav>
      <div className="adm-main">{content}</div>
      {previewOpen && <aside className="adm-preview" aria-label="Pratinjau website">
        <div className="flex items-center justify-between gap-2 border-b p-2">
          <div className="flex gap-1" role="group" aria-label="Ukuran pratinjau">{(Object.keys(DEVICES) as Device[]).map((d) => { const I = DEVICES[d].icon; return <button key={d} type="button" className="adm-icon" aria-pressed={device === d} aria-label={DEVICES[d].label} title={`${DEVICES[d].label} (${DEVICES[d].w}px)`} onClick={() => setDevice(d)}><I className="size-4" aria-hidden /></button>; })}</div>
          <span className="text-xs text-muted-foreground">{DEVICES[device].w}px · draf, belum disimpan</span>
          <button type="button" className="adm-icon" onClick={() => setPreviewOpen(false)} aria-label="Tutup pratinjau"><PanelRightClose className="size-4" aria-hidden /></button>
        </div>
        <div className="adm-preview-stage" ref={scale.ref}>
          <iframe ref={iframeRef} title="Pratinjau website" src="/?preview=1" style={{ width: DEVICES[device].w, height: scale.height / scale.value, transform: `scale(${scale.value})` }} />
        </div>
      </aside>}
    </div>
  </div></UploadLimitContext.Provider>;
}

function useFitScale(width: number, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el || !active) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el); return () => ro.disconnect();
  }, [active]);
  return { ref, value: size.w ? Math.min(1, size.w / width) : 1, height: size.h || 800 };
}

function Panel({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return <div className="space-y-5"><div><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{caption}</p></div>{children}</div>;
}

function DataPanel({ online, headers, onLoad, onExport, onImport, onRemoveDemo, demoCounts }: { online: boolean; headers: Record<string, string>; onLoad: (d: SiteData, name: string) => void; onExport: () => void; onImport: () => void; onRemoveDemo: () => void; demoCounts: string[] }) {
  const [backups, setBackups] = useState<{ name: string; size?: number; time: string; label?: string }[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const res = await fetch("/api/admin/backups", { headers }); const json = await res.json(); if (!res.ok) throw new Error(json.error); setBackups(json.backups); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat riwayat"); }
  }, [headers]);
  useEffect(() => { void load(); }, [load]);
  async function open(name: string) {
    try {
      const res = await fetch(`/api/admin/backups?name=${encodeURIComponent(name)}`, { headers }); const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const parsed = parseSite(json.data); if (!parsed.success) throw new Error("Cadangan tidak valid untuk skema saat ini");
      onLoad(parsed.data, name);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuka cadangan"); }
  }
  return <Panel title="Backup & riwayat" caption={online ? "Setiap penyimpanan adalah satu commit di GitHub. Daftar ini menampilkan 30 versi terakhir dari src/data/site.json." : "Setiap kali menyimpan, versi sebelumnya disalin ke folder .portfolio-backups (30 versi terakhir)."}>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="adm-btn" onClick={onExport}><Download className="size-4" aria-hidden />Unduh backup JSON</button>
      <button type="button" className="adm-btn" onClick={onImport}><Upload className="size-4" aria-hidden />Import backup JSON</button>
      <button type="button" className="adm-btn adm-btn-danger" onClick={onRemoveDemo}><Trash2 className="size-4" aria-hidden />Hapus semua data contoh</button>
    </div>
    <p className="text-xs text-muted-foreground">Data contoh saat ini: {demoCounts.length ? demoCounts.join(", ") : "tidak ada"}.</p>
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 font-semibold"><History className="size-4" aria-hidden />Riwayat versi</h3>
      {error && <p className="adm-error">{error}</p>}
      {backups === null ? <p className="text-sm text-muted-foreground">Memuat…</p> : backups.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada riwayat. Riwayat dibuat otomatis saat menyimpan.</p> :
        <ul className="divide-y rounded-xl border">{backups.map((b) => <li key={b.name} className="flex items-center justify-between gap-2 p-3 text-sm"><span className="min-w-0"><span className="block truncate font-mono text-xs">{b.label ? `${b.name.slice(0, 7)} · ${b.label}` : b.name}</span><span className="text-xs text-muted-foreground">{new Date(b.time).toLocaleString("id-ID")}{b.size !== undefined ? ` · ${(b.size / 1024).toFixed(1)} KB` : ""}</span></span><button type="button" className="adm-btn adm-btn-sm" onClick={() => void open(b.name)}>Muat ke editor</button></li>)}</ul>}
    </div>
  </Panel>;
}
