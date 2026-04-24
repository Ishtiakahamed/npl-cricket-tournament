import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcRequiredRunRate, calcRunRate, formatDateTime, formatOvers } from "@/lib/utils";
import { LiveRefresher } from "@/components/LiveRefresher";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teamA: true,
      teamB: true,
      venue: true,
      tossWinner: true,
      winner: true,
      innings: {
        orderBy: { inningsNumber: "asc" },
        include: {
          battingTeam: true,
          bowlingTeam: true,
          batterCards: { include: { player: true }, orderBy: { order: "asc" } },
          bowlerCards: { include: { player: true } },
          fallOfWickets: { orderBy: { wicketNo: "asc" } },
          balls: {
            orderBy: { sequence: "desc" },
            take: 12,
            include: {
              striker: true,
              nonStriker: true,
              bowler: true,
              outPlayer: true,
            },
          },
        },
      },
    },
  });
  if (!match) notFound();

  const currentInn =
    match.innings.find((i) => !i.isClosed) ?? match.innings[match.innings.length - 1];

  const striker = currentInn?.batterCards.find((b) => b.playerId === currentInn.currentStrikerId);
  const nonStriker = currentInn?.batterCards.find((b) => b.playerId === currentInn.currentNonStrikerId);
  const bowler = currentInn?.bowlerCards.find((b) => b.playerId === currentInn.currentBowlerId);

  const partnership = currentInn ? computePartnership(currentInn) : null;
  const last6 = currentInn ? [...currentInn.balls].slice(0, 6).reverse() : [];

  const rr = currentInn ? calcRunRate(currentInn.runs, currentInn.legalBalls) : 0;
  const ballsRemaining = currentInn
    ? match.overs * 6 - currentInn.legalBalls
    : 0;
  const rrr =
    currentInn && currentInn.target
      ? calcRequiredRunRate(currentInn.target - currentInn.runs, ballsRemaining)
      : 0;

  return (
    <div className="space-y-6">
      <LiveRefresher matchId={match.id} />
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/fixtures" className="hover:text-[var(--accent)]">Fixtures</Link>
        <span>/</span>
        <span>Match #{match.matchNumber}</span>
      </div>

      {/* Header */}
      <section className="card">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`badge ${match.status === "LIVE" ? "badge-live" : ""}`}>
            {match.status}
          </span>
          <span className="text-[var(--muted)]">{match.venue.name}</span>
          <span className="text-[var(--muted)]">·</span>
          <span className="text-[var(--muted)]">{formatDateTime(match.scheduledAt)}</span>
          <span className="text-[var(--muted)]">·</span>
          <span className="text-[var(--muted)]">{match.overs} overs</span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold">
          {match.teamA.name} vs {match.teamB.name}
        </h1>
        {match.tossWinner && (
          <p className="mt-1 text-sm text-[var(--muted)]">
            Toss: {match.tossWinner.name} won and chose to{" "}
            {match.tossDecision === "BAT" ? "bat" : "bowl"}
          </p>
        )}
        {match.resultText && (
          <p className="mt-2 text-sm font-medium text-[var(--accent)]">{match.resultText}</p>
        )}
      </section>

      {/* Innings cards */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className="card">
          {currentInn ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[var(--muted)]">
                    {currentInn.battingTeam.name} — {currentInn.inningsNumber === 1 ? "1st" : "2nd"} innings
                  </div>
                  <div className="mt-1 score-big text-4xl font-black">
                    {currentInn.runs}/{currentInn.wickets}
                    <span className="ml-3 text-base font-semibold text-[var(--muted)]">
                      ({formatOvers(currentInn.legalBalls)} / {match.overs} ov)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--muted)]">Run Rate</div>
                  <div className="text-2xl font-bold">{rr.toFixed(2)}</div>
                  {currentInn.target && (
                    <>
                      <div className="mt-2 text-xs text-[var(--muted)]">Target / RRR</div>
                      <div className="text-sm font-semibold">
                        {currentInn.target} · {rrr.toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Current batters / bowler */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[var(--surface-2)] p-3">
                  <div className="text-xs text-[var(--muted)]">Batting</div>
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {striker?.player.name ?? "—"}{" "}
                        <span className="text-[var(--accent)]">*</span>
                      </span>
                      <span className="font-mono">
                        {striker?.runs ?? 0} ({striker?.balls ?? 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{nonStriker?.player.name ?? "—"}</span>
                      <span className="font-mono">
                        {nonStriker?.runs ?? 0} ({nonStriker?.balls ?? 0})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--surface-2)] p-3">
                  <div className="text-xs text-[var(--muted)]">Bowling</div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span>{bowler?.player.name ?? "—"}</span>
                    <span className="font-mono">
                      {bowler ? `${formatOvers(bowler.legalBalls)}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last 6 balls & partnership */}
              <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr]">
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">This over / last 6 balls</div>
                  <div className="flex gap-1">
                    {last6.length === 0 && (
                      <span className="text-sm text-[var(--muted)]">—</span>
                    )}
                    {last6.map((b) => (
                      <span
                        key={b.id}
                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold ${
                          b.isWicket
                            ? "bg-[var(--danger)] text-white"
                            : b.extraType !== "NONE"
                              ? "bg-[var(--warn)] text-black"
                              : b.runs === 4
                                ? "bg-[var(--accent)] text-black"
                                : b.runs === 6
                                  ? "bg-purple-500 text-white"
                                  : "bg-[var(--surface-2)]"
                        }`}
                        title={b.commentary ?? undefined}
                      >
                        {ballLabel(b)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Partnership</div>
                  <div className="text-sm">
                    {partnership
                      ? `${partnership.runs} runs off ${partnership.balls} balls`
                      : "—"}
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">Extras</div>
                  <div className="text-sm">
                    {currentInn.extras} (w {currentInn.wides}, nb {currentInn.noBalls}, b {currentInn.byes}, lb {currentInn.legByes})
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--muted)]">Match has not started yet.</div>
          )}
        </section>

        {/* Fall of wickets */}
        {currentInn && currentInn.fallOfWickets.length > 0 && (
          <section className="card">
            <h3 className="text-sm font-bold mb-2">Fall of wickets</h3>
            <ul className="space-y-1 text-sm">
              {currentInn.fallOfWickets.map((f) => (
                <li key={f.id} className="flex items-center justify-between">
                  <span className="font-mono">
                    {f.wicketNo}-{f.runs}
                  </span>
                  <span className="text-[var(--muted)]">
                    {f.batterName} · {f.overs} ov
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Full scorecards per innings */}
      {match.innings.map((inn) => (
        <section key={inn.id} className="card">
          <h2 className="text-lg font-bold">
            {inn.battingTeam.name} — {inn.runs}/{inn.wickets}{" "}
            <span className="text-sm text-[var(--muted)] font-normal">
              ({formatOvers(inn.legalBalls)} ov)
            </span>
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="table-cricket min-w-[600px]">
              <thead>
                <tr>
                  <th>Batter</th>
                  <th>Dismissal</th>
                  <th className="text-right">R</th>
                  <th className="text-right">B</th>
                  <th className="text-right">4s</th>
                  <th className="text-right">6s</th>
                  <th className="text-right">SR</th>
                </tr>
              </thead>
              <tbody>
                {inn.batterCards
                  .filter((b) => b.balls > 0 || b.isOut || b.playerId === inn.currentStrikerId || b.playerId === inn.currentNonStrikerId)
                  .map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium">
                        {b.player.name}
                        {b.playerId === inn.currentStrikerId && !inn.isClosed && (
                          <span className="text-[var(--accent)]"> *</span>
                        )}
                      </td>
                      <td className="text-sm text-[var(--muted)]">
                        {b.isOut ? b.dismissal : !inn.isClosed && (b.playerId === inn.currentStrikerId || b.playerId === inn.currentNonStrikerId) ? "not out" : "—"}
                      </td>
                      <td className="text-right font-mono">{b.runs}</td>
                      <td className="text-right font-mono">{b.balls}</td>
                      <td className="text-right font-mono">{b.fours}</td>
                      <td className="text-right font-mono">{b.sixes}</td>
                      <td className="text-right font-mono">
                        {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="table-cricket min-w-[600px]">
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th className="text-right">O</th>
                  <th className="text-right">M</th>
                  <th className="text-right">R</th>
                  <th className="text-right">W</th>
                  <th className="text-right">Econ</th>
                </tr>
              </thead>
              <tbody>
                {inn.bowlerCards
                  .filter((b) => b.legalBalls > 0 || b.wides > 0 || b.noBalls > 0)
                  .map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium">{b.player.name}</td>
                      <td className="text-right font-mono">{formatOvers(b.legalBalls)}</td>
                      <td className="text-right font-mono">{b.maidens}</td>
                      <td className="text-right font-mono">{b.runs}</td>
                      <td className="text-right font-mono">{b.wickets}</td>
                      <td className="text-right font-mono">
                        {b.legalBalls > 0
                          ? ((b.runs / (b.legalBalls / 6)) || 0).toFixed(2)
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

interface InningsForPartnership {
  balls: {
    sequence: number;
    isWicket: boolean;
    isLegal: boolean;
    runs: number;
    extraRuns: number;
  }[];
}

function computePartnership(
  innings: InningsForPartnership
): { runs: number; balls: number } | null {
  // Compute from latest fall-of-wicket onwards
  const balls = innings.balls;
  if (balls.length === 0) return { runs: 0, balls: 0 };
  // find last wicket in sequence order (balls is desc)
  const asc = [...balls].sort((a, b) => a.sequence - b.sequence);
  let runs = 0;
  let legal = 0;
  let lastWicketIdx = -1;
  for (let i = asc.length - 1; i >= 0; i--) {
    if (asc[i].isWicket) {
      lastWicketIdx = i;
      break;
    }
  }
  for (let i = lastWicketIdx + 1; i < asc.length; i++) {
    runs += asc[i].runs + asc[i].extraRuns;
    if (asc[i].isLegal) legal += 1;
  }
  return { runs, balls: legal };
}

function ballLabel(b: { runs: number; extraType: string; extraRuns: number; isWicket: boolean }): string {
  if (b.isWicket) return "W";
  if (b.extraType === "WIDE") return b.extraRuns > 1 ? `wd${b.extraRuns}` : "wd";
  if (b.extraType === "NO_BALL")
    return b.runs > 0 ? `nb${b.runs}` : `nb${b.extraRuns}`;
  if (b.extraType === "BYE") return `b${b.extraRuns}`;
  if (b.extraType === "LEG_BYE") return `lb${b.extraRuns}`;
  return String(b.runs);
}
