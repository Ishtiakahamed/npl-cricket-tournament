// Core cricket scoring engine.
//
// Strategy: we store immutable BallEvent rows per delivery. After each mutation
// we recompute innings totals and scorecards from the event log. This makes
// undo trivial (delete last event, recompute) and guarantees consistency.

import { prisma } from "./prisma";

export type ExtraType = "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "PENALTY";
export type WicketType =
  | "BOWLED"
  | "CAUGHT"
  | "RUN_OUT"
  | "LBW"
  | "STUMPED"
  | "HIT_WICKET"
  | "RETIRED";

export interface BallInput {
  runs: number; // runs off the bat, OR runs on byes/leg-byes, OR runs on no-ball in addition to penalty
  extraType: ExtraType;
  extraRuns?: number; // for BYE/LEG_BYE/PENALTY where runs aren't off the bat
  isWicket?: boolean;
  wicketType?: WicketType;
  outPlayerId?: string;
  newBatterId?: string;
  newBowlerId?: string; // used for manual bowler change
  commentary?: string;
}

// Given a ball input, compute normalised fields. Rules:
// - WIDE: +1 run + any extras marked via `runs` (wide+2 = 3 extras, 0 off the bat). isLegal = false.
// - NO_BALL: +1 no-ball penalty + `runs` off the bat (or byes). isLegal = false.
//     If combined with BYE/LEG_BYE (we don't model combo here; user enters it as NO_BALL with runs),
//     we attribute those runs to batter for simplicity of UI.
// - BYE: runs are byes (not credited to batter). isLegal = true.
// - LEG_BYE: runs are leg-byes (not credited to batter). isLegal = true.
// - PENALTY: extraRuns penalty runs added. isLegal = true (rare; admin usually sets).
// - NONE: runs are off the bat. isLegal = true.

export interface NormalisedBall {
  isLegal: boolean;
  runsToBatter: number;
  extraRuns: number; // runs that are NOT off the bat
  extraType: ExtraType;
  totalRuns: number; // runs that go to team total for this delivery
}

export function normaliseBall(input: BallInput): NormalisedBall {
  const runs = Math.max(0, input.runs || 0);
  const extra = input.extraType;
  switch (extra) {
    case "WIDE": {
      // wide = 1 + additional wide runs (captured as `runs` value — e.g. "wide + 2" means 3 total)
      return {
        isLegal: false,
        runsToBatter: 0,
        extraRuns: 1 + runs,
        extraType: "WIDE",
        totalRuns: 1 + runs,
      };
    }
    case "NO_BALL": {
      // no-ball = 1 penalty + `runs` off the bat (attributed to batter)
      return {
        isLegal: false,
        runsToBatter: runs,
        extraRuns: 1,
        extraType: "NO_BALL",
        totalRuns: 1 + runs,
      };
    }
    case "BYE": {
      return {
        isLegal: true,
        runsToBatter: 0,
        extraRuns: runs,
        extraType: "BYE",
        totalRuns: runs,
      };
    }
    case "LEG_BYE": {
      return {
        isLegal: true,
        runsToBatter: 0,
        extraRuns: runs,
        extraType: "LEG_BYE",
        totalRuns: runs,
      };
    }
    case "PENALTY": {
      const pr = Math.max(0, input.extraRuns ?? 0);
      return {
        isLegal: true,
        runsToBatter: 0,
        extraRuns: pr,
        extraType: "PENALTY",
        totalRuns: pr,
      };
    }
    case "NONE":
    default: {
      return {
        isLegal: true,
        runsToBatter: runs,
        extraRuns: 0,
        extraType: "NONE",
        totalRuns: runs,
      };
    }
  }
}

// Recompute innings aggregates and scorecards from ball events.
export async function recomputeInnings(inningsId: string) {
  const innings = await prisma.innings.findUniqueOrThrow({
    where: { id: inningsId },
    include: {
      balls: { orderBy: { sequence: "asc" } },
      match: true,
    },
  });

  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;
  let penalties = 0;

  // reset scorecards
  await prisma.batterCard.updateMany({
    where: { inningsId },
    data: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: null },
  });
  await prisma.bowlerCard.updateMany({
    where: { inningsId },
    data: { legalBalls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, maidens: 0 },
  });
  await prisma.fallOfWicket.deleteMany({ where: { inningsId } });

  // Track per-over bowler runs to compute maidens later if needed
  const bowlerOverStats = new Map<string, { ballsThisOver: number; runsThisOver: number }>();
  let lastOverNumber = -1;

  for (const b of innings.balls) {
    const extraType = b.extraType as ExtraType;
    const isLegal = b.isLegal;
    if (isLegal) legalBalls += 1;
    if (extraType === "WIDE") wides += b.extraRuns;
    if (extraType === "NO_BALL") noBalls += b.extraRuns; // 1 typically
    if (extraType === "BYE") byes += b.extraRuns;
    if (extraType === "LEG_BYE") legByes += b.extraRuns;
    if (extraType === "PENALTY") penalties += b.extraRuns;

    runs += b.runs + b.extraRuns;

    // update batter card for striker
    const batter = await prisma.batterCard.findUnique({
      where: { inningsId_playerId: { inningsId, playerId: b.strikerId } },
    });
    if (batter) {
      const newRuns = batter.runs + (extraType === "NO_BALL" || extraType === "NONE" ? b.runs : 0);
      const faced = isLegal ? batter.balls + 1 : batter.balls; // legal balls faced
      const fours =
        (extraType === "NONE" || extraType === "NO_BALL") && b.runs === 4
          ? batter.fours + 1
          : batter.fours;
      const sixes =
        (extraType === "NONE" || extraType === "NO_BALL") && b.runs === 6
          ? batter.sixes + 1
          : batter.sixes;
      await prisma.batterCard.update({
        where: { inningsId_playerId: { inningsId, playerId: b.strikerId } },
        data: { runs: newRuns, balls: faced, fours, sixes },
      });
    }

    // update bowler card
    const bowler = await prisma.bowlerCard.findUnique({
      where: { inningsId_playerId: { inningsId, playerId: b.bowlerId } },
    });
    if (bowler) {
      const bLegal = isLegal ? bowler.legalBalls + 1 : bowler.legalBalls;
      // Runs conceded: everything EXCEPT byes/leg-byes/penalty
      const runsConceded =
        extraType === "BYE" || extraType === "LEG_BYE" || extraType === "PENALTY"
          ? 0
          : b.runs + b.extraRuns;
      const bRuns = bowler.runs + runsConceded;
      const bWkts =
        b.isWicket && b.wicketType && b.wicketType !== "RUN_OUT" && b.wicketType !== "RETIRED"
          ? bowler.wickets + 1
          : bowler.wickets;
      const bWides =
        extraType === "WIDE" ? bowler.wides + b.extraRuns : bowler.wides;
      const bNoBalls =
        extraType === "NO_BALL" ? bowler.noBalls + b.extraRuns : bowler.noBalls;
      await prisma.bowlerCard.update({
        where: { inningsId_playerId: { inningsId, playerId: b.bowlerId } },
        data: {
          legalBalls: bLegal,
          runs: bRuns,
          wickets: bWkts,
          wides: bWides,
          noBalls: bNoBalls,
        },
      });

      // maiden tracking
      if (b.overNumber !== lastOverNumber) {
        // previous over complete? if 6 legal balls and 0 runs → maiden for that bowler
        // We'll compute maidens in a second pass more simply below.
        lastOverNumber = b.overNumber;
      }
      const key = `${b.bowlerId}:${b.overNumber}`;
      const cur = bowlerOverStats.get(key) || { ballsThisOver: 0, runsThisOver: 0 };
      if (isLegal) cur.ballsThisOver += 1;
      cur.runsThisOver += runsConceded;
      bowlerOverStats.set(key, cur);
    }

    if (b.isWicket) {
      wickets += 1;
      // mark batter out
      if (b.outPlayerId) {
        const bc = await prisma.batterCard.findUnique({
          where: { inningsId_playerId: { inningsId, playerId: b.outPlayerId } },
        });
        if (bc) {
          const bowlerPlayer = await prisma.player.findUnique({ where: { id: b.bowlerId } });
          const dismissal = formatDismissal(b.wicketType as WicketType, bowlerPlayer?.name);
          await prisma.batterCard.update({
            where: { inningsId_playerId: { inningsId, playerId: b.outPlayerId } },
            data: { isOut: true, dismissal },
          });
        }
        // fall of wicket
        const playerRec = await prisma.player.findUnique({ where: { id: b.outPlayerId } });
        await prisma.fallOfWicket.create({
          data: {
            inningsId,
            wicketNo: wickets,
            runs,
            overs: formatOversFromLegal(legalBalls),
            batterName: playerRec?.name ?? "",
          },
        });
      }
    }
  }

  // Compute maidens
  const maidensByBowler = new Map<string, number>();
  for (const [key, val] of bowlerOverStats.entries()) {
    if (val.ballsThisOver === 6 && val.runsThisOver === 0) {
      const bowlerId = key.split(":")[0];
      maidensByBowler.set(bowlerId, (maidensByBowler.get(bowlerId) ?? 0) + 1);
    }
  }
  for (const [bowlerId, maidens] of maidensByBowler.entries()) {
    await prisma.bowlerCard.update({
      where: { inningsId_playerId: { inningsId, playerId: bowlerId } },
      data: { maidens },
    });
  }

  const extras = wides + noBalls + byes + legByes + penalties;

  await prisma.innings.update({
    where: { id: inningsId },
    data: {
      runs,
      wickets,
      legalBalls,
      extras,
      wides,
      noBalls,
      byes,
      legByes,
      penalties,
    },
  });
}

export function formatOversFromLegal(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function formatDismissal(wicketType: WicketType, bowlerName?: string): string {
  switch (wicketType) {
    case "BOWLED":
      return bowlerName ? `b ${bowlerName}` : "bowled";
    case "CAUGHT":
      return bowlerName ? `c & b ${bowlerName}` : "caught";
    case "LBW":
      return bowlerName ? `lbw b ${bowlerName}` : "lbw";
    case "STUMPED":
      return bowlerName ? `st b ${bowlerName}` : "stumped";
    case "HIT_WICKET":
      return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";
    case "RUN_OUT":
      return "run out";
    case "RETIRED":
      return "retired";
  }
}

// Determine how strike should rotate after a ball.
// Rules:
//   - strike changes on odd runs (scored off the bat OR byes/legbyes/wide-with-runs)
//   - strike changes at end of legal over (6th legal ball)
// Wickets where the striker is out: the new batter takes strike by default
// unless it's the end of the over.
export function shouldSwapStrike(params: {
  totalRunsThisBall: number;
  isLegal: boolean;
  ballInOver: number; // 1..6 AFTER this ball, for legal balls only
}): boolean {
  const odd = params.totalRunsThisBall % 2 === 1;
  const endOfOver = params.isLegal && params.ballInOver === 6;
  return odd !== endOfOver; // XOR: both flip twice → no swap
}
