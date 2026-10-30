"use client";

import { useRef, useState } from "react";
import type { CollectionKey, SiteData } from "@/lib/site-schema";
import { siteSchema } from "@/lib/site-schema";
import { ArrowDown, ArrowUp, Download, ExternalLink, FileUp, Plus, Save, Trash2, X } from "lucide-react";

type Field = { key: string; label: string; kind?: "textarea" | "url" | "select" | "tags" | "upload"; options?: string[]; placeholder?: string };
const configs: Record<CollectionKey, { title: string; fields: Field[]; template: Record<string, unknown>; caption: string }> = {
  socialLinks: { title: "Sosial & kontak", caption: "Link ikon di dock bawah halaman", fields: [
    { key: "label", label: "Nama platform" }, { key: "href", label: "URL", kind: "url" }, { key: "icon", label: "Ikon", kind: "select", options: ["github", "linkedin", "twitter", "instagram", "youtube", "globe", "mail", "external"] }, { key: "dock", label: "Tampilkan di dock", kind: "select", options: ["true", "false"] },
  ], template: { label: "GitHub", href: "", icon: "github", dock: true } },
  skills: { title: "Keahlian", caption: "Kemampuan dan teknologi", fields: [{ key: "name", label: "Skill" }], template: { name: "" } },
  work: { title: "Pengalaman & magang", caption: "Bisa dibedakan magang, pekerjaan, freelance dan organisasi", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "company", label: "Perusahaan / organisasi" }, { key: "title", label: "Posisi" }, { key: "type", label: "Kategori", kind: "select", options: ["Internship", "Work", "Freelance", "Organization", "Other"] }, { key: "location", label: "Lokasi" }, { key: "start", label: "Mulai" }, { key: "end", label: "Selesai (boleh kosong)" }, { key: "description", label: "Deskripsi / pencapaian", kind: "textarea" }, { key: "href", label: "Website perusahaan", kind: "url" }, { key: "logoUrl", label: "Logo", kind: "upload" },
  ], template: { demo: false, company: "", title: "", type: "Internship", location: "", start: "", end: "", description: "", href: "", logoUrl: "" } },
  education: { title: "Pendidikan", caption: "Riwayat pendidikan", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "school", label: "Institusi" }, { key: "degree", label: "Jurusan / gelar" }, { key: "start", label: "Mulai" }, { key: "end", label: "Selesai" }, { key: "href", label: "URL institusi", kind: "url" }, { key: "logoUrl", label: "Logo", kind: "upload" },
  ], template: { demo: false, school: "", degree: "", start: "", end: "", href: "", logoUrl: "" } },
  projects: { title: "Proyek", caption: "Semua proyek otomatis muncul di website setelah disimpan.", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "title", label: "Judul proyek" }, { key: "description", label: "Masalah, pendekatan, hasil", kind: "textarea" }, { key: "dates", label: "Periode" }, { key: "technologies", label: "Teknologi (pisahkan dengan koma)", kind: "tags" }, { key: "href", label: "Demo live", kind: "url" }, { key: "repoUrl", label: "GitHub repo", kind: "url" }, { key: "image", label: "Gambar proyek", kind: "upload" }, { key: "video", label: "Video URL", kind: "url" }, { key: "evaluationUrl", label: "Evaluasi / metrik / laporan", kind: "url" }, { key: "limitations", label: "Limitations / batas klaim", kind: "textarea" }, 
  ], template: { demo: false, title: "", description: "", dates: "", technologies: [], href: "", repoUrl: "", image: "", video: "", evaluationUrl: "", limitations: "" } },
  certifications: { title: "Sertifikat", caption: "Unggah foto/PDF dan link verifikasi", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "title", label: "Nama sertifikasi" }, { key: "issuer", label: "Penerbit" }, { key: "issued", label: "Tanggal terbit" }, { key: "credentialId", label: "Credential ID" }, { key: "credentialUrl", label: "URL verifikasi", kind: "url" }, { key: "imageUrl", label: "Gambar sertifikat", kind: "upload" }, { key: "documentUrl", label: "PDF sertifikat", kind: "upload" },
  ], template: { demo: false, title: "", issuer: "", issued: "", credentialId: "", credentialUrl: "", imageUrl: "", documentUrl: "" } },
  activities: { title: "Kegiatan", caption: "Komunitas, hackathon, kompetisi, organisasi", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "title", label: "Nama kegiatan" }, { key: "dates", label: "Tanggal" }, { key: "location", label: "Lokasi" }, { key: "description", label: "Cerita / hasil", kind: "textarea" }, { key: "image", label: "Gambar", kind: "upload" }, { key: "href", label: "Link dokumentasi", kind: "url" },
  ], template: { demo: false, title: "", dates: "", location: "", description: "", image: "", href: "" } },
  posts: { title: "Blog", caption: "Tulisan Markdown, simpan sebagai draft atau published", fields: [
    { key: "demo", label: "Konten contoh (DEMO)", kind: "select", options: ["false", "true"] },
    { key: "title", label: "Judul" }, { key: "slug", label: "Slug (huruf kecil/angka/tanda -)" }, { key: "date", label: "Tanggal (YYYY-MM-DD)" }, { key: "description", label: "Ringkasan", kind: "textarea" }, { key: "content", label: "Isi Markdown", kind: "textarea" }, { key: "status", label: "Status", kind: "select", options: ["draft", "published"] },
  ], template: { demo: false, title: "", slug: "", date: new Date().toISOString().slice(0, 10), description: "", content: "", status: "draft" } },
};

const nav: { key: "profile" | "sections" | CollectionKey; label: string }[] = [
  { key: "profile", label: "Profil & pengaturan" }, { key: "sections", label: "Tampilan & urutan" }, { key: "projects", label: "Proyek" }, { key: "work", label: "Magang & kerja" }, { key: "certifications", label: "Sertifikat" }, { key: "education", label: "Pendidikan" }, { key: "skills", label: "Skill" }, { key: "activities", label: "Kegiatan" }, { key: "posts", label: "Blog" }, { key: "socialLinks", label: "Sosial" },
];
const profileFields: Field[] = [
  { key: "name", label: "Nama tampil" }, { key: "headline", label: "Profesi / headline" }, { key: "description", label: "Deskripsi singkat", kind: "textarea" }, { key: "summary", label: "Tentang saya (Markdown)", kind: "textarea" }, { key: "location", label: "Lokasi" }, { key: "locationUrl", label: "Link lokasi", kind: "url" }, { key: "avatarUrl", label: "Foto profil", kind: "upload" }, { key: "cvUrl", label: "CV / resume PDF", kind: "upload" }, { key: "email", label: "Email" }, { key: "phone", label: "Telepon" }, { key: "siteUrl", label: "Alamat situs publik (untuk SEO)", kind: "url" },
];
function TagsInput({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
 const [raw, setRaw] = useState(value.join(", "));
 return <input className={inputClass} value={raw} onChange={(e) => { setRaw(e.target.value); onChange(e.target.value.split(",").map(s=>s.trim()).filter(Boolean)); }} placeholder="Python, React, SQL" />;
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const secondary = "rounded-lg border border-border px-3 py-2 text-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

export default function AdminPanel({ initialData }: { initialData: SiteData }) {
  const [data, setData] = useState<SiteData>(() => structuredClone(initialData));
  const [tab, setTab] = useState<typeof nav[number]["key"]>("profile");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function update(next: SiteData) { setData(next); setDirty(true); setMessage(""); }
  function setProfile(key: string, value: string) { update({ ...data, profile: { ...data.profile, [key]: value } }); }
  function setProfileEn(key: string, value: string) { update({ ...data, profile: { ...data.profile, en: { ...data.profile.en, [key]: value } } }); }
  function setSettingEn(key: string, value: string) { update({ ...data, settings: { ...data.settings, en: { ...data.settings.en, [key]: value } } }); }
  function setSectionEn(index: number, key: string, value: string) { setSection(index, { en: { ...data.sections[index].en, [key]: value } }); }
  function setSetting<K extends keyof SiteData["settings"]>(key: K, value: SiteData["settings"][K]) { update({ ...data, settings: { ...data.settings, [key]: value } }); }
  function setSection(index: number, patch: Partial<SiteData["sections"][number]>) { update({ ...data, sections: data.sections.map((s, i) => i === index ? { ...s, ...patch } : s) }); }
  function moveSection(index: number, delta: number) { const arr = [...data.sections]; const target = index + delta; if (target < 0 || target >= arr.length) return; [arr[index], arr[target]] = [arr[target], arr[index]]; update({ ...data, sections: arr }); }
  function moveEntry(key: CollectionKey, index: number, delta: number) { const arr = [...data[key]]; const target = index + delta; if (target < 0 || target >= arr.length) return; [arr[index], arr[target]] = [arr[target], arr[index]]; update({ ...data, [key]: arr } as SiteData); }
  function deleteEntry(key: CollectionKey, index: number) { if (!window.confirm("Hapus item ini?")) return; update({ ...data, [key]: data[key].filter((_, i) => i !== index) } as SiteData); if (editing === index) { setEditing(null); setDraft(null); } }
  function editEntry(key: CollectionKey, index: number) { setEditing(index); setDraft(index === -1 ? { id: crypto.randomUUID(), ...configs[key].template } : { ...data[key][index] }); }
  function applyEntry(key: CollectionKey) {
    if (!draft) return;
    const items = [...data[key]];
    if (editing === -1) items.push(draft as never);
    else if (editing !== null) items[editing] = draft as never;
    update({ ...data, [key]: items } as SiteData);
    setEditing(null); setDraft(null);
  }
  async function save() {
    const valid = siteSchema.safeParse(data);
    if (!valid.success) { setMessage("Periksa data: " + valid.error.issues.slice(0, 3).map((v) => `${v.path.join(".")}: ${v.message}`).join("; ")); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid.data) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error + (json.details ? ": " + json.details.join("; ") : ""));
      setDirty(false); setMessage("Tersimpan ke src/data/site.json. Tampilan publik dapat di-refresh.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Gagal menyimpan"); }
    finally { setSaving(false); }
  }
  async function upload(file: File, onUploaded: (url: string) => void) {
    const form = new FormData(); form.append("file", file);
    setMessage("Mengunggah " + file.name + "...");
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      onUploaded(result.url); setMessage("Upload berhasil. Klik Simpan perubahan untuk menyimpan link file.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Upload gagal"); }
  }
  function downloadJSON() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "portfolio-backup.json"; a.click(); URL.revokeObjectURL(url);
  }
  async function importJSON(file?: File) {
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported.sections?.some((s: { id: string }) => s.id === "hero")) imported.sections = [{ id: "hero", title: "Profil utama", subtitle: "", visible: true, layout: "list", columns: 1 }, ...imported.sections];
      const parsed = siteSchema.safeParse(imported);
      if (!parsed.success) throw new Error(parsed.error.issues.slice(0, 3).map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
      update(parsed.data); setMessage("Backup berhasil dibaca. Klik Simpan perubahan untuk menerapkan.");
    } catch (e) { setMessage("Import gagal: " + (e instanceof Error ? e.message : "File rusak")); }
  }
  const translatableKeys = new Set(["headline", "description", "summary", "location", "title", "subtitle", "company", "degree", "school", "name", "dates", "start", "end", "issuer", "content", "label"]);
  function renderLocalizedField(field: Field, value: unknown, onChange: (value: string | boolean | string[]) => void, enValue: string, onEnChange: (value: string) => void) {
    return <div className="space-y-2">{renderField(field, value, onChange)}
      {translatableKeys.has(field.key) && field.kind !== "upload" && <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">{field.label} — English (opsional)
        {field.kind === "textarea" ? <textarea className={inputClass} rows={3} value={enValue} onChange={(e) => onEnChange(e.target.value)} placeholder="Terjemahan bahasa Inggris; kosong = teks Indonesia" /> : <input className={inputClass} value={enValue} onChange={(e) => onEnChange(e.target.value)} placeholder="English translation (optional)" />}
      </label>}
    </div>;
  }
  function renderField(field: Field, value: unknown, onChange: (value: string | boolean | string[]) => void) {
    const val = Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? String(value) : String(value ?? "");
    return <label key={field.key} className="flex flex-col gap-1.5 text-sm font-medium">{field.label}
      {field.kind === "tags" ? <TagsInput key={String(draft?.id ?? "profile") + field.key} value={Array.isArray(value) ? value as string[] : []} onChange={onChange} />
      : field.kind === "select" ? <select value={val} className={inputClass} onChange={(e) => onChange(e.target.value === "true" ? true : e.target.value === "false" ? false : e.target.value)}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      : field.kind === "textarea" ? <textarea value={val} rows={field.key === "content" ? 12 : 4} className={inputClass} onChange={(e) => onChange(e.target.value)} />
      : <input value={val} type={field.kind === "url" || field.kind === "upload" ? "text" : "text"} className={inputClass} placeholder={field.placeholder || (field.kind === "upload" ? "URL atau unggah file di bawah" : undefined)} onChange={(e) => onChange(field.kind === "tags" ? e.target.value.split(",").map((v) => v.trim()).filter(Boolean) : e.target.value)} />}
      {field.kind === "upload" && <span className="text-xs font-normal text-muted-foreground"><input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" className="w-full text-xs" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file, onChange); }} />PNG/JPG/WebP/PDF, maks. 8 MB (favicon: gambar saja)</span>}
    </label>;
  }
  return <div className="portfolio-admin min-h-dvh space-y-6 pb-14">
    <header className="rounded-2xl border bg-card/90 p-5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio Studio · Local Edition</p><h1 className="text-2xl font-bold tracking-tight">Admin portofolio</h1><p className="text-xs text-muted-foreground">Editor lokal • ID + EN • Auto Carousel • Mode demo • Tanpa database</p></div><a href="/" target="_blank" rel="noopener noreferrer" className={secondary}>Lihat website <ExternalLink className="inline size-4" /></a></div>
      <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40" onClick={save} disabled={saving || !dirty}><Save className="inline size-4 mr-1" />{saving ? "Menyimpan..." : dirty ? "Simpan perubahan *" : "Sudah tersimpan"}</button><button className={secondary} onClick={downloadJSON}><Download className="inline size-4 mr-1" />Backup JSON</button><button className={secondary} onClick={() => importRef.current?.click()}><FileUp className="inline size-4 mr-1" />Import JSON</button><input hidden type="file" accept="application/json,.json" ref={importRef} onChange={(e) => void importJSON(e.target.files?.[0])} /></div>
      {message && <p role="status" className="rounded-lg border bg-muted p-3 text-sm wrap-break-word">{message}</p>}
      <p className="text-xs text-muted-foreground">Perubahan tersimpan ke source laptop ini. Untuk publikasi di hosting, commit dan push ke GitHub (lihat PANDUAN-ADMIN.md). /admin tidak tersedia pada build production.</p>
    </header>
    <div className="grid gap-5 md:grid-cols-[185px_1fr]">
      <nav aria-label="Menu admin" className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible md:items-stretch">{nav.map((item) => <button key={item.key} onClick={() => { setTab(item.key); setEditing(null); setDraft(null); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${tab === item.key ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>{item.label}{item.key !== "profile" && item.key !== "sections" ? <span className="ml-1.5 text-xs opacity-60">{data[item.key].length}</span> : null}</button>)}</nav>
      <div className="min-w-0 rounded-2xl border bg-card p-5 space-y-5">
        {tab === "profile" && <><div><h2 className="text-xl font-semibold">Profil</h2><p className="text-sm text-muted-foreground">Semua identitas, CV, dan SEO dasar</p></div><div className="grid gap-4 sm:grid-cols-2">{profileFields.map((f) => <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>{renderLocalizedField(f, data.profile[f.key as keyof SiteData["profile"]], (v) => setProfile(f.key, String(v)), data.profile.en?.[f.key] ?? "", (v) => setProfileEn(f.key, v))}</div>)}</div><hr/><h3 className="font-semibold">Pengaturan singkat</h3><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Sapaan<input className={inputClass} value={data.settings.introGreeting} onChange={(e) => setSetting("introGreeting", e.target.value)} /></label><label className="text-sm">Warna aksen<input type="color" className="block h-10 w-24 cursor-pointer" value={data.settings.accentColor} onChange={(e) => setSetting("accentColor", e.target.value)} /></label><label className="text-sm">Judul kontak<input className={inputClass} value={data.settings.contactHeading} onChange={(e) => setSetting("contactHeading", e.target.value)} /></label><label className="text-sm sm:col-span-2">Teks kontak<textarea className={inputClass} rows={3} value={data.settings.contactText} onChange={(e) => setSetting("contactText", e.target.value)} /></label><label className="text-sm sm:col-span-2">Sapaan — English<input className={inputClass} value={data.settings.en?.introGreeting ?? ""} onChange={(e) => setSettingEn("introGreeting", e.target.value)} /></label><label className="text-sm sm:col-span-2">Judul kontak — English<input className={inputClass} value={data.settings.en?.contactHeading ?? ""} onChange={(e) => setSettingEn("contactHeading", e.target.value)} /></label><label className="text-sm sm:col-span-2">Teks kontak — English<textarea className={inputClass} rows={3} value={data.settings.en?.contactText ?? ""} onChange={(e) => setSettingEn("contactText", e.target.value)} /></label><div className="sm:col-span-2 rounded-xl border bg-muted/25 p-4 space-y-4"><h3 className="font-semibold">Identitas & layout global</h3><div>{renderField({ key: "faviconUrl", label: "Favicon website (disarankan PNG persegi 64×64)", kind: "upload", placeholder: "Unggah favicon PNG atau masukkan URL" }, data.settings.faviconUrl, (v) => setSetting("faviconUrl", String(v)))}{data.settings.faviconUrl && <img src={data.settings.faviconUrl} alt="Pratinjau favicon" className="mt-3 size-12 rounded-lg border object-contain bg-white p-1"/>}</div><div className="grid sm:grid-cols-2 gap-3"><label className="flex flex-col gap-1 text-sm">Lebar halaman publik<select className={inputClass} value={data.settings.contentWidth} onChange={e => setSetting("contentWidth", e.target.value as SiteData["settings"]["contentWidth"])}><option value="medium">Sedang (960px)</option><option value="wide">Lebar (1280px) — direkomendasikan</option><option value="full">Sangat lebar (1600px)</option></select></label><label className="flex flex-col gap-1 text-sm">Posisi tombol ID / EN<select className={inputClass} value={data.settings.languagePosition} onChange={e => setSetting("languagePosition", e.target.value as SiteData["settings"]["languagePosition"])}><option value="top-right">Pojok kanan atas</option><option value="top-left">Pojok kiri atas</option></select></label></div></div><p className="text-xs text-muted-foreground sm:col-span-2">Tema terang/gelap tersedia di navigasi bawah. Bahasa ID/EN ada di pojok atas. Semua kartu dan kolom bisa diatur di Tampilan & urutan. Simpan lalu refresh website untuk melihat hasil.</p></div></>}
        {tab === "sections" && <><div><h2 className="text-xl font-semibold">Tampilan & urutan</h2><p className="text-sm text-muted-foreground">Urutan, tampilan, auto carousel (jeda saat hover/tahan), serta kolom desktop, tablet dan HP bisa diatur. Klik Simpan dan refresh website.</p></div><div className="space-y-3">{data.sections.map((s, i) => <div key={s.id} className="rounded-xl border p-3 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><label className="text-sm font-semibold flex items-center gap-2"><input type="checkbox" checked={s.visible} onChange={(e) => setSection(i, { visible: e.target.checked })} />{s.id}</label><div className="flex gap-1"><button aria-label="Pindah ke atas" className={secondary} disabled={!i} onClick={() => moveSection(i, -1)}><ArrowUp className="size-4" /></button><button aria-label="Pindah ke bawah" className={secondary} disabled={i === data.sections.length - 1} onClick={() => moveSection(i, 1)}><ArrowDown className="size-4" /></button></div></div><input className={inputClass} aria-label={`Judul ${s.id}`} value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} /><input className={inputClass} aria-label={`Judul English ${s.id}`} placeholder="Title in English (optional)" value={s.en?.title ?? ""} onChange={(e) => setSectionEn(i, "title", e.target.value)} /><textarea className={inputClass} aria-label={`Deskripsi ${s.id}`} rows={2} placeholder="Subjudul (opsional)" value={s.subtitle} onChange={(e) => setSection(i, { subtitle: e.target.value })} /><textarea className={inputClass} aria-label={`Deskripsi English ${s.id}`} rows={2} placeholder="Subtitle in English (optional)" value={s.en?.subtitle ?? ""} onChange={(e) => setSectionEn(i, "subtitle", e.target.value)} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3"><label className="flex flex-col gap-1 text-xs font-semibold">Gaya tampilan<select className={inputClass} value={s.layout} onChange={(e) => setSection(i, { layout: e.target.value as SiteData["sections"][number]["layout"] })}><option value="list">Daftar / standar</option><option value="cards">Kartu / grid</option><option value="compact">Kartu ringkas</option></select></label><label className="flex flex-col gap-1 text-xs font-semibold">Kolom per baris (desktop)<select className={inputClass} value={s.columns} onChange={(e) => setSection(i, { columns: Number(e.target.value) })} disabled={["hero", "about", "contact"].includes(s.id)}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} kolom</option>)}</select></label></div><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3"><label className="flex flex-col gap-1 text-xs font-semibold">Kolom tablet (768–1023px)<select className={inputClass} value={s.tabletColumns} onChange={e => setSection(i, { tabletColumns: Number(e.target.value) })} disabled={["hero", "about", "contact"].includes(s.id)}>{[1,2,3].map(n => <option key={n} value={n}>{n} kolom</option>)}</select></label><label className="flex flex-col gap-1 text-xs font-semibold">Kolom HP (&lt;768px)<select className={inputClass} value={s.mobileColumns} onChange={e => setSection(i, { mobileColumns: Number(e.target.value) })} disabled={["hero", "about", "contact"].includes(s.id)}>{[1,2].map(n => <option key={n} value={n}>{n} kolom</option>)}</select></label><label className="flex flex-col gap-1 text-xs font-semibold">Mode tampilan konten<select className={inputClass} value={s.displayMode || "grid"} onChange={e => setSection(i, { displayMode: e.target.value as SiteData["sections"][number]["displayMode"] })} disabled={["hero", "about", "contact"].includes(s.id)}><option value="carousel">Geser otomatis (carousel)</option><option value="grid">Tampilkan semua (grid)</option><option value="pages">Pagination manual</option></select></label><label className="flex gap-2 items-center text-xs font-semibold"><input type="checkbox" checked={s.autoPlay} onChange={e => setSection(i, { autoPlay: e.target.checked })} disabled={s.displayMode !== "carousel"}/> Auto geser (carousel)</label><label className="flex flex-col gap-1 text-xs font-semibold">Jeda tiap geser (detik)<input className={inputClass} type="number" min={3} max={20} value={s.intervalSeconds} disabled={s.displayMode !== "carousel"} onChange={e => setSection(i, { intervalSeconds: Math.min(20, Math.max(3, Number(e.target.value) || 6)) })}/></label><label className="flex flex-col gap-1 text-xs font-semibold">Pagination: item per halaman desktop/tablet<input className={inputClass} type="number" min={1} max={48} value={s.perPageDesktop} onChange={e => setSection(i, { perPageDesktop: Math.min(48, Math.max(1, Number(e.target.value) || 1)) })}/></label><label className="flex flex-col gap-1 text-xs font-semibold">Pagination: item per halaman HP<input className={inputClass} type="number" min={1} max={24} value={s.perPageMobile} onChange={e => setSection(i, { perPageMobile: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })}/></label></div></div>)}</div></>}
        {tab !== "profile" && tab !== "sections" && (() => { const key = tab as CollectionKey; const cfg = configs[key]; const entries = data[key]; return <><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{cfg.title}</h2><p className="text-sm text-muted-foreground">{cfg.caption}</p></div><button onClick={() => editEntry(key, -1)} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-nowrap"><Plus className="inline size-4" /> Tambah</button></div>
          {draft && <div className="rounded-xl border-2 border-primary/40 bg-muted/30 p-4 space-y-4"><div className="flex justify-between gap-2"><h3 className="font-semibold">{editing === -1 ? "Item baru" : "Edit item"}</h3><button onClick={() => { setEditing(null); setDraft(null); }} aria-label="Tutup editor"><X className="size-5" /></button></div>{cfg.fields.map((f) => <div key={f.key}>{renderLocalizedField(f, draft[f.key], (v) => setDraft({ ...draft, [f.key]: v }), (draft.en as Record<string, string> | undefined)?.[f.key] ?? "", (v) => setDraft({ ...draft, en: { ...(draft.en as Record<string, string> | undefined), [f.key]: v } }))}</div>)}<div className="flex gap-2"><button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm" onClick={() => applyEntry(key)}>Terapkan item</button><button className={secondary} onClick={() => { setEditing(null); setDraft(null); }}>Batal</button></div><p className="text-xs text-muted-foreground">Setelah menerapkan, klik Simpan perubahan di atas.</p></div>}
          <div className="space-y-2">{entries.length ? entries.map((entry, i) => { const e = entry as Record<string, unknown>; return <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border p-3"><div className="min-w-0"><div className="font-medium text-sm truncate">{String(e.title || e.name || e.school || e.company || e.label || "Tanpa judul")}</div><p className="text-xs text-muted-foreground truncate">{String(e.issuer || e.type || e.slug || e.degree || "")}</p></div><div className="flex shrink-0 items-center gap-1"><button className={secondary} aria-label="Naikkan" disabled={!i} onClick={() => moveEntry(key, i, -1)}><ArrowUp className="size-3" /></button><button className={secondary} aria-label="Turunkan" disabled={i === entries.length - 1} onClick={() => moveEntry(key, i, 1)}><ArrowDown className="size-3" /></button><button className={secondary} onClick={() => editEntry(key, i)}>Edit</button><button className={secondary} aria-label="Hapus" onClick={() => deleteEntry(key, i)}><Trash2 className="size-4 text-red-500" /></button></div></div>; }) : <p className="rounded-xl bg-muted p-5 text-sm text-muted-foreground">Belum ada data. Klik Tambah.</p>}</div></>; })()}
      </div>
    </div>
  </div>;
}
