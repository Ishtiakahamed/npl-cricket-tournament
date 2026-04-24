"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Venue = { id: string; name: string; city: string | null; capacity: number | null };

async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: opts.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return res.json();
}

export function VenuesAdmin({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const onAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/venues", {
        body: {
          name: fd.get("name"),
          city: fd.get("city") || null,
          capacity: fd.get("capacity") ? Number(fd.get("capacity")) : null,
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
  const onDelete = async (id: string) => {
    if (!confirm("Delete venue?")) return;
    await api(`/api/admin/venues/${id}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Venues</h1>
      <section className="card">
        <h2 className="text-lg font-bold mb-3">Add venue</h2>
        <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Name</label><input name="name" className="input" required /></div>
          <div><label className="label">City</label><input name="city" className="input" /></div>
          <div><label className="label">Capacity</label><input name="capacity" type="number" className="input" /></div>
          <div className="sm:col-span-3"><button className="btn-primary" disabled={busy}>Add</button></div>
        </form>
      </section>
      <div className="card">
        <ul className="divide-y divide-[var(--border)]">
          {venues.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {v.city ?? "—"} · Capacity: {v.capacity ?? "—"}
                </div>
              </div>
              <button className="btn-danger" onClick={() => onDelete(v.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
