"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

type Player = { id: string; name: string; role: string; teamId: string };
type Team = {
  id: string;
  name: string;
  shortName: string;
  captain: string | null;
  logoUrl: string | null;
  groupId: string | null;
  group: { id: string; name: string } | null;
  players: Player[];
};
type Group = { id: string; name: string };

async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: opts.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function TeamsAdmin({ teams, groups }: { teams: Team[]; groups: Group[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onAddTeam = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/teams", {
        body: {
          name: fd.get("name"),
          shortName: fd.get("shortName"),
          captain: fd.get("captain") || null,
          logoUrl: fd.get("logoUrl") || null,
          groupId: fd.get("groupId") || null,
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

  const onDeleteTeam = async (id: string) => {
    if (!confirm("Delete this team and its players?")) return;
    await api(`/api/admin/teams/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const onAddPlayer = async (e: FormEvent<HTMLFormElement>, teamId: string) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/admin/players", {
        body: {
          name: fd.get("name"),
          role: fd.get("role"),
          teamId,
        },
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const onDeletePlayer = async (id: string) => {
    if (!confirm("Delete this player?")) return;
    await api(`/api/admin/players/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teams &amp; Players</h1>

      <section className="card">
        <h2 className="text-lg font-bold mb-3">Add team</h2>
        <form onSubmit={onAddTeam} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Team name</label>
            <input name="name" className="input" required />
          </div>
          <div>
            <label className="label">Short name</label>
            <input name="shortName" className="input" maxLength={4} required />
          </div>
          <div>
            <label className="label">Captain</label>
            <input name="captain" className="input" />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input name="logoUrl" className="input" />
          </div>
          <div>
            <label className="label">Group</label>
            <select name="groupId" className="input" defaultValue="">
              <option value="">— No group —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy}>Add team</button>
          </div>
        </form>
      </section>

      {teams.map((t) => (
        <section key={t.id} className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{t.name} <span className="text-sm text-[var(--muted)] font-normal">({t.shortName})</span></h3>
              <div className="text-xs text-[var(--muted)]">
                {t.group?.name ?? "No group"} · Captain: {t.captain ?? "—"}
              </div>
            </div>
            <button className="btn-danger" onClick={() => onDeleteTeam(t.id)}>Delete team</button>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-bold mb-2">Players ({t.players.length})</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {t.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--muted)]">{p.role}</div>
                  </div>
                  <button className="btn" onClick={() => onDeletePlayer(p.id)}>Remove</button>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => onAddPlayer(e, t.id)} className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="label">Player name</label>
                <input name="name" className="input" required />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" className="input" defaultValue="BATTER">
                  <option value="BATTER">Batter</option>
                  <option value="BOWLER">Bowler</option>
                  <option value="ALLROUNDER">All-rounder</option>
                  <option value="WICKETKEEPER">Wicket-keeper</option>
                </select>
              </div>
              <button className="btn-primary">Add player</button>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}
