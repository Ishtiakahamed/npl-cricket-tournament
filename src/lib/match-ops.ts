// Higher-level match operations that combine DB writes with scoring engine.

import { prisma } from "./prisma";
import { normaliseBall, recomputeInnings, shouldSwapStrike, type BallInput } from "./scoring";
import { publish } from "./events";

export async function getMatchWithState(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: { include: { players: true } },
      teamB: { include: { players: true } },
      venue: true,
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
      scorer: true,
      winner: true,
      tossWinner: true,
    },
  });
}

export interface StartInningsInput {
  matchId: string;
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  battingOrder: string[]; // ordered list of batter IDs (all 11)
  bowlingPlayerIds: string[]; // list of bowler IDs available (playing XI of bowling team, 11)
  strikerId: string;
  nonStrikerId: string;
  openingBowlerId: string;
}

export async function startInnings(input: StartInningsInput) {
  const target =
    input.inningsNumber === 2
      ? await computeTargetFor2ndInnings(input.matchId)
      : null;

  const innings = await prisma.innings.create({
    data: {
      matchId: input.matchId,
      inningsNumber: input.inningsNumber,
      battingTeamId: input.battingTeamId,
      bowlingTeamId: input.bowlingTeamId,
      currentStrikerId: input.strikerId,
      currentNonStrikerId: input.nonStrikerId,
      currentBowlerId: input.openingBowlerId,
      target: target ?? undefined,
    },
  });

  // Create batter cards for all 11 batters
  for (let i = 0; i < input.battingOrder.length; i++) {
    await prisma.batterCard.create({
      data: {
        inningsId: innings.id,
        playerId: input.battingOrder[i],
        order: i + 1,
      },
    });
  }
  // Create bowler cards for all 11 bowling-side players (any may bowl)
  for (const pid of input.bowlingPlayerIds) {
    await prisma.bowlerCard.create({
      data: {
        inningsId: innings.id,
        playerId: pid,
      },
    });
  }

  await prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: "LIVE",
      currentInningsNumber: input.inningsNumber,
    },
  });

  publish(input.matchId);
  return innings;
}

async function computeTargetFor2ndInnings(matchId: string): Promise<number | null> {
  const first = await prisma.innings.findFirst({
    where: { matchId, inningsNumber: 1 },
  });
  if (!first) return null;
  return first.runs + 1;
}

// Add a ball to the current innings.
export async function addBall(
  matchId: string,
  input: BallInput & { newBowlerId?: string }
) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      innings: {
        where: { isClosed: false },
        orderBy: { inningsNumber: "desc" },
        take: 1,
      },
    },
  });
  const innings = match.innings[0];
  if (!innings) throw new Error("No open innings");
  if (!innings.currentStrikerId || !innings.currentNonStrikerId || !innings.currentBowlerId) {
    throw new Error("Innings not configured (striker/nonstriker/bowler missing)");
  }

  const norm = normaliseBall(input);

  // Determine next sequence
  const last = await prisma.ballEvent.findFirst({
    where: { inningsId: innings.id },
    orderBy: { sequence: "desc" },
  });
  const sequence = (last?.sequence ?? 0) + 1;

  // overNumber and ballInOver based on legal balls BEFORE this delivery
  const legalBallsBefore = innings.legalBalls;
  const overNumber = Math.floor(legalBallsBefore / 6);
  const ballInOverAfter = norm.isLegal ? (legalBallsBefore % 6) + 1 : legalBallsBefore % 6;

  // Create the event
  await prisma.ballEvent.create({
    data: {
      inningsId: innings.id,
      sequence,
      overNumber,
      ballInOver: ballInOverAfter,
      isLegal: norm.isLegal,
      strikerId: innings.currentStrikerId,
      nonStrikerId: innings.currentNonStrikerId,
      bowlerId: innings.currentBowlerId,
      runs: norm.runsToBatter,
      extraType: norm.extraType,
      extraRuns: norm.extraRuns,
      isWicket: !!input.isWicket,
      wicketType: input.wicketType,
      outPlayerId: input.outPlayerId,
      commentary: input.commentary,
    },
  });

  // Recompute innings aggregates & scorecards
  await recomputeInnings(innings.id);

  // Determine new striker/non-striker/bowler state
  const swap = shouldSwapStrike({
    totalRunsThisBall: norm.totalRuns,
    isLegal: norm.isLegal,
    ballInOver: ballInOverAfter,
  });

  let newStriker = innings.currentStrikerId;
  let newNonStriker = innings.currentNonStrikerId;
  let newBowler = innings.currentBowlerId;

  // Wicket handling: if striker is out, new batter replaces striker.
  // If non-striker is run out, non-striker is replaced.
  if (input.isWicket && input.outPlayerId && input.newBatterId) {
    if (input.outPlayerId === innings.currentStrikerId) {
      newStriker = input.newBatterId;
    } else if (input.outPlayerId === innings.currentNonStrikerId) {
      newNonStriker = input.newBatterId;
    }
  }

  // Apply strike swap AFTER wicket-replacement
  if (swap) {
    const tmp = newStriker;
    newStriker = newNonStriker;
    newNonStriker = tmp;
  }

  // Bowler change: allowed only at end of over
  const endOfOver = norm.isLegal && ballInOverAfter === 6;
  if (endOfOver && input.newBowlerId) {
    newBowler = input.newBowlerId;
  }

  await prisma.innings.update({
    where: { id: innings.id },
    data: {
      currentStrikerId: newStriker,
      currentNonStrikerId: newNonStriker,
      currentBowlerId: newBowler,
    },
  });

  // Auto-complete innings if:
  // - all out (wickets == 10)
  // - overs exhausted (legalBalls == overs * 6)
  // - chasing and target reached
  const refreshed = await prisma.innings.findUniqueOrThrow({ where: { id: innings.id } });
  let innClosed = false;
  if (refreshed.wickets >= 10) innClosed = true;
  if (refreshed.legalBalls >= match.overs * 6) innClosed = true;
  if (refreshed.target && refreshed.runs >= refreshed.target) innClosed = true;

  if (innClosed) {
    await prisma.innings.update({ where: { id: innings.id }, data: { isClosed: true } });
    if (innings.inningsNumber === 1) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "INNINGS_BREAK" },
      });
    } else {
      await completeMatch(matchId);
    }
  }

  publish(matchId);
}

export async function undoLastBall(matchId: string) {
  const innings = await prisma.innings.findFirst({
    where: { matchId },
    orderBy: { inningsNumber: "desc" },
  });
  if (!innings) throw new Error("No innings");
  const last = await prisma.ballEvent.findFirst({
    where: { inningsId: innings.id },
    orderBy: { sequence: "desc" },
  });
  if (!last) throw new Error("No ball to undo");
  await prisma.ballEvent.delete({ where: { id: last.id } });
  // After undo, re-open innings if it had been closed
  if (innings.isClosed) {
    await prisma.innings.update({ where: { id: innings.id }, data: { isClosed: false } });
    const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
    if (match.status === "INNINGS_BREAK" || match.status === "COMPLETED") {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "LIVE", winnerId: null, resultText: null },
      });
    }
  }
  await recomputeInnings(innings.id);

  // Restore striker/nonstriker/bowler to the values recorded on the now-last ball + strike logic
  const prev = await prisma.ballEvent.findFirst({
    where: { inningsId: innings.id },
    orderBy: { sequence: "desc" },
  });
  if (prev) {
    // Recompute who should be on strike AFTER prev ball
    const totalRuns = prev.runs + prev.extraRuns;
    const swap = shouldSwapStrike({
      totalRunsThisBall: totalRuns,
      isLegal: prev.isLegal,
      ballInOver: prev.ballInOver,
    });
    let striker = prev.strikerId;
    let nonStriker = prev.nonStrikerId;
    // account for wicket replacement on prev ball — best effort: if prev had wicket and new batter is in current innings row already, keep whatever the DB says. Simplest: keep striker/nonStriker as prev recorded + swap.
    if (swap) [striker, nonStriker] = [nonStriker, striker];
    await prisma.innings.update({
      where: { id: innings.id },
      data: {
        currentStrikerId: striker,
        currentNonStrikerId: nonStriker,
        currentBowlerId: prev.bowlerId,
      },
    });
  }

  publish(matchId);
}

export async function changeBowler(matchId: string, bowlerId: string) {
  const innings = await prisma.innings.findFirst({
    where: { matchId, isClosed: false },
    orderBy: { inningsNumber: "desc" },
  });
  if (!innings) throw new Error("No open innings");
  await prisma.innings.update({
    where: { id: innings.id },
    data: { currentBowlerId: bowlerId },
  });
  publish(matchId);
}

export async function endInningsManual(matchId: string) {
  const innings = await prisma.innings.findFirst({
    where: { matchId, isClosed: false },
    orderBy: { inningsNumber: "desc" },
  });
  if (!innings) throw new Error("No open innings");
  await prisma.innings.update({ where: { id: innings.id }, data: { isClosed: true } });
  if (innings.inningsNumber === 1) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "INNINGS_BREAK" },
    });
  } else {
    await completeMatch(matchId);
  }
  publish(matchId);
}

export async function completeMatch(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      innings: { include: { battingTeam: true } },
      teamA: true,
      teamB: true,
    },
  });
  const first = match.innings.find((i) => i.inningsNumber === 1);
  const second = match.innings.find((i) => i.inningsNumber === 2);

  let winnerId: string | null = null;
  let resultText = "No Result";

  if (first && second) {
    if (second.runs > first.runs) {
      winnerId = second.battingTeamId;
      const wicketsInHand = 10 - second.wickets;
      resultText = `${second.battingTeam.name} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
    } else if (second.runs < first.runs) {
      winnerId = first.battingTeamId;
      const margin = first.runs - second.runs;
      const firstInningsTeam = match.innings.find((i) => i.inningsNumber === 1)!.battingTeam;
      resultText = `${firstInningsTeam.name} won by ${margin} run${margin === 1 ? "" : "s"}`;
    } else {
      resultText = "Match Tied";
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "COMPLETED", winnerId, resultText },
  });
  publish(matchId);
}

export async function abandonMatch(matchId: string) {
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "ABANDONED", resultText: "Match Abandoned (No Result)" },
  });
  publish(matchId);
}
