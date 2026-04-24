import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatOvers } from "@/lib/utils";
import { computePointsTable } from "@/lib/points-table";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [liveMatches, todayMatches, upcoming, results, venues, teams, standings] =
    await Promise.all([
      prisma.match.findMany({
        where: { status: "LIVE" },
        include: { teamA: true, teamB: true, venue: true, innings: true },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.match.findMany({
        where: {
          scheduledAt: { gte: startOfToday, lt: endOfToday },
          status: { in: ["SCHEDULED", "LIVE", "INNINGS_BREAK"] },
        },
        include: { teamA: true, teamB: true, venue: true },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.match.findMany({
        where: { status: "SCHEDULED", scheduledAt: { gte: endOfToday } },
        include: { teamA: true, teamB: true, venue: true },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      prisma.match.findMany({
        where: { status: { in: ["COMPLETED", "ABANDONED"] } },
        include: { teamA: true, teamB: true, winner: true, venue: true },
        orderBy: { scheduledAt: "desc" },
        take: 5,
      }),
      prisma.venue.findMany({ orderBy: { name: "asc" } }),
      prisma.team.findMany({ include: { group: true }, orderBy: { name: "asc" } }),
      computePointsTable(),
    ]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 md:p-10">
        <div className="max-w-2xl">
          <div className="badge mb-3">Season 1</div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            NPL Cricket Tournament
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Follow live scores, fixtures, squads and the points table — ball by ball.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/fixtures" className="btn-primary">View Fixtures</Link>
            <Link href="/points" className="btn">Points Table</Link>
          </div>
        </div>
      </section>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--danger)] animate-pulse" />
            Live now
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {liveMatches.map((m) => {
              const currentInn = m.innings.find((i) => !i.isClosed) ?? m.innings[m.innings.length - 1];
              return (
                <Link
                  key={m.id}
                  href={`/match/${m.id}`}
                  className="card hover:border-[var(--accent)] transition"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Match #{m.matchNumber} · {m.venue.name}</span>
                    <span className="badge badge-live">LIVE</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{m.teamA.name}</div>
                      <div className="text-[var(--muted)] text-sm">{m.teamA.shortName}</div>
                    </div>
                    <div className="text-[var(--muted)] text-sm">vs</div>
                    <div className="text-right">
                      <div className="font-semibold">{m.teamB.name}</div>
                      <div className="text-[var(--muted)] text-sm">{m.teamB.shortName}</div>
                    </div>
                  </div>
                  {currentInn && (
                    <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3 text-sm">
                      <div className="score-big text-2xl font-bold">
                        {currentInn.runs}/{currentInn.wickets}{" "}
                        <span className="text-sm text-[var(--muted)]">
                          ({formatOvers(currentInn.legalBalls)} ov)
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's matches */}
        <section className="card">
          <h2 className="mb-3 text-lg font-bold">Today&apos;s matches</h2>
          {todayMatches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No matches scheduled for today.</p>
          ) : (
            <ul className="space-y-2">
              {todayMatches.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/match/${m.id}`}
                    className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--border)]"
                  >
                    <span>
                      {m.teamA.shortName} vs {m.teamB.shortName}
                    </span>
                    <span className="text-[var(--muted)] text-xs">
                      {formatDateTime(m.scheduledAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming */}
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Upcoming fixtures</h2>
            <Link href="/fixtures" className="text-xs text-[var(--accent)]">See all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No upcoming matches.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                  <span>
                    {m.teamA.shortName} vs {m.teamB.shortName}
                  </span>
                  <span className="text-[var(--muted)] text-xs">
                    {formatDateTime(m.scheduledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent results */}
        <section className="card">
          <h2 className="mb-3 text-lg font-bold">Recent results</h2>
          {results.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No results yet.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((m) => (
                <li key={m.id} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                  <Link href={`/match/${m.id}`} className="block">
                    <div className="font-medium">
                      {m.teamA.shortName} vs {m.teamB.shortName}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {m.resultText ?? m.status}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Points */}
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Points table</h2>
          <Link href="/points" className="text-xs text-[var(--accent)]">Full table →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-cricket">
            <thead>
              <tr>
                <th>Team</th>
                <th>M</th>
                <th>W</th>
                <th>L</th>
                <th>T</th>
                <th>NR</th>
                <th>Pts</th>
                <th>NRR</th>
              </tr>
            </thead>
            <tbody>
              {standings.slice(0, 8).map((s) => (
                <tr key={s.teamId}>
                  <td className="font-medium">{s.teamName}</td>
                  <td>{s.matches}</td>
                  <td>{s.won}</td>
                  <td>{s.lost}</td>
                  <td>{s.tied}</td>
                  <td>{s.noResult}</td>
                  <td className="font-bold">{s.points}</td>
                  <td>{s.nrr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Teams + venues */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Teams</h2>
            <Link href="/teams" className="text-xs text-[var(--accent)]">All squads →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams#${t.id}`}
                className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--border)]"
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {t.group?.name ?? "—"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Venues</h2>
            <Link href="/venues" className="text-xs text-[var(--accent)]">All venues →</Link>
          </div>
          <ul className="space-y-2">
            {venues.map((v) => (
              <li key={v.id} className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {v.city ?? "—"} {v.capacity ? `· cap. ${v.capacity.toLocaleString()}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
