"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Team = { id: string; name: string; groupId: string | null };
type Group = { id: string; name: string; teams: Team[] };

async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: opts.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return res.json();
}

export function GroupsAdmin({ groups, teams }: { groups: Group[]; teams: Team[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onAddGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/groups", { body: { name: fd.get("name") } });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  const onDeleteGroup = async (id: string) => {
    if (!confirm("Delete group?")) return;
    await api(`/api/admin/groups/${id}`, { method: "DELETE" });
    router.refresh();
  };
  const onAssign = async (teamId: string, groupId: string) => {
    await api(`/api/admin/teams/${teamId}`, {
      method: "PATCH",
      body: { groupId: groupId || null },
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Groups</h1>
      <section className="card">
        <h2 className="text-lg font-bold mb-3">Add group</h2>
        <form onSubmit={onAddGroup} className="flex gap-2">
          <input name="name" className="input flex-1" placeholder="Group A" required />
          <button className="btn-primary" disabled={busy}>Add</button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold mb-3">Groups</h2>
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.id} className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between">
                <strong>{g.name}</strong>
                <button className="btn-danger" onClick={() => onDeleteGroup(g.id)}>Delete</button>
              </div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {g.teams.length === 0 ? "No teams assigned." : g.teams.map((t) => t.name).join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold mb-3">Assign teams to groups</h2>
        <ul className="space-y-2">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2">
              <span>{t.name}</span>
              <select
                className="input max-w-[200px]"
                defaultValue={t.groupId ?? ""}
                onChange={(e) => onAssign(t.id, e.target.value)}
              >
                <option value="">— No group —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
