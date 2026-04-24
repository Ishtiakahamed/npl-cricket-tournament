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
        <section key={group} className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-bold">{group}</h2>
          <table className="table-cricket min-w-[700px]">
            <thead>
              <tr>
                <th>#</th>
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
              {rows.map((s, i) => (
                <tr key={s.teamId}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{s.teamName}</td>
                  <td>{s.matches}</td>
                  <td>{s.won}</td>
                  <td>{s.lost}</td>
                  <td>{s.tied}</td>
                  <td>{s.noResult}</td>
                  <td className="font-bold">{s.points}</td>
                  <td className={s.nrr >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
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
