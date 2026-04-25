"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Team = { id: string; name: string; shortName: string };
type Venue = { id: string; name: string };
type Scorer = { id: string; username: string; name: string | null };
type Fixture = {
  id: string;
  matchNumber: number;
  groupName: string | null;
  scheduledAt: string | Date;
  overs: number;
  status: string;
  resultText: string | null;
  tossWinnerId: string | null;
  tossDecision: string | null;
  teamA: Team;
  teamB: Team;
  venue: Venue;
  scorer: Scorer | null;
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

export function FixturesAdmin({
  fixtures,
  teams,
  venues,
  scorers,
}: {
  fixtures: Fixture[];
  teams: Team[];
  venues: Venue[];
  scorers: Scorer[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/fixtures", {
        body: {
          teamAId: fd.get("teamAId"),
          teamBId: fd.get("teamBId"),
          venueId: fd.get("venueId"),
          groupName: fd.get("groupName") || null,
          scheduledAt: fd.get("scheduledAt"),
          overs: Number(fd.get("overs") || 20),
          scorerId: fd.get("scorerId") || null,
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
    if (!confirm("Delete fixture and all its data?")) return;
    await api(`/api/admin/fixtures/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const onReset = async (id: string) => {
    if (!confirm("Reset this match? This wipes ALL innings and ball events.")) return;
    await api(`/api/admin/match/${id}/reset-score`, { body: {} });
    router.refresh();
  };

  const onPatch = async (id: string, data: Record<string, unknown>) => {
    await api(`/api/admin/fixtures/${id}`, { method: "PATCH", body: data });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fixtures</h1>

      <section className="card">
        <h2 className="text-lg font-bold mb-3">Add fixture</h2>
        <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Team A</label>
            <select name="teamAId" className="input" required>
              <option value="">— Select —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Team B</label>
            <select name="teamBId" className="input" required>
              <option value="">— Select —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Venue</label>
            <select name="venueId" className="input" required>
              <option value="">— Select —</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Group (label)</label>
            <input name="groupName" className="input" placeholder="Group A" />
          </div>
          <div>
            <label className="label">Scheduled date/time</label>
            <input name="scheduledAt" type="datetime-local" className="input" required />
          </div>
          <div>
            <label className="label">Overs</label>
            <input name="overs" type="number" min={1} max={50} defaultValue={20} className="input" required />
          </div>
          <div>
            <label className="label">Scorer</label>
            <select name="scorerId" className="input" defaultValue="">
              <option value="">— Unassigned —</option>
              {scorers.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.username}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button className="btn-primary" disabled={busy}>Add fixture</button>
          </div>
        </form>
      </section>

      <section className="card scroll-x overflow-x-auto">
        <table className="table-cricket min-w-[1100px]">
          <thead>
            <tr>
              <th>#</th>
              <th>Match</th>
              <th>Group</th>
              <th>Venue</th>
              <th>Scheduled</th>
              <th>Overs</th>
              <th>Status</th>
              <th>Scorer</th>
              <th>Toss</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((f) => (
              <tr key={f.id}>
                <td>{f.matchNumber}</td>
                <td className="font-medium">
                  <Link href={`/match/${f.id}`} className="hover:text-[var(--accent)]">
                    {f.teamA.name} vs {f.teamB.name}
                  </Link>
                </td>
                <td>{f.groupName ?? "—"}</td>
                <td>{f.venue.name}</td>
                <td className="whitespace-nowrap">
                  {new Date(f.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>{f.overs}</td>
                <td>
                  <select
                    className="input"
                    defaultValue={f.status}
                    onChange={(e) => onPatch(f.id, { status: e.target.value })}
                  >
                    {["SCHEDULED","LIVE","INNINGS_BREAK","COMPLETED","ABANDONED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="input"
                    defaultValue={f.scorer?.id ?? ""}
                    onChange={(e) => onPatch(f.id, { scorerId: e.target.value || null })}
                  >
                    <option value="">—</option>
                    {scorers.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.username}</option>)}
                  </select>
                </td>
                <td>
                  <div className="flex gap-1">
                    <select
                      className="input"
                      defaultValue={f.tossWinnerId ?? ""}
                      onChange={(e) => onPatch(f.id, { tossWinnerId: e.target.value || null })}
                    >
                      <option value="">— Winner —</option>
                      <option value={f.teamA.id}>{f.teamA.shortName}</option>
                      <option value={f.teamB.id}>{f.teamB.shortName}</option>
                    </select>
                    <select
                      className="input"
                      defaultValue={f.tossDecision ?? ""}
                      onChange={(e) => onPatch(f.id, { tossDecision: e.target.value || null })}
                    >
                      <option value="">— Decision —</option>
                      <option value="BAT">Bat</option>
                      <option value="BOWL">Bowl</option>
                    </select>
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn" onClick={() => onReset(f.id)}>Reset score</button>
                    <button className="btn-danger" onClick={() => onDelete(f.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
