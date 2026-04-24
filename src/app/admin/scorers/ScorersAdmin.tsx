"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Match = { id: string; matchNumber: number; teamA: { shortName: string }; teamB: { shortName: string } };
type Scorer = {
  id: string;
  username: string;
  name: string | null;
  assignedMatches: Match[];
};

async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: opts.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return res.json();
}

export function ScorersAdmin({ scorers }: { scorers: Scorer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/scorers", {
        body: {
          username: fd.get("username"),
          name: fd.get("name"),
          password: fd.get("password"),
        },
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  const onResetPw = async (id: string) => {
    const pw = prompt("New password:");
    if (!pw) return;
    await api(`/api/admin/scorers/${id}`, { method: "PATCH", body: { password: pw } });
    alert("Password updated");
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete scorer account?")) return;
    await api(`/api/admin/scorers/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Scorer accounts</h1>
      <section className="card">
        <h2 className="text-lg font-bold mb-3">Add scorer</h2>
        <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Username</label><input name="username" className="input" required /></div>
          <div><label className="label">Name</label><input name="name" className="input" /></div>
          <div><label className="label">Password</label><input name="password" type="password" className="input" required /></div>
          <div className="sm:col-span-3"><button className="btn-primary" disabled={busy}>Create account</button></div>
        </form>
      </section>
      <section className="card">
        <ul className="divide-y divide-[var(--border)]">
          {scorers.map((s) => (
            <li key={s.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium">{s.name ?? s.username} <span className="text-xs text-[var(--muted)]">({s.username})</span></div>
                <div className="text-xs text-[var(--muted)]">
                  Assigned: {s.assignedMatches.length === 0 ? "None" : s.assignedMatches.map((m) => `#${m.matchNumber} ${m.teamA.shortName}/${m.teamB.shortName}`).join(", ")}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => onResetPw(s.id)}>Reset password</button>
                <button className="btn-danger" onClick={() => onDelete(s.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
