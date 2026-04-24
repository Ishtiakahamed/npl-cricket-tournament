// ICC-style points table with NRR.

import { prisma } from "./prisma";

export interface TeamStanding {
  teamId: string;
  teamName: string;
  shortName: string;
  groupName: string | null;
  matches: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  ballsFaced: number;
  runsAgainst: number;
  ballsBowled: number;
  nrr: number;
}

export async function computePointsTable(): Promise<TeamStanding[]> {
  const teams = await prisma.team.findMany({ include: { group: true } });
  const matches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    include: { innings: true },
  });
  const abandoned = await prisma.match.findMany({
    where: { status: "ABANDONED" },
    include: { innings: true },
  });

  const stats = new Map<string, TeamStanding>();
  for (const t of teams) {
    stats.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
      groupName: t.group?.name ?? null,
      matches: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsFor: 0,
      ballsFaced: 0,
      runsAgainst: 0,
      ballsBowled: 0,
      nrr: 0,
    });
  }

  for (const m of matches) {
    const a = stats.get(m.teamAId);
    const b = stats.get(m.teamBId);
    if (!a || !b) continue;
    a.matches += 1;
    b.matches += 1;

    // Add run totals from innings
    // NRR: runs scored / overs faced - runs conceded / overs bowled
    // If team was all-out in less than full overs, full quota counts toward overs faced (ICC rule).
    for (const inn of m.innings) {
      const battingTeamStats = stats.get(inn.battingTeamId);
      const bowlingTeamStats = stats.get(inn.bowlingTeamId);
      if (!battingTeamStats || !bowlingTeamStats) continue;
      // full-overs adjustment: if all out (10 wickets), count match overs * 6 as balls faced
      const balls = inn.wickets >= 10 ? m.overs * 6 : inn.legalBalls;
      battingTeamStats.runsFor += inn.runs;
      battingTeamStats.ballsFaced += balls;
      bowlingTeamStats.runsAgainst += inn.runs;
      bowlingTeamStats.ballsBowled += balls;
    }

    if (m.winnerId) {
      const winner = stats.get(m.winnerId);
      const loserId = m.winnerId === m.teamAId ? m.teamBId : m.teamAId;
      const loser = stats.get(loserId);
      if (winner) {
        winner.won += 1;
        winner.points += 2;
      }
      if (loser) loser.lost += 1;
    } else if (m.resultText === "Match Tied") {
      a.tied += 1;
      b.tied += 1;
      a.points += 1;
      b.points += 1;
    } else {
      a.noResult += 1;
      b.noResult += 1;
      a.points += 1;
      b.points += 1;
    }
  }

  for (const m of abandoned) {
    const a = stats.get(m.teamAId);
    const b = stats.get(m.teamBId);
    if (!a || !b) continue;
    a.matches += 1;
    b.matches += 1;
    a.noResult += 1;
    b.noResult += 1;
    a.points += 1;
    b.points += 1;
  }

  for (const s of stats.values()) {
    const oversFaced = s.ballsFaced / 6;
    const oversBowled = s.ballsBowled / 6;
    const scoringRate = oversFaced > 0 ? s.runsFor / oversFaced : 0;
    const concedingRate = oversBowled > 0 ? s.runsAgainst / oversBowled : 0;
    s.nrr = Math.round((scoringRate - concedingRate) * 1000) / 1000;
  }

  return Array.from(stats.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
}
