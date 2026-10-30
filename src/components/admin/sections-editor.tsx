"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, GripVertical } from "lucide-react";
import type { Section, SiteData } from "@/lib/site-schema";
import { useDragSort } from "./collection-editor";
import { moveItem } from "./utils";

const NAMES: Record<Section["id"], string> = { hero: "Hero / profil", about: "Tentang saya", work: "Pengalaman", education: "Pendidikan", skills: "Keahlian", projects: "Proyek", certifications: "Sertifikasi", activities: "Kegiatan", blog: "Blog", contact: "Kontak" };
const COLLECTION_SECTIONS = new Set(["work", "education", "skills", "projects", "certifications", "activities", "blog"]);

function NumberSelect({ label, value, max, onChange, disabled }: { label: string; value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return <label className="adm-field"><span className="adm-label">{label}</span><select className="adm-input" value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>{Array.from({ length: max }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>;
}
function NumberInput({ label, value, min, max, onChange, disabled, help }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; disabled?: boolean; help?: string }) {
  return <label className="adm-field"><span className="adm-label">{label}</span><input type="number" className="adm-input" min={min} max={max} value={value} disabled={disabled} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} />{help && <span className="adm-help">{help}</span>}</label>;
}

export function SectionsEditor({ data, onChange }: { data: SiteData; onChange: (sections: Section[]) => void }) {
  const sections = data.sections;
  const [open, setOpen] = useState<string | null>("projects");
  const move = (from: number, to: number) => onChange(moveItem(sections, from, to));
  const { rowProps, handleProps } = useDragSort(move);
  const set = (i: number, patch: Partial<Section>) => onChange(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return <div className="space-y-4">
    <div><h2 className="text-xl font-semibold">Section & layout</h2><p className="text-sm text-muted-foreground">Seret untuk mengubah urutan section di halaman. Atur judul dua bahasa, tampil/sembunyi, gaya kartu, kolom per perangkat, dan mode carousel / grid / pagination.</p></div>
    <ul className="space-y-2">
      {sections.map((s, i) => {
        const isOpen = open === s.id;
        const isCollection = COLLECTION_SECTIONS.has(s.id);
        return <li key={s.id} className="adm-row" {...rowProps(i)} data-open={isOpen || undefined}>
          <div className="adm-row-head">
            <span className="adm-handle" {...handleProps(i)} title="Seret untuk mengubah urutan" aria-hidden><GripVertical className="size-4" /></span>
            <button type="button" className="adm-row-title" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><span className="font-medium">{s.title || NAMES[s.id]}</span>{!s.visible && <span className="adm-badge">Disembunyikan</span>}</span>
                <span className="block text-xs text-muted-foreground">{NAMES[s.id]}{isCollection ? ` · ${s.displayMode === "carousel" ? "Carousel" : s.displayMode === "pages" ? "Pagination" : "Grid"} · ${s.columns}/${s.tabletColumns}/${s.mobileColumns} kolom` : ""}</span></span>
              <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <div className="adm-row-actions">
              <button type="button" className="adm-icon" onClick={() => set(i, { visible: !s.visible })} aria-label={s.visible ? `Sembunyikan section ${NAMES[s.id]}` : `Tampilkan section ${NAMES[s.id]}`} aria-pressed={!s.visible}>{s.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}</button>
              <button type="button" className="adm-icon" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Naikkan section ${NAMES[s.id]}`}><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" className="adm-icon" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label={`Turunkan section ${NAMES[s.id]}`}><ArrowDown className="size-4" aria-hidden /></button>
            </div>
          </div>
          {isOpen && <div className="adm-row-body space-y-4">
            <div className="adm-grid">
              <label className="adm-field"><span className="adm-label"><span className="adm-lang" data-lang="ID">ID</span>Judul</span><input className="adm-input" value={s.title} onChange={(e) => set(i, { title: e.target.value })} /></label>
              <label className="adm-field"><span className="adm-label"><span className="adm-lang" data-lang="EN">EN</span>Judul (English)</span><input className="adm-input" value={s.en?.title ?? ""} placeholder="Kosong = memakai judul ID" onChange={(e) => set(i, { en: { ...s.en, title: e.target.value } })} /></label>
              <label className="adm-field"><span className="adm-label"><span className="adm-lang" data-lang="ID">ID</span>Subjudul</span><textarea className="adm-input" rows={2} value={s.subtitle} onChange={(e) => set(i, { subtitle: e.target.value })} /></label>
              <label className="adm-field"><span className="adm-label"><span className="adm-lang" data-lang="EN">EN</span>Subjudul (English)</span><textarea className="adm-input" rows={2} value={s.en?.subtitle ?? ""} onChange={(e) => set(i, { en: { ...s.en, subtitle: e.target.value } })} /></label>
            </div>
            <fieldset className="adm-fieldset"><legend>Gaya</legend><div className="adm-grid adm-grid-3">
              <label className="adm-field"><span className="adm-label">Gaya tampilan</span><select className="adm-input" value={s.layout} onChange={(e) => set(i, { layout: e.target.value as Section["layout"] })}><option value="list">{s.id === "hero" ? "Rata kiri" : "Daftar / standar"}</option><option value="cards">Kartu</option><option value="compact">{s.id === "hero" ? "Rata tengah" : "Kartu ringkas"}</option></select></label>
              {isCollection && <label className="adm-field"><span className="adm-label">Mode konten</span><select className="adm-input" value={s.displayMode} onChange={(e) => set(i, { displayMode: e.target.value as Section["displayMode"] })}><option value="carousel">Carousel (geser otomatis)</option><option value="grid">Grid (semua / dibatasi)</option><option value="pages">Pagination</option></select></label>}
            </div></fieldset>
            {isCollection && <>
              <fieldset className="adm-fieldset"><legend>Kolom per perangkat</legend><div className="adm-grid adm-grid-3">
                <NumberSelect label="Desktop (≥1024px)" value={s.columns} max={6} onChange={(n) => set(i, { columns: n })} />
                <NumberSelect label="Tablet (768–1023px)" value={s.tabletColumns} max={4} onChange={(n) => set(i, { tabletColumns: n })} />
                <NumberSelect label="HP (<768px)" value={s.mobileColumns} max={2} onChange={(n) => set(i, { mobileColumns: n })} />
              </div><p className="adm-help">Di layar sempit jumlah kolom otomatis dikurangi agar kartu tidak terlalu kecil.</p></fieldset>
              {s.displayMode === "carousel" && <fieldset className="adm-fieldset"><legend>Carousel</legend><div className="adm-grid adm-grid-3">
                <label className="adm-field"><span className="adm-label">Putar otomatis</span><span className="adm-switch"><input type="checkbox" checked={s.autoPlay} onChange={(e) => set(i, { autoPlay: e.target.checked })} /><span aria-hidden /> {s.autoPlay ? "Ya" : "Tidak"}</span></label>
                <NumberInput label="Jeda tiap geser (detik)" value={s.intervalSeconds} min={3} max={20} onChange={(n) => set(i, { intervalSeconds: n })} disabled={!s.autoPlay} />
              </div><p className="adm-help">Autoplay berhenti saat kursor di atas kartu, saat disentuh, saat section tidak terlihat, dan bila pengunjung memilih reduced motion.</p></fieldset>}
              {s.displayMode === "pages" && <fieldset className="adm-fieldset"><legend>Pagination</legend><div className="adm-grid adm-grid-3">
                <NumberInput label="Item per halaman (desktop/tablet)" value={s.perPageDesktop} min={1} max={48} onChange={(n) => set(i, { perPageDesktop: n })} />
                <NumberInput label="Item per halaman (HP)" value={s.perPageMobile} min={1} max={24} onChange={(n) => set(i, { perPageMobile: n })} />
              </div></fieldset>}
              {s.displayMode === "grid" && <fieldset className="adm-fieldset"><legend>Jumlah item</legend><div className="adm-grid adm-grid-3">
                <NumberInput label="Tampilkan maksimal (0 = semua)" value={s.maxItems} min={0} max={200} onChange={(n) => set(i, { maxItems: n })} help="Sisanya dibuka lewat tombol Lihat semua." />
              </div></fieldset>}
            </>}
          </div>}
        </li>;
      })}
    </ul>
  </div>;
}
