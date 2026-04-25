import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FixturesPage() {
  const matches = await prisma.match.findMany({
    include: { teamA: true, teamB: true, venue: true, winner: true },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fixtures</h1>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/match/${m.id}`}
            className="card block active:scale-[0.99] transition"
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Match #{m.matchNumber} · {m.groupName ?? "—"}</span>
              <span className={`badge ${m.status === "LIVE" ? "badge-live" : ""}`}>
                {m.status}
              </span>
            </div>
            <div className="mt-1 font-semibold leading-tight">
              {m.teamA.name} <span className="text-[var(--muted)] font-normal">vs</span> {m.teamB.name}
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {formatDateTime(m.scheduledAt)} · {m.venue.name}
            </div>
            {m.resultText && (
              <div className="mt-1 text-xs text-[var(--accent)]">{m.resultText}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden sm:block card scroll-x overflow-x-auto">
        <table className="table-cricket min-w-[800px]">
          <thead>
            <tr>
              <th>#</th>
              <th>Date &amp; Time</th>
              <th>Match</th>
              <th>Group</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td>{m.matchNumber}</td>
                <td className="whitespace-nowrap">{formatDateTime(m.scheduledAt)}</td>
                <td>
                  <Link href={`/match/${m.id}`} className="hover:text-[var(--accent)] font-medium">
                    {m.teamA.name} vs {m.teamB.name}
                  </Link>
                </td>
                <td>{m.groupName ?? "—"}</td>
                <td>{m.venue.name}</td>
                <td>
                  <span className={`badge ${m.status === "LIVE" ? "badge-live" : ""}`}>
                    {m.status}
                  </span>
                </td>
                <td className="text-sm">{m.resultText ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
