import { computePointsTable } from "@/lib/points-table";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  const standings = await computePointsTable();
  const groups = new Map<string, typeof standings>();
  for (const s of standings) {
    const key = s.groupName ?? "Overall";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points Table</h1>
        <p className="text-sm text-[var(--muted)]">
          Win = 2 pts · Tie / No Result = 1 pt · Loss = 0 pts. Sorted by points, then Net Run Rate.
        </p>
      </div>
      {Array.from(groups.entries()).map(([group, rows]) => (
        <section key={group} className="card scroll-x overflow-x-auto">
          <h2 className="mb-3 text-lg font-bold">{group}</h2>
          <table className="table-cricket min-w-[560px]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Team</th>
                <th className="text-right">M</th>
                <th className="text-right">W</th>
                <th className="text-right">L</th>
                <th className="text-right hidden sm:table-cell">T</th>
                <th className="text-right hidden sm:table-cell">NR</th>
                <th className="text-right">Pts</th>
                <th className="text-right">NRR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.teamId}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{s.teamName}</td>
                  <td className="text-right font-mono">{s.matches}</td>
                  <td className="text-right font-mono">{s.won}</td>
                  <td className="text-right font-mono">{s.lost}</td>
                  <td className="text-right font-mono hidden sm:table-cell">{s.tied}</td>
                  <td className="text-right font-mono hidden sm:table-cell">{s.noResult}</td>
                  <td className="text-right font-mono font-bold">{s.points}</td>
                  <td className={`text-right font-mono ${s.nrr >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                    {s.nrr >= 0 ? "+" : ""}
                    {s.nrr.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
