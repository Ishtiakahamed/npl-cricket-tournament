import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [teams, players, venues, fixtures, scorers, live] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.venue.count(),
    prisma.match.count(),
    prisma.user.count({ where: { role: "SCORER" } }),
    prisma.match.count({ where: { status: "LIVE" } }),
  ]);
  const stats = [
    { label: "Teams", v: teams },
    { label: "Players", v: players },
    { label: "Venues", v: venues },
    { label: "Fixtures", v: fixtures },
    { label: "Scorers", v: scorers },
    { label: "Live matches", v: live },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-xs text-[var(--muted)]">{s.label}</div>
            <div className="mt-1 text-3xl font-black">{s.v}</div>
          </div>
        ))}
      </div>
      <div className="card text-sm text-[var(--muted)]">
        Use the menu on the left to manage teams, players, venues, groups, fixtures, and scorer accounts.
      </div>
    </div>
  );
}
