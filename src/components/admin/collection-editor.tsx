/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import type { CollectionKey, SiteData } from "@/lib/site-schema";
import { collections } from "./config";
import { Field, type UploadFn } from "./fields";
import { moveItem, newId, pathKey, slugify } from "./utils";

type Item = Record<string, unknown> & { id: string; en?: Record<string, string> };

export function useDragSort(onMove: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const rowProps = (index: number) => ({
    onDragOver: (e: React.DragEvent) => { if (dragIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIndex(index); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragIndex !== null) onMove(dragIndex, index); setDragIndex(null); setOverIndex(null); },
    "data-drop-target": overIndex === index && dragIndex !== null && dragIndex !== index ? (dragIndex < index ? "after" : "before") : undefined,
    "data-dragging": dragIndex === index || undefined,
  });
  const handleProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { setDragIndex(index); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(index)); },
    onDragEnd: () => { setDragIndex(null); setOverIndex(null); },
  });
  return { rowProps, handleProps };
}

export function CollectionEditor({ k, data, onChange, upload, errors }: { k: CollectionKey; data: SiteData; onChange: (items: unknown[]) => void; upload: UploadFn; errors: Map<string, string> }) {
  const cfg = collections[k];
  const items = data[k] as unknown as Item[];
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const move = (from: number, to: number) => onChange(moveItem(items, from, to));
  const { rowProps, handleProps } = useDragSort(move);
  const update = (index: number, patch: Partial<Item>) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const add = () => {
    const item = { id: newId(cfg.idPrefix), ...structuredClone(cfg.template) } as Item;
    onChange([...items, item]); setOpen(item.id); setQuery("");
    requestAnimationFrame(() => document.getElementById(`item-${item.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  const duplicate = (index: number) => {
    const src = items[index];
    const copy = { ...structuredClone(src), id: newId(cfg.idPrefix) } as Item;
    if (k === "posts") { copy.slug = `${String(src.slug || "tulisan")}-salinan`; copy.status = "draft"; }
    const next = [...items]; next.splice(index + 1, 0, copy); onChange(next); setOpen(copy.id);
  };
  const remove = (index: number) => {
    const it = items[index];
    if (!window.confirm(`Hapus ${cfg.singular} "${String(it[cfg.primary] || "tanpa judul")}"? Perubahan baru permanen setelah Simpan (versi lama tetap ada di Riwayat).`)) return;
    onChange(items.filter((_, i) => i !== index)); if (open === it.id) setOpen(null);
  };
  const q = query.trim().toLowerCase();
  const visible = items.map((it, index) => ({ it, index })).filter(({ it }) => !q || JSON.stringify(it).toLowerCase().includes(q));
  const errorCount = (index: number) => [...errors.keys()].filter((p) => p === `${k}.${index}` || p.startsWith(`${k}.${index}.`)).length;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-semibold">{cfg.title} <span className="text-sm font-normal text-muted-foreground">({items.length})</span></h2><p className="text-sm text-muted-foreground">{cfg.caption}</p></div>
      <button type="button" className="adm-btn adm-btn-primary" onClick={add}><Plus className="size-4" aria-hidden />Tambah {cfg.singular}</button>
    </div>
    {items.length > 6 && <label className="relative block"><span className="sr-only">Cari {cfg.title}</span><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input className="adm-input" style={{ paddingLeft: "2.25rem" }} placeholder={`Cari ${cfg.title.toLowerCase()}…`} value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
    {k === "skills" && <BulkSkills onAdd={(names) => onChange([...items, ...names.map((name) => ({ id: newId("skill"), name, demo: false, hidden: false, en: {} }))])} />}
    {q && <p className="text-xs text-muted-foreground">Mode pencarian: drag-and-drop dinonaktifkan, pakai tombol panah.</p>}
    <ul className="space-y-2" aria-label={`Daftar ${cfg.title}`}>
      {visible.map(({ it, index }) => {
        const isOpen = open === it.id;
        const title = String(it[cfg.primary] || "") || "(tanpa judul)";
        const thumb = cfg.thumb ? String(it[cfg.thumb] || "") : "";
        const errs = errorCount(index);
        return <li key={it.id} id={`item-${it.id}`} className="adm-row" {...(q ? {} : rowProps(index))} data-open={isOpen || undefined}>
          <div className="adm-row-head">
            {!q && <span className="adm-handle" {...handleProps(index)} title="Seret untuk mengubah urutan" aria-hidden><GripVertical className="size-4" /></span>}
            {cfg.thumb && <span className="adm-thumb">{thumb && !/\.pdf$/i.test(thumb) ? <img src={thumb} alt="" /> : null}</span>}
            <button type="button" className="adm-row-title" onClick={() => setOpen(isOpen ? null : it.id)} aria-expanded={isOpen} aria-controls={`edit-${it.id}`}>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5"><span className="truncate font-medium">{title}</span>
                  {Boolean(it.demo) && <span className="adm-badge adm-badge-demo">DEMO</span>}
                  {Boolean(it.hidden) && <span className="adm-badge">Disembunyikan</span>}
                  {errs > 0 && <span className="adm-badge adm-badge-error">{errs} masalah</span>}
                </span>
                {cfg.secondary && <span className="block truncate text-xs text-muted-foreground">{cfg.secondary(it)}</span>}
              </span>
              <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <div className="adm-row-actions">
              <button type="button" className="adm-icon" onClick={() => update(index, { hidden: !it.hidden })} aria-label={it.hidden ? `Tampilkan ${title}` : `Sembunyikan ${title}`} title={it.hidden ? "Tampilkan di website" : "Sembunyikan dari website"}>{it.hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
              <button type="button" className="adm-icon" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Naikkan ${title}`} title="Naikkan"><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" className="adm-icon" onClick={() => move(index, index + 1)} disabled={index === items.length - 1} aria-label={`Turunkan ${title}`} title="Turunkan"><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" className="adm-icon" onClick={() => duplicate(index)} aria-label={`Duplikat ${title}`} title="Duplikat"><Copy className="size-4" aria-hidden /></button>
              <button type="button" className="adm-icon adm-icon-danger" onClick={() => remove(index)} aria-label={`Hapus ${title}`} title="Hapus"><Trash2 className="size-4" aria-hidden /></button>
            </div>
          </div>
          {isOpen && <div id={`edit-${it.id}`} className="adm-row-body adm-grid">
            {cfg.fields.map((f) => <Field key={f.key} field={f} value={it[f.key]} enValue={it.en?.[f.key]} upload={upload}
              error={errors.get(pathKey([k, index, f.key]))}
              onChange={(v) => {
                const patch: Partial<Item> = { [f.key]: v };
                if (k === "posts" && f.key === "title" && !String(it.slug || "")) patch.slug = slugify(String(v));
                update(index, patch);
              }}
              onEnChange={(v) => update(index, { en: { ...(it.en ?? {}), [f.key]: v } })} />)}
            <p className="adm-wide text-xs text-muted-foreground">ID internal: <code>{it.id}</code>{k === "projects" && <> · halaman detail: <code>/projects/{it.id}</code></>}</p>
          </div>}
        </li>;
      })}
    </ul>
    {!items.length && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada {cfg.singular}. Klik <b>Tambah {cfg.singular}</b>.</div>}
    {items.length > 0 && !visible.length && <p className="text-sm text-muted-foreground">Tidak ada yang cocok dengan “{query}”.</p>}
  </div>;
}

function BulkSkills({ onAdd }: { onAdd: (names: string[]) => void }) {
  const [text, setText] = useState("");
  return <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const names = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (names.length) { onAdd(names); setText(""); } }}>
    <label className="sr-only" htmlFor="bulk-skills">Tambah banyak keahlian</label>
    <input id="bulk-skills" className="adm-input min-w-0 flex-1" placeholder="Tambah cepat: Python, SQL, Tableau" value={text} onChange={(e) => setText(e.target.value)} />
    <button type="submit" className="adm-btn">Tambah sekaligus</button>
  </form>;
}
