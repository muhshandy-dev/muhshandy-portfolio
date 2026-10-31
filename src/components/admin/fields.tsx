/* eslint-disable @next/next/no-img-element */
"use client";

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { FieldDef } from "./config";

export type UploadFn = (file: File) => Promise<string>;

/** Batas ukuran upload (MB) yang ditampilkan di form; admin online lebih kecil dari lokal. */
export const UploadLimitContext = createContext(8);

// Admin online: file baru baru tampil di situs setelah build selesai, jadi pratinjau di editor memakai salinan lokal dari peramban.
const localPreviews = new Map<string, string>();
export const rememberPreview = (url: string, file: File) => { localPreviews.set(url, URL.createObjectURL(file)); };
export const previewSrc = (url: string) => localPreviews.get(url) ?? url;

const ACCEPT: Record<string, string> = {
  image: ".png,.jpg,.jpeg,.webp,.gif,.ico,image/png,image/jpeg,image/webp,image/gif,image/x-icon",
  pdf: ".pdf,application/pdf",
  file: ".png,.jpg,.jpeg,.webp,.gif,.pdf",
};

export function FieldShell({ label, htmlFor, help, error, required, children, lang }: { label: string; htmlFor?: string; help?: string; error?: string; required?: boolean; children: ReactNode; lang?: "ID" | "EN" }) {
  return <div className="adm-field">
    <label htmlFor={htmlFor} className="adm-label">{lang && <span className="adm-lang" data-lang={lang}>{lang}</span>}{label}{required && <span className="text-red-500" aria-hidden> *</span>}</label>
    {children}
    {error ? <p className="adm-error" role="alert">{error}</p> : help ? <p className="adm-help">{help}</p> : null}
  </div>;
}

function TagsInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [raw, setRaw] = useState(value.join(", "));
  const [lastValue, setLastValue] = useState(value);
  // Sinkronkan bila nilai berubah dari luar (mis. import/undo)
  if (lastValue !== value && value.join(", ") !== raw.split(",").map((s) => s.trim()).filter(Boolean).join(", ")) { setLastValue(value); setRaw(value.join(", ")); }
  return <>
    <input id={id} className="adm-input" value={raw} placeholder={placeholder} onChange={(e) => { setRaw(e.target.value); const next = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); setLastValue(next); onChange(next); }} />
    {value.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{value.map((tag) => <span key={tag} className="adm-tag">{tag}</span>)}</div>}
  </>;
}

function UploadInput({ id, kind, value, onChange, upload }: { id: string; kind: "image" | "pdf" | "file"; value: string; onChange: (v: string) => void; upload: UploadFn }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const limitMb = useContext(UploadLimitContext);
  const isPdf = /\.pdf($|\?)/i.test(value);
  async function handle(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try { onChange(await upload(file)); }
    catch (e) { setError(e instanceof Error ? e.message : "Upload gagal"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  return <div className={`adm-upload ${over ? "is-over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files?.[0]); }}>
    <div className="adm-upload-preview">
      {value && !isPdf ? <img src={previewSrc(value)} alt="" /> : value ? <FileText className="size-6 text-muted-foreground" aria-hidden /> : <Upload className="size-5 text-muted-foreground" aria-hidden />}
    </div>
    <div className="min-w-0 flex-1 space-y-1.5">
      <input id={id} className="adm-input" value={value} placeholder="/uploads/… atau https://…" onChange={(e) => onChange(e.target.value)} />
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}{busy ? "Mengunggah…" : "Unggah file"}</button>
        {value && <a className="adm-btn adm-btn-sm" href={value} target="_blank" rel="noopener noreferrer">Buka</a>}
        {value && <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange("")} aria-label="Kosongkan file"><Trash2 className="size-3.5" aria-hidden />Kosongkan</button>}
        <span className="text-[11px] text-muted-foreground">{kind === "pdf" ? "PDF" : kind === "image" ? "PNG/JPG/WebP/GIF/ICO" : "Gambar atau PDF"}, maks. {limitMb} MB · bisa drag & drop</span>
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
    <input ref={fileRef} type="file" hidden accept={ACCEPT[kind]} onChange={(e) => void handle(e.target.files?.[0])} />
  </div>;
}

export function Control({ field, id, value, onChange, upload, placeholder }: { field: FieldDef; id: string; value: unknown; onChange: (v: unknown) => void; upload: UploadFn; placeholder?: string }) {
  const kind = field.kind ?? "text";
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  switch (kind) {
    case "textarea": case "markdown":
      return <textarea id={id} className="adm-input" rows={kind === "markdown" ? 8 : 3} value={str} placeholder={placeholder ?? field.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return <select id={id} className="adm-input" value={str} onChange={(e) => onChange(e.target.value)}>{field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    case "boolean":
      return <label className="adm-switch"><input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /><span aria-hidden /> {Boolean(value) ? "Ya" : "Tidak"}</label>;
    case "tags":
      return <TagsInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} placeholder={field.placeholder} />;
    case "image": case "pdf": case "file":
      return <UploadInput id={id} kind={kind} value={str} onChange={onChange} upload={upload} />;
    case "date":
      return <input id={id} type="date" className="adm-input" value={str} onChange={(e) => onChange(e.target.value)} />;
    case "color":
      return <div className="flex items-center gap-2"><input type="color" aria-label={`${field.label} (pemilih)`} className="h-10 w-14 cursor-pointer rounded-lg border bg-transparent" value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#2563eb"} onChange={(e) => onChange(e.target.value)} /><input id={id} className="adm-input w-32 font-mono" value={str} onChange={(e) => onChange(e.target.value)} /></div>;
    default:
      return <input id={id} className="adm-input" type={kind === "url" ? "url" : "text"} inputMode={kind === "url" ? "url" : undefined} value={str} placeholder={placeholder ?? field.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Field dengan dukungan dua bahasa: kolom ID wajib, kolom EN opsional (fallback ke ID). */
export function Field({ field, value, enValue, onChange, onEnChange, upload, error }: { field: FieldDef; value: unknown; enValue?: string; onChange: (v: unknown) => void; onEnChange?: (v: string) => void; upload: UploadFn; error?: string }) {
  const id = useId();
  const bilingual = field.i18n && onEnChange && (field.kind ?? "text") !== "boolean";
  if (!bilingual) return <div className={field.wide ? "adm-wide" : ""}><FieldShell label={field.label} htmlFor={id} help={field.help} error={error} required={field.required}><Control field={field} id={id} value={value} onChange={onChange} upload={upload} /></FieldShell></div>;
  return <div className="adm-bilingual adm-wide">
    <FieldShell lang="ID" label={field.label} htmlFor={id} help={field.help} error={error} required={field.required}><Control field={field} id={id} value={value} onChange={onChange} upload={upload} /></FieldShell>
    <FieldShell lang="EN" label={`${field.label} (English, opsional)`} htmlFor={`${id}-en`}><Control field={field} id={`${id}-en`} value={enValue ?? ""} onChange={(v) => onEnChange(String(v))} upload={upload} placeholder={typeof value === "string" && value ? `Kosong = memakai teks ID` : "English translation"} /></FieldShell>
  </div>;
}
