import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  BATTER: "Batter",
  BOWLER: "Bowler",
  ALLROUNDER: "All-rounder",
  WICKETKEEPER: "Wicket-keeper",
};

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: { group: true, players: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teams &amp; Squads</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((t) => (
          <section key={t.id} id={t.id} className="card">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-black font-black text-lg">
                {t.shortName}
              </div>
              <div>
                <h2 className="text-lg font-bold">{t.name}</h2>
                <div className="text-xs text-[var(--muted)]">
                  {t.group?.name ?? "—"} {t.captain ? `· Captain: ${t.captain}` : ""}
                </div>
              </div>
            </div>
            <div className="mt-4 divide-y divide-[var(--border)]">
              {t.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-[var(--muted)]">{roleLabel[p.role] ?? p.role}</span>
                </div>
              ))}
              {t.players.length === 0 && (
                <p className="text-sm text-[var(--muted)] py-2">No players yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
