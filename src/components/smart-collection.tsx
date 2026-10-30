"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Pause, Play } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { Section } from "@/lib/site-schema";
import { visibleCount, wrapIndex } from "@/lib/carousel-math";

type Viewport = "mobile" | "tablet" | "desktop";
const GAP = 16;

function subscribeResize(cb: () => void) { window.addEventListener("resize", cb); return () => window.removeEventListener("resize", cb); }
const getViewport = (): Viewport => (window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");
function subscribeMotion(cb: () => void) { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); }
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.animation === "off";

export function useViewport() { return useSyncExternalStore(subscribeResize, getViewport, () => "desktop" as Viewport); }
export function useReducedMotionPref() { return useSyncExternalStore(subscribeMotion, getReducedMotion, () => false); }

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el); setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export type SmartCollectionProps = {
  section: Section;
  /** Judul section yang sudah diterjemahkan, untuk label aksesibilitas. */
  label: string;
  items: { key: string; node: ReactNode }[];
  /** Lebar minimum kartu supaya kartu tidak terlalu kecil di layar sempit. */
  minCardWidth?: number;
  /** Section berbentuk daftar satu kolom (tanpa kartu). */
  forceSingleColumn?: boolean;
};

/**
 * Satu komponen untuk semua section koleksi: carousel, grid, atau pagination (dipilih di admin).
 */
export function SmartCollection({ section, label, items, minCardWidth = 220, forceSingleColumn = false }: SmartCollectionProps) {
  const viewport = useViewport();
  const [ref, width] = useContainerWidth<HTMLDivElement>();
  const wanted = forceSingleColumn ? 1 : viewport === "mobile" ? section.mobileColumns : viewport === "tablet" ? section.tabletColumns : section.columns;
  // Sebelum lebar terukur (SSR), pakai kolom dari pengaturan.
  const cols = width ? visibleCount(width, wanted, minCardWidth, GAP) : wanted;
  const [expanded, setExpanded] = useState(false);
  const mode = section.displayMode;
  const total = items.length;

  let body: ReactNode;
  if (mode === "carousel" && !expanded && total > cols) {
    body = <Carousel section={section} label={label} items={items} cols={cols} onViewAll={() => setExpanded(true)} />;
  } else if (mode === "pages" && !expanded) {
    body = <Paged section={section} label={label} items={items} cols={cols} viewport={viewport} />;
  } else {
    body = <LimitedGrid section={section} items={items} cols={cols} expanded={expanded} onToggle={setExpanded} fromCarousel={mode === "carousel" && total > cols} />;
  }
  return <div ref={ref} className="smart-collection" data-mode={mode} data-section={section.id}>{body}</div>;
}

function gridStyle(cols: number) { return { "--sc-cols": cols, "--sc-gap": `${GAP}px` } as CSSProperties; }

function LimitedGrid({ section, items, cols, expanded, onToggle, fromCarousel }: { section: Section; items: SmartCollectionProps["items"]; cols: number; expanded: boolean; onToggle: (v: boolean) => void; fromCarousel: boolean }) {
  const { t } = useLocale();
  const limit = section.maxItems > 0 && !fromCarousel ? section.maxItems : 0;
  const limited = !expanded && limit > 0 && items.length > limit;
  const list = limited ? items.slice(0, limit) : items;
  return <div className="space-y-4">
    <div className="sc-grid" style={gridStyle(cols)} data-density={section.layout}>{list.map((i) => <div key={i.key} className="sc-cell">{i.node}</div>)}</div>
    {limited && <button type="button" className="ui-button" onClick={() => onToggle(true)}>{t("viewAll")} ({items.length})<LayoutGrid className="size-4" aria-hidden /></button>}
    {expanded && (fromCarousel || limit > 0) && <button type="button" className="ui-button" onClick={() => onToggle(false)}>{fromCarousel ? t("backToCarousel") : t("showLess")}</button>}
  </div>;
}

function Paged({ section, label, items, cols, viewport }: { section: Section; label: string; items: SmartCollectionProps["items"]; cols: number; viewport: Viewport }) {
  const { t } = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const [page, setPage] = useState(1);
  const pageSize = viewport === "mobile" ? section.perPageMobile : section.perPageDesktop;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const go = (n: number) => {
    if (n < 1 || n > pageCount || n === current) return;
    setPage(n);
    root.current?.closest("section")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  const start = Math.max(1, Math.min(current - 2, pageCount - 4));
  const numbers = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);
  return <div ref={root} className="space-y-4">
    <div className="sc-grid" style={gridStyle(cols)} data-density={section.layout}>{items.slice((current - 1) * pageSize, current * pageSize).map((i) => <div key={i.key} className="sc-cell">{i.node}</div>)}</div>
    {pageCount > 1 && <nav className="sc-pager" aria-label={`${t("pages")}: ${label}`}>
      <button type="button" className="ui-icon-button" onClick={() => go(current - 1)} disabled={current === 1} aria-label={t("previous")}><ChevronLeft className="size-4" aria-hidden /></button>
      {numbers.map((n) => <button key={n} type="button" className="ui-icon-button" aria-current={n === current ? "page" : undefined} aria-label={`${t("page")} ${n}`} onClick={() => go(n)}>{n}</button>)}
      <button type="button" className="ui-icon-button" onClick={() => go(current + 1)} disabled={current === pageCount} aria-label={t("next")}><ChevronRight className="size-4" aria-hidden /></button>
      <span className="text-xs text-muted-foreground">{current} / {pageCount}</span>
    </nav>}
  </div>;
}

function Carousel({ section, label, items, cols, onViewAll }: { section: Section; label: string; items: SmartCollectionProps["items"]; cols: number; onViewAll: () => void }) {
  const { t } = useLocale();
  const reduced = useReducedMotionPref();
  const n = items.length;
  const [index, setIndex] = useState(0); // 0..n (n = salinan awal, untuk loop tanpa putus)
  const [animate, setAnimate] = useState(true);
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [userChoice, setUserChoice] = useState<"play" | "pause" | null>(null);
  const [manual, setManual] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number; id: number; moved: boolean; horizontal: boolean | null } | null>(null);
  const resumeTimer = useRef<number | undefined>(undefined);

  const playing = userChoice ? userChoice === "play" : section.autoPlay && !reduced;
  const running = playing && inView && pageVisible && !hover && !focusWithin && !pressed;

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis); return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const step = useCallback((dir: 1 | -1) => {
    if (reduced) { setAnimate(false); setIndex((i) => wrapIndex(i + dir, n)); return; }
    const jumpThen = (jumpTo: number, target: number) => {
      // lompat tanpa animasi ke posisi salinan yang identik, lalu geser satu kartu dengan animasi
      setAnimate(false); setIndex(jumpTo);
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(target); }));
    };
    if (dir === 1) { if (index >= n) jumpThen(0, 1); else { setAnimate(true); setIndex(index + 1); } }
    else if (index <= 0) jumpThen(n, n - 1);
    else { setAnimate(true); setIndex(index - 1); }
  }, [index, n, reduced]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => step(1), section.intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [running, step, section.intervalSeconds]);

  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (index >= n) { setAnimate(false); setIndex(0); }
  };

  const userStep = (dir: 1 | -1) => { setManual(true); step(dir); };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); userStep(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); userStep(-1); }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    window.clearTimeout(resumeTimer.current);
    setPressed(true);
    pointer.current = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, horizontal: null };
  };
  const onPointerMove = (e: PointerEvent) => {
    const p = pointer.current; if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (p.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      p.horizontal = Math.abs(dx) > Math.abs(dy);
      if (p.horizontal) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (p.horizontal) { p.moved = true; setDragging(true); setDrag(dx); }
  };
  const endPointer = (e: PointerEvent) => {
    const p = pointer.current; if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    pointer.current = null;
    setDrag(0); setDragging(false);
    if (p.moved && Math.abs(dx) > 40) userStep(dx < 0 ? 1 : -1);
    // Setelah disentuh, tunggu sebentar sebelum autoplay jalan lagi supaya pengunjung sempat membaca.
    if (e.pointerType === "mouse") setPressed(false);
    else resumeTimer.current = window.setTimeout(() => setPressed(false), 4000);
    if (p.moved) {
      const stop = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); };
      window.addEventListener("click", stop, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 50);
    }
  };

  const shownFrom = (index % n) + 1;
  const shownTo = Math.min(shownFrom + cols - 1, n);
  const extended = [...items, ...items.slice(0, cols)];
  const trackStyle = {
    "--sc-cols": cols, "--sc-gap": `${GAP}px`,
    transform: `translate3d(calc(${-index} * (100% + ${GAP}px) / ${cols} + ${drag}px), 0, 0)`,
    transition: animate && !reduced && !dragging ? "transform 600ms cubic-bezier(.22,.8,.24,1)" : "none",
  } as CSSProperties;

  return <div className="space-y-3" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocus={(e) => { if ((e.target as HTMLElement).matches(":focus-visible")) setFocusWithin(true); }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false); }}>
    <div ref={wrap} className="sc-viewport" role="region" aria-roledescription="carousel" aria-label={t("carouselOf", { name: label })} tabIndex={0} onKeyDown={onKeyDown}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endPointer} onPointerCancel={endPointer}>
      <div className="sc-track" style={trackStyle} onTransitionEnd={onTransitionEnd}>
        {extended.map((item, i) => {
          const clone = i >= n;
          const visible = i >= index && i < index + cols;
          return <div key={clone ? `clone-${item.key}` : item.key} className="sc-cell" role="group" aria-roledescription="slide"
            aria-label={clone ? undefined : `${(i % n) + 1} / ${n}`} aria-hidden={clone || !visible || undefined} inert={clone || !visible || undefined}>{item.node}</div>;
        })}
      </div>
    </div>
    <div className="sc-controls">
      <div className="flex items-center gap-2">
        <button type="button" className="ui-icon-button" onClick={() => userStep(-1)} aria-label={t("previous")}><ChevronLeft className="size-4" aria-hidden /></button>
        <button type="button" className="ui-icon-button" onClick={() => userStep(1)} aria-label={t("next")}><ChevronRight className="size-4" aria-hidden /></button>
        <button type="button" className="ui-icon-button" onClick={() => setUserChoice(playing ? "pause" : "play")} aria-label={playing ? t("pause") : t("play")} aria-pressed={!playing}>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>
        <span className={`sc-autoplay-dot ${running ? "is-running" : ""}`} aria-hidden style={{ "--sc-interval": `${section.intervalSeconds}s` } as CSSProperties} key={`${index}-${running}`} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums" aria-live={manual ? "polite" : "off"}>{t("slideOf", { from: shownFrom, to: shownTo, total: n })}</span>
      <button type="button" className="ui-button" onClick={onViewAll}>{t("viewAll")} ({n})<LayoutGrid className="size-4" aria-hidden /></button>
    </div>
  </div>;
}
