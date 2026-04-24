import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    include: { _count: { select: { matches: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Venues</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {venues.map((v) => (
          <div key={v.id} className="card">
            <div className="text-lg font-bold">{v.name}</div>
            <div className="text-sm text-[var(--muted)]">{v.city ?? "—"}</div>
            <div className="mt-2 text-xs text-[var(--muted)]">
              {v.capacity ? `Capacity: ${v.capacity.toLocaleString()}` : "Capacity: —"} ·{" "}
              {v._count.matches} match{v._count.matches === 1 ? "" : "es"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
