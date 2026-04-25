"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Prisma } from "@prisma/client";
import { formatOvers } from "@/lib/utils";

type MatchWithState = Prisma.MatchGetPayload<{
  include: {
    teamA: { include: { players: true } };
    teamB: { include: { players: true } };
    venue: true;
    tossWinner: true;
    winner: true;
    scorer: true;
    innings: {
      orderBy: { inningsNumber: "asc" };
      include: {
        battingTeam: true;
        bowlingTeam: true;
        batterCards: { include: { player: true }; orderBy: { order: "asc" } };
        bowlerCards: { include: { player: true } };
        fallOfWickets: true;
        balls: {
          orderBy: { sequence: "desc" };
          take: 12;
          include: {
            striker: true;
            nonStriker: true;
            bowler: true;
            outPlayer: true;
          };
        };
      };
    };
  };
}>;

async function api(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function ScorerConsole({ match }: { match: MatchWithState }) {
  const router = useRouter();
  const currentInn =
    match.innings.find((i) => !i.isClosed) ??
    (match.currentInningsNumber > 0
      ? match.innings[match.innings.length - 1]
      : undefined);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="card">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-[var(--muted)] truncate">
              Match #{match.matchNumber} · {match.venue.name}
            </div>
            <h2 className="text-base sm:text-xl font-bold leading-tight truncate">
              {match.teamA.name} vs {match.teamB.name}
            </h2>
            {match.tossWinner && match.tossDecision && (
              <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
                Toss: {match.tossWinner.name} chose to {match.tossDecision === "BAT" ? "bat" : "bowl"}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`badge ${match.status === "LIVE" ? "badge-live" : ""}`}>{match.status}</span>
            <a href={`/match/${match.id}`} target="_blank" rel="noreferrer" className="btn !min-h-[32px] !py-1 !px-2 text-xs">
              Public view →
            </a>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-[var(--danger)]/15 border border-[var(--danger)]/40 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>}
      </header>

      {/* Innings-one summary if we're on innings 2 or beyond */}
      {match.innings
        .filter((i) => i !== currentInn)
        .map((inn) => (
          <div key={inn.id} className="card text-sm">
            <div className="font-semibold">
              {inn.battingTeam.name}: {inn.runs}/{inn.wickets} ({formatOvers(inn.legalBalls)} ov)
            </div>
            {inn.isClosed && inn.inningsNumber === 1 && (
              <div className="text-xs text-[var(--muted)]">
                Target for 2nd innings: {inn.runs + 1}
              </div>
            )}
          </div>
        ))}

      {match.status === "COMPLETED" && (
        <div className="card bg-[var(--surface-2)]">
          <h3 className="text-lg font-bold">Result</h3>
          <p>{match.resultText}</p>
        </div>
      )}

      {/* Toss setup (if not yet set) */}
      {!match.tossWinner && match.status === "SCHEDULED" && (
        <TossSetup matchId={match.id} teamA={match.teamA} teamB={match.teamB} onDone={() => router.refresh()} />
      )}

      {/* Setup innings if needed */}
      {match.tossWinner &&
        (match.status === "SCHEDULED" || match.status === "INNINGS_BREAK") &&
        !currentInn && (
          <SetupInningsCard
            match={match}
            inningsNumber={match.innings.length === 0 ? 1 : 2}
            onStart={(input) => call(() => api(`/api/scorer/match/${match.id}/start-innings`, input))}
            busy={busy}
          />
        )}

      {currentInn && !currentInn.isClosed && (
        <ScoringPanel
          match={match}
          innings={currentInn}
          busy={busy}
          onBall={(body) => call(() => api(`/api/scorer/match/${match.id}/ball`, body))}
          onUndo={() => call(() => api(`/api/scorer/match/${match.id}/undo`))}
          onChangeBowler={(bowlerId) => call(() => api(`/api/scorer/match/${match.id}/bowler`, { bowlerId }))}
          onEndInnings={() => {
            if (!confirm("End this innings now?")) return;
            call(() => api(`/api/scorer/match/${match.id}/end-innings`));
          }}
        />
      )}
    </div>
  );
}

/** ==================== Toss Setup ==================== */

function TossSetup({
  matchId,
  teamA,
  teamB,
  onDone,
}: {
  matchId: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  onDone: () => void;
}) {
  const [winner, setWinner] = useState(teamA.id);
  const [decision, setDecision] = useState<"BAT" | "BOWL">("BAT");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/fixtures/${matchId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tossWinnerId: winner, tossDecision: decision }),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-2">Toss</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Winner</label>
          <select className="input" value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value={teamA.id}>{teamA.name}</option>
            <option value={teamB.id}>{teamB.name}</option>
          </select>
        </div>
        <div>
          <label className="label">Decision</label>
          <select className="input" value={decision} onChange={(e) => setDecision(e.target.value as "BAT" | "BOWL")}>
            <option value="BAT">Bat first</option>
            <option value="BOWL">Bowl first</option>
          </select>
        </div>
      </div>
      <button className="btn-primary mt-3" onClick={submit} disabled={saving}>
        {saving ? "Saving..." : "Save toss"}
      </button>
    </div>
  );
}

/** ==================== Setup Innings ==================== */

type PlayerLite = { id: string; name: string; role: string };

function SetupInningsCard({
  match,
  inningsNumber,
  onStart,
  busy,
}: {
  match: MatchWithState;
  inningsNumber: 1 | 2;
  onStart: (input: {
    inningsNumber: 1 | 2;
    battingTeamId: string;
    bowlingTeamId: string;
    battingOrder: string[];
    bowlingPlayerIds: string[];
    strikerId: string;
    nonStrikerId: string;
    openingBowlerId: string;
  }) => void;
  busy: boolean;
}) {
  // Determine batting/bowling teams based on toss + innings number
  const { battingTeam, bowlingTeam } = useMemo(() => {
    const tossWinsBat = match.tossDecision === "BAT";
    const tossTeamId = match.tossWinnerId!;
    const firstBatTeamId =
      tossWinsBat ? tossTeamId : tossTeamId === match.teamAId ? match.teamBId : match.teamAId;
    if (inningsNumber === 1) {
      return firstBatTeamId === match.teamAId
        ? { battingTeam: match.teamA, bowlingTeam: match.teamB }
        : { battingTeam: match.teamB, bowlingTeam: match.teamA };
    }
    return firstBatTeamId === match.teamAId
      ? { battingTeam: match.teamB, bowlingTeam: match.teamA }
      : { battingTeam: match.teamA, bowlingTeam: match.teamB };
  }, [match, inningsNumber]);

  const [battingXI, setBattingXI] = useState<string[]>(
    battingTeam.players.slice(0, 11).map((p) => p.id)
  );
  const [bowlingXI, setBowlingXI] = useState<string[]>(
    bowlingTeam.players.slice(0, 11).map((p) => p.id)
  );
  const [strikerId, setStrikerId] = useState<string>(battingXI[0] ?? "");
  const [nonStrikerId, setNonStrikerId] = useState<string>(battingXI[1] ?? "");
  const [openingBowlerId, setOpeningBowlerId] = useState<string>(bowlingXI[0] ?? "");

  const togglePlayer = (list: string[], setList: (v: string[]) => void, id: string) => {
    if (list.includes(id)) {
      if (list.length > 2) setList(list.filter((p) => p !== id));
    } else if (list.length < 11) {
      setList([...list, id]);
    }
  };

  const moveUp = (list: string[], setList: (v: string[]) => void, id: string) => {
    const idx = list.indexOf(id);
    if (idx <= 0) return;
    const next = [...list];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setList(next);
  };
  const moveDown = (list: string[], setList: (v: string[]) => void, id: string) => {
    const idx = list.indexOf(id);
    if (idx < 0 || idx >= list.length - 1) return;
    const next = [...list];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setList(next);
  };

  const canStart =
    battingXI.length === 11 &&
    bowlingXI.length === 11 &&
    strikerId &&
    nonStrikerId &&
    strikerId !== nonStrikerId &&
    openingBowlerId;

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold">Start {inningsNumber === 1 ? "1st" : "2nd"} innings</h3>
      <div className="text-sm text-[var(--muted)]">
        Batting: <strong>{battingTeam.name}</strong> · Bowling: <strong>{bowlingTeam.name}</strong>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <XIPicker
          title={`${battingTeam.name} — Batting XI (in order)`}
          players={battingTeam.players}
          selected={battingXI}
          onToggle={(id) => togglePlayer(battingXI, setBattingXI, id)}
          onUp={(id) => moveUp(battingXI, setBattingXI, id)}
          onDown={(id) => moveDown(battingXI, setBattingXI, id)}
        />
        <XIPicker
          title={`${bowlingTeam.name} — Bowling XI`}
          players={bowlingTeam.players}
          selected={bowlingXI}
          onToggle={(id) => togglePlayer(bowlingXI, setBowlingXI, id)}
          onUp={(id) => moveUp(bowlingXI, setBowlingXI, id)}
          onDown={(id) => moveDown(bowlingXI, setBowlingXI, id)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Striker</label>
          <select className="input" value={strikerId} onChange={(e) => setStrikerId(e.target.value)}>
            {battingXI.map((id) => {
              const p = battingTeam.players.find((x) => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {p?.name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="label">Non-striker</label>
          <select className="input" value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)}>
            {battingXI.map((id) => {
              const p = battingTeam.players.find((x) => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {p?.name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="label">Opening bowler</label>
          <select className="input" value={openingBowlerId} onChange={(e) => setOpeningBowlerId(e.target.value)}>
            {bowlingXI.map((id) => {
              const p = bowlingTeam.players.find((x) => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {p?.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!canStart || busy}
        onClick={() =>
          onStart({
            inningsNumber,
            battingTeamId: battingTeam.id,
            bowlingTeamId: bowlingTeam.id,
            battingOrder: battingXI,
            bowlingPlayerIds: bowlingXI,
            strikerId,
            nonStrikerId,
            openingBowlerId,
          })
        }
      >
        {busy ? "Starting..." : "Start innings"}
      </button>
    </div>
  );
}

function XIPicker({
  title,
  players,
  selected,
  onToggle,
  onUp,
  onDown,
}: {
  title: string;
  players: PlayerLite[];
  selected: string[];
  onToggle: (id: string) => void;
  onUp: (id: string) => void;
  onDown: (id: string) => void;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-3">
      <div className="font-semibold text-sm mb-2">{title} ({selected.length}/11)</div>
      <ol className="space-y-1 text-sm">
        {selected.map((id, i) => {
          const p = players.find((x) => x.id === id);
          if (!p) return null;
          return (
            <li key={id} className="flex items-center gap-2 rounded bg-[var(--surface)] px-2 py-1">
              <span className="w-6 text-xs text-[var(--muted)]">{i + 1}.</span>
              <span className="flex-1">{p.name} <span className="text-xs text-[var(--muted)]">{p.role}</span></span>
              <button className="btn text-xs py-1 px-2" onClick={() => onUp(id)}>↑</button>
              <button className="btn text-xs py-1 px-2" onClick={() => onDown(id)}>↓</button>
              <button className="btn text-xs py-1 px-2" onClick={() => onToggle(id)}>✕</button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 text-xs text-[var(--muted)]">Bench:</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {players
          .filter((p) => !selected.includes(p.id))
          .map((p) => (
            <button
              key={p.id}
              className="btn text-xs py-1 px-2"
              disabled={selected.length >= 11}
              onClick={() => onToggle(p.id)}
            >
              + {p.name}
            </button>
          ))}
      </div>
    </div>
  );
}

/** ==================== Scoring Panel ==================== */

type InningsState = MatchWithState["innings"][number];
type BallEvent = InningsState["balls"][number];

function ScoringPanel({
  match,
  innings,
  busy,
  onBall,
  onUndo,
  onChangeBowler,
  onEndInnings,
}: {
  match: MatchWithState;
  innings: InningsState;
  busy: boolean;
  onBall: (b: {
    runs: number;
    extraType: "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "PENALTY";
    extraRuns?: number;
    isWicket?: boolean;
    wicketType?: string;
    outPlayerId?: string;
    newBatterId?: string;
    newBowlerId?: string;
    commentary?: string;
  }) => void;
  onUndo: () => void;
  onChangeBowler: (bowlerId: string) => void;
  onEndInnings: () => void;
}) {
  const striker = innings.batterCards.find((b) => b.playerId === innings.currentStrikerId);
  const nonStriker = innings.batterCards.find((b) => b.playerId === innings.currentNonStrikerId);
  const bowler = innings.bowlerCards.find((b) => b.playerId === innings.currentBowlerId);

  const rr = innings.legalBalls > 0 ? (innings.runs / innings.legalBalls) * 6 : 0;
  const ballsRemaining = match.overs * 6 - innings.legalBalls;
  const rrr =
    innings.target && ballsRemaining > 0
      ? ((innings.target - innings.runs) / ballsRemaining) * 6
      : 0;

  const [extraType, setExtraType] = useState<"NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE">("NONE");
  const [commentary, setCommentary] = useState("");
  const [wicketDialog, setWicketDialog] = useState(false);
  const [bowlerDialog, setBowlerDialog] = useState(false);

  const reset = () => {
    setExtraType("NONE");
    setCommentary("");
  };

  const submitRuns = (runs: number) => {
    onBall({
      runs,
      extraType,
      commentary: commentary || undefined,
    });
    reset();
  };

  // Last 6 balls (this over display)
  const last6 = [...innings.balls].slice(0, 6).reverse();

  const endOfOverApproaching =
    innings.legalBalls > 0 && innings.legalBalls % 6 === 0 && last6.length > 0;

  const availableBatters = innings.batterCards.filter(
    (b) => !b.isOut && b.playerId !== innings.currentStrikerId && b.playerId !== innings.currentNonStrikerId
  );
  const availableBowlers = innings.bowlerCards;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Sticky score header — always visible while scrolling */}
      <div className="sticky top-[56px] sm:top-[64px] z-20 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="card !rounded-none sm:!rounded-xl border-x-0 sm:border-x">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-[var(--muted)] truncate">
                {innings.battingTeam.name} · {innings.inningsNumber === 1 ? "1st" : "2nd"} innings
              </div>
              <div className="score-big text-3xl sm:text-4xl font-black leading-none">
                {innings.runs}/{innings.wickets}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[var(--muted)] mt-0.5">
                {formatOvers(innings.legalBalls)} / {match.overs} ov · RR {rr.toFixed(2)}
              </div>
            </div>
            <div className="text-right shrink-0">
              {innings.target ? (
                <>
                  <div className="text-[10px] sm:text-xs text-[var(--muted)]">Need</div>
                  <div className="text-base sm:text-xl font-bold">
                    {Math.max(0, innings.target - innings.runs)}
                    <span className="text-xs text-[var(--muted)] font-normal"> in {ballsRemaining}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--muted)]">RRR {rrr.toFixed(2)}</div>
                </>
              ) : (
                <>
                  <div className="text-[10px] sm:text-xs text-[var(--muted)]">Extras</div>
                  <div className="text-sm font-mono">{innings.extras}</div>
                </>
              )}
            </div>
          </div>

          {/* Last 6 balls */}
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scroll-x">
              <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] shrink-0 mr-1">
                This over
              </span>
              {last6.length === 0 && <span className="text-sm text-[var(--muted)]">—</span>}
              {last6.map((b) => (
                <span
                  key={b.id}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold shrink-0 ${ballBadgeClass(b)}`}
                >
                  {ballLabel(b)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Batters / bowler */}
      <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
        <div className="card text-sm space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Batting</div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              <strong>{striker?.player.name ?? "—"}</strong>
              <span className="text-[var(--accent)]"> *</span>
            </span>
            <span className="font-mono shrink-0">{striker?.runs ?? 0} ({striker?.balls ?? 0})</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{nonStriker?.player.name ?? "—"}</span>
            <span className="font-mono shrink-0">{nonStriker?.runs ?? 0} ({nonStriker?.balls ?? 0})</span>
          </div>
        </div>
        <div className="card text-sm space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Bowling</div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate"><strong>{bowler?.player.name ?? "—"}</strong></span>
            <span className="font-mono text-xs shrink-0">
              {bowler ? `${formatOvers(bowler.legalBalls)}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : "—"}
            </span>
          </div>
          <button className="btn w-full !min-h-[36px] !py-1.5" onClick={() => setBowlerDialog(true)}>
            Change bowler
          </button>
        </div>
      </div>

      {/* Delivery type */}
      <div className="card">
        <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-2">Delivery type</div>
        <div className="grid grid-cols-5 gap-1.5">
          {([
            ["NONE", "Legal"],
            ["WIDE", "Wide"],
            ["NO_BALL", "No-Ball"],
            ["BYE", "Bye"],
            ["LEG_BYE", "Leg-Bye"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              className={`rounded-lg border border-[var(--border)] py-2.5 text-xs sm:text-sm font-semibold transition active:scale-[0.97] ${
                extraType === val
                  ? "bg-[var(--accent)] text-black border-transparent"
                  : "bg-[var(--surface-2)]"
              }`}
              onClick={() => setExtraType(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Run buttons */}
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-2">
            {extraType === "WIDE" && "Extra runs on the wide (0 = wide+0)"}
            {extraType === "NO_BALL" && "Runs off the bat (no-ball penalty +1 auto)"}
            {extraType === "BYE" && "Byes"}
            {extraType === "LEG_BYE" && "Leg-byes"}
            {extraType === "NONE" && "Runs off the bat"}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                className={`h-16 sm:h-16 rounded-xl text-3xl sm:text-2xl font-black active:scale-95 transition ${
                  r === 4
                    ? "bg-[var(--accent)] text-black"
                    : r === 6
                      ? "bg-purple-500 text-white"
                      : "bg-[var(--surface-2)] hover:bg-[var(--border)]"
                }`}
                disabled={busy}
                onClick={() => submitRuns(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Wicket / Undo */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn-danger !h-14 text-base font-bold" onClick={() => setWicketDialog(true)}>
            WICKET
          </button>
          <button className="btn !h-14 text-base font-bold" onClick={onUndo} disabled={busy}>
            UNDO
          </button>
        </div>

        {/* Commentary */}
        <div className="mt-3">
          <label className="label">Short comment (optional)</label>
          <input
            className="input"
            placeholder='e.g. "FOUR! Great cover drive"'
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
          />
        </div>

        {endOfOverApproaching && (
          <p className="mt-3 rounded-lg bg-[var(--warn)]/15 border border-[var(--warn)]/40 px-3 py-2 text-xs text-[var(--warn)]">
            End of over — choose a new bowler before the next ball.
          </p>
        )}

        {/* End innings */}
        <div className="mt-3">
          <button className="btn-danger w-full" onClick={onEndInnings} disabled={busy}>
            End innings
          </button>
        </div>
      </div>

      {wicketDialog && (
        <WicketDialog
          innings={innings}
          onCancel={() => setWicketDialog(false)}
          onSubmit={(data) => {
            onBall({
              runs: data.runs,
              extraType,
              isWicket: true,
              wicketType: data.wicketType,
              outPlayerId: data.outPlayerId,
              newBatterId: data.newBatterId,
              commentary: commentary || undefined,
            });
            setWicketDialog(false);
            reset();
          }}
          availableBatters={availableBatters}
        />
      )}

      {bowlerDialog && (
        <BowlerDialog
          bowlers={availableBowlers}
          currentBowlerId={innings.currentBowlerId ?? ""}
          onCancel={() => setBowlerDialog(false)}
          onSubmit={(id) => {
            onChangeBowler(id);
            setBowlerDialog(false);
          }}
        />
      )}
    </div>
  );
}

function WicketDialog({
  innings,
  onCancel,
  onSubmit,
  availableBatters,
}: {
  innings: InningsState;
  onCancel: () => void;
  onSubmit: (v: { wicketType: string; outPlayerId: string; runs: number; newBatterId: string }) => void;
  availableBatters: InningsState["batterCards"];
}) {
  const [wicketType, setWicketType] = useState("BOWLED");
  const [outPlayerId, setOutPlayerId] = useState(innings.currentStrikerId ?? "");
  const [runs, setRuns] = useState(0);
  const [newBatterId, setNewBatterId] = useState(availableBatters[0]?.playerId ?? "");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="card w-full max-w-md rounded-b-none sm:rounded-xl max-h-[92vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-3">Wicket</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Out batter</label>
            <select className="input" value={outPlayerId} onChange={(e) => setOutPlayerId(e.target.value)}>
              {innings.currentStrikerId && (
                <option value={innings.currentStrikerId}>
                  {innings.batterCards.find((b) => b.playerId === innings.currentStrikerId)?.player.name} (striker)
                </option>
              )}
              {innings.currentNonStrikerId && (
                <option value={innings.currentNonStrikerId}>
                  {innings.batterCards.find((b) => b.playerId === innings.currentNonStrikerId)?.player.name} (non-striker)
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="label">Wicket type</label>
            <select className="input" value={wicketType} onChange={(e) => setWicketType(e.target.value)}>
              <option value="BOWLED">Bowled</option>
              <option value="CAUGHT">Caught</option>
              <option value="LBW">LBW</option>
              <option value="RUN_OUT">Run out</option>
              <option value="STUMPED">Stumped</option>
              <option value="HIT_WICKET">Hit wicket</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
          <div>
            <label className="label">Runs on this ball (e.g. run-out after completed runs)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={6}
              value={runs}
              onChange={(e) => setRuns(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">New batter</label>
            <select className="input" value={newBatterId} onChange={(e) => setNewBatterId(e.target.value)}>
              {availableBatters.map((b) => (
                <option key={b.id} value={b.playerId}>{b.player.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="btn !h-12" onClick={onCancel}>Cancel</button>
            <button
              className="btn-danger !h-12"
              onClick={() => onSubmit({ wicketType, outPlayerId, runs, newBatterId })}
            >
              Record wicket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BowlerDialog({
  bowlers,
  currentBowlerId,
  onCancel,
  onSubmit,
}: {
  bowlers: InningsState["bowlerCards"];
  currentBowlerId: string;
  onCancel: () => void;
  onSubmit: (id: string) => void;
}) {
  const [id, setId] = useState(currentBowlerId);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="card w-full max-w-md rounded-b-none sm:rounded-xl max-h-[92vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-3">Change bowler</h3>
        <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
          {bowlers.map((b) => (
            <option key={b.id} value={b.playerId}>
              {b.player.name} — {formatOvers(b.legalBalls)}ov, {b.runs} runs, {b.wickets} wkts
            </option>
          ))}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn !h-12" onClick={onCancel}>Cancel</button>
          <button className="btn-primary !h-12" onClick={() => onSubmit(id)}>Set bowler</button>
        </div>
      </div>
    </div>
  );
}

function ballLabel(b: BallEvent) {
  if (b.isWicket) return "W";
  if (b.extraType === "WIDE") return b.extraRuns > 1 ? `wd${b.extraRuns}` : "wd";
  if (b.extraType === "NO_BALL") return b.runs > 0 ? `nb${b.runs}` : `nb${b.extraRuns}`;
  if (b.extraType === "BYE") return `b${b.extraRuns}`;
  if (b.extraType === "LEG_BYE") return `lb${b.extraRuns}`;
  return String(b.runs);
}
function ballBadgeClass(b: BallEvent) {
  if (b.isWicket) return "bg-[var(--danger)] text-white";
  if (b.extraType !== "NONE") return "bg-[var(--warn)] text-black";
  if (b.runs === 4) return "bg-[var(--accent)] text-black";
  if (b.runs === 6) return "bg-purple-500 text-white";
  return "bg-[var(--surface-2)]";
}
