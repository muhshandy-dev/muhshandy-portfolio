"use client";

import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }), credentials: "same-origin" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) { window.location.assign("/admin/"); return; }
      setError(json.error || `Login gagal (${res.status})`);
    } catch { setError("Tidak bisa menghubungi server. Periksa koneksi internet."); }
    setBusy(false);
  }

  return <main className="mx-auto flex min-h-[70dvh] max-w-sm flex-col justify-center gap-5 py-10">
    <div className="space-y-1 text-center">
      <LockKeyhole className="mx-auto size-7" aria-hidden />
      <h1 className="text-2xl font-semibold">Masuk admin</h1>
      <p className="text-sm text-muted-foreground">Hanya untuk pemilik website.</p>
    </div>
    <form onSubmit={submit} className="space-y-3">
      <label className="adm-label" htmlFor="admin-password">Kata sandi</label>
      <input id="admin-password" className="adm-input" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="adm-error" role="alert">{error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary w-full justify-center" disabled={busy || !password}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}Masuk</button>
    </form>
  </main>;
}
