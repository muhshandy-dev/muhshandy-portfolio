"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { normalizeSite, type SiteData } from "@/lib/site-schema";
import AdminPanel from "./admin-panel";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: SiteData; revision: string };

/** Admin online: isi situs dibaca dari GitHub lewat /api/admin/site (dilindungi login), bukan dari build statis. */
export default function OnlineAdmin() {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/site", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) { window.location.replace("/admin/login/"); return; }
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setState({ status: "error", message: json.error || `Gagal memuat (${res.status})` });
        else {
          // Server mengirim isi mentah; pelengkapan default dan validasi dilakukan di sini (hemat CPU server).
          try { setState({ status: "ready", data: normalizeSite(json.data), revision: json.revision }); }
          catch (e) { setState({ status: "error", message: e instanceof Error ? e.message : "Isi situs tidak valid" }); }
        }
      })
      .catch(() => { if (!cancelled) setState({ status: "error", message: "Tidak bisa menghubungi server admin. Periksa koneksi internet lalu muat ulang." }); });
    return () => { cancelled = true; };
  }, []);

  if (state.status === "ready") return <AdminPanel mode="online" initialData={state.data} initialRevision={state.revision} />;
  return <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center" role="status">
    {state.status === "loading" ? <><Loader2 className="size-6 animate-spin" aria-hidden /><p className="text-sm text-muted-foreground">Memuat isi situs dari GitHub…</p></> :
      <><p className="adm-error" role="alert">{state.message}</p><button type="button" className="adm-btn" onClick={() => window.location.reload()}>Coba lagi</button></>}
  </div>;
}
