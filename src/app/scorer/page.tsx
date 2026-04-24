import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScorerHome() {
  const session = await auth();
  const where =
    session?.user.role === "ADMIN" ? {} : { scorerId: session?.user.id };
  const matches = await prisma.match.findMany({
    where,
    include: { teamA: true, teamB: true, venue: true },
    orderBy: { scheduledAt: "asc" },
  });
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        {session?.user.role === "ADMIN" ? "All matches" : "Your assigned matches"}
      </h2>
      {matches.length === 0 ? (
        <div className="card text-sm text-[var(--muted)]">No matches assigned yet.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {matches.map((m) => (
            <Link key={m.id} href={`/scorer/match/${m.id}`} className="card hover:border-[var(--accent)]">
              <div className="text-xs text-[var(--muted)]">Match #{m.matchNumber} · {m.venue.name}</div>
              <div className="mt-1 font-bold">{m.teamA.name} vs {m.teamB.name}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{formatDateTime(m.scheduledAt)}</div>
              <div className="mt-2"><span className="badge">{m.status}</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
